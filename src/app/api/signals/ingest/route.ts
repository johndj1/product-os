import { NextResponse } from "next/server";
import { SignalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ingestSignal } from "@/lib/signal-ingestion";
import {
  deriveSignalTitleFromName,
  getExternalSignalMapping,
  isExternalSignalName,
  isRecord,
  isSignalStatus,
  isSignalType,
} from "@/lib/signals";

type IngestRequestBody = {
  productId?: string;
  productSlug?: string;
  title?: string;
  description?: string;
  signalType?: string;
  severity?: string;
  status?: string;
  linkedWorkItemId?: string;
  source?: string;
  sourceEventId?: string;
  occurredAt?: string;
  tags?: string[];
  payload?: unknown;
  product_slug?: string;
  signal_name?: string;
  timestamp?: string;
  metadata?: unknown;
};

type ExternalSignalRequest = {
  productSlug: string;
  signalName: string;
  timestamp: string;
  metadata: Record<string, unknown>;
};

function logValidationFailure(reason: string, details?: Record<string, unknown>) {
  console.error("[signals] validation failed", { reason, ...details });
}

function hasExternalSignalFields(body: IngestRequestBody): boolean {
  return [body.product_slug, body.signal_name, body.timestamp, body.metadata].some((value) => value !== undefined);
}

function parseExternalSignal(body: IngestRequestBody): ExternalSignalRequest | NextResponse {
  const productSlug = String(body.product_slug ?? "").trim();
  if (!productSlug) {
    logValidationFailure("external_contract_product_slug_required");
    return NextResponse.json({ error: "product_slug is required for the external signal contract." }, { status: 400 });
  }

  const signalName = String(body.signal_name ?? "").trim();
  if (!signalName) {
    logValidationFailure("external_contract_signal_name_required", { productSlug });
    return NextResponse.json({ error: "signal_name is required for the external signal contract." }, { status: 400 });
  }

  if (!isExternalSignalName(signalName)) {
    logValidationFailure("external_contract_signal_name_unknown", { productSlug, signalName });
    return NextResponse.json(
      { error: `signal_name "${signalName}" is not supported by the external signal contract.` },
      { status: 400 },
    );
  }

  const timestamp = String(body.timestamp ?? "").trim();
  if (!timestamp) {
    logValidationFailure("external_contract_timestamp_required", { productSlug, signalName });
    return NextResponse.json({ error: "timestamp is required for the external signal contract." }, { status: 400 });
  }

  const parsedTimestamp = new Date(timestamp);
  if (Number.isNaN(parsedTimestamp.getTime())) {
    logValidationFailure("external_contract_timestamp_invalid", { productSlug, signalName, timestamp });
    return NextResponse.json({ error: "timestamp must be a valid ISO-8601 date-time string." }, { status: 400 });
  }

  if (!isRecord(body.metadata)) {
    logValidationFailure("external_contract_metadata_invalid", { productSlug, signalName });
    return NextResponse.json({ error: "metadata must be a JSON object." }, { status: 400 });
  }

  return {
    productSlug,
    signalName,
    timestamp: parsedTimestamp.toISOString(),
    metadata: body.metadata,
  };
}

export async function POST(request: Request) {
  let body: IngestRequestBody;

  try {
    body = (await request.json()) as IngestRequestBody;
  } catch {
    logValidationFailure("invalid_json_body");
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const externalRequest = hasExternalSignalFields(body) ? parseExternalSignal(body) : null;
  if (externalRequest instanceof NextResponse) {
    return externalRequest;
  }

  const isExternalSignal = externalRequest !== null;
  const externalMapping = isExternalSignal ? getExternalSignalMapping(externalRequest.signalName) : null;

  if (!isExternalSignal && !body.productId && !body.productSlug) {
    logValidationFailure("product_identifier_required");
    return NextResponse.json({ error: "productId or productSlug is required." }, { status: 400 });
  }

  const title = isExternalSignal
    ? externalMapping?.title ?? deriveSignalTitleFromName(externalRequest.signalName)
    : String(body.title ?? "").trim();
  if (!title) {
    logValidationFailure("title_required");
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  const signalTypeRaw = isExternalSignal
    ? externalMapping?.signalType ?? ""
    : String(body.signalType ?? "").trim();
  if (!isSignalType(signalTypeRaw)) {
    logValidationFailure("signal_type_invalid", { signalTypeRaw });
    return NextResponse.json({ error: "signalType is invalid." }, { status: 400 });
  }

  let status: SignalStatus | undefined;
  if (!isExternalSignal && body.status) {
    const statusRaw = String(body.status).trim();
    if (!isSignalStatus(statusRaw)) {
      logValidationFailure("signal_status_invalid", { statusRaw });
      return NextResponse.json({ error: "status is invalid." }, { status: 400 });
    }
    status = statusRaw;
  }

  const productWhere = isExternalSignal
    ? { slug: externalRequest.productSlug }
    : {
        OR: [{ id: body.productId }, { slug: body.productSlug }],
      };

  const product = await prisma.product.findFirst({
    where: productWhere,
    select: { id: true, slug: true },
  });

  if (!product) {
    const productLookup = isExternalSignal ? externalRequest.productSlug : body.productId ?? body.productSlug ?? "unknown";
    console.error("[signals] product lookup failed", { product: productLookup, contract: isExternalSignal ? "external" : "internal" });
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  let linkedWorkItemId: string | undefined;
  if (!isExternalSignal && body.linkedWorkItemId) {
    const workItem = await prisma.workItem.findFirst({
      where: {
        id: body.linkedWorkItemId,
        product_id: product.id,
      },
      select: { id: true },
    });

    if (!workItem) {
      return NextResponse.json({ error: "linkedWorkItemId is invalid for this Product." }, { status: 400 });
    }

    linkedWorkItemId = workItem.id;
  }

  const source = isExternalSignal
    ? product.slug
    : String(body.source ?? "api_ingest").trim() || "api_ingest";
  const sourceEventId = isExternalSignal ? undefined : body.sourceEventId ? String(body.sourceEventId).trim() : undefined;
  const occurredAtRaw = isExternalSignal ? externalRequest.timestamp : body.occurredAt ? String(body.occurredAt).trim() : undefined;
  let occurredAt: string | undefined;
  let occurredAtDate: Date | undefined;

  if (occurredAtRaw) {
    const parsed = new Date(occurredAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      logValidationFailure("occurred_at_invalid", { occurredAtRaw, contract: isExternalSignal ? "external" : "internal" });
      return NextResponse.json({ error: "occurredAt must be a valid ISO-8601 date-time string." }, { status: 400 });
    }
    occurredAt = parsed.toISOString();
    occurredAtDate = parsed;
  }

  const tags = isExternalSignal
    ? []
    : Array.isArray(body.tags)
    ? body.tags
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const severity = isExternalSignal
    ? externalMapping?.defaultSeverity ?? null
    : body.severity?.trim() || null;
  const description = isExternalSignal ? null : body.description?.trim() || null;
  const payload = isExternalSignal
    ? {
        source,
        sourceEventId: null,
        occurredAt: occurredAt || null,
        tags,
        externalSignal: {
          signalName: externalRequest.signalName,
          title: deriveSignalTitleFromName(externalRequest.signalName),
          contract: "product_signal_v1",
        },
        raw: externalRequest.metadata,
      }
    : {
        source,
        sourceEventId: sourceEventId || null,
        occurredAt: occurredAt || null,
        tags,
        raw: body.payload ?? null,
      };

  const result = await ingestSignal(prisma, {
    productId: product.id,
    title,
    description,
    signalType: signalTypeRaw,
    severity,
    status,
    occurredAt: occurredAtDate,
    linkedWorkItemId,
    payload,
  });

  if (isExternalSignal) {
    console.info("[signals] accepted external signal", {
      product: product.slug,
      signalName: externalRequest.signalName,
      signalType: signalTypeRaw,
      severity: severity ?? null,
      signalId: result.signalId,
    });
  }

  return NextResponse.json(
    {
      signalId: result.signalId,
      productId: product.id,
      productSlug: product.slug,
      createdFollowUp: result.createdFollowUp,
      followUpWorkItemId: result.followUpWorkItemId,
      routingNote: result.routingNote,
    },
    { status: 201 },
  );
}

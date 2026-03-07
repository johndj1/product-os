import { NextResponse } from "next/server";
import { SignalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ingestSignal } from "@/lib/signal-ingestion";
import { isSignalStatus, isSignalType } from "@/lib/signals";

type IngestRequestBody = {
  productId?: string;
  productSlug?: string;
  title?: string;
  description?: string;
  signalType?: string;
  severity?: string;
  status?: string;
  linkedWorkItemId?: string;
  payload?: unknown;
};

export async function POST(request: Request) {
  let body: IngestRequestBody;

  try {
    body = (await request.json()) as IngestRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.productId && !body.productSlug) {
    return NextResponse.json({ error: "productId or productSlug is required." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  const signalTypeRaw = String(body.signalType ?? "").trim();
  if (!isSignalType(signalTypeRaw)) {
    return NextResponse.json({ error: "signalType is invalid." }, { status: 400 });
  }

  let status: SignalStatus | undefined;
  if (body.status) {
    const statusRaw = String(body.status).trim();
    if (!isSignalStatus(statusRaw)) {
      return NextResponse.json({ error: "status is invalid." }, { status: 400 });
    }
    status = statusRaw;
  }

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: body.productId }, { slug: body.productSlug }],
    },
    select: { id: true, slug: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  let linkedWorkItemId: string | undefined;
  if (body.linkedWorkItemId) {
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

  const result = await ingestSignal(prisma, {
    productId: product.id,
    title,
    description: body.description?.trim() || null,
    signalType: signalTypeRaw,
    severity: body.severity?.trim() || null,
    status,
    linkedWorkItemId,
    payload: {
      source: "api_ingest",
      raw: body.payload ?? null,
    },
  });

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

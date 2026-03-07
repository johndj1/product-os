import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestSignal } from "@/lib/signal-ingestion";
import { isSignalType } from "@/lib/signals";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { productId } = await context.params;
  const formData = await request.formData();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const severity = String(formData.get("severity") ?? "").trim();
  const signalTypeRaw = String(formData.get("signal_type") ?? "").trim();
  const workItemIdRaw = String(formData.get("work_item_id") ?? "").trim();

  if (!title) {
    return NextResponse.redirect(new URL(`/products/${productId}/signals?error=signal_title_required`, request.url));
  }

  if (!isSignalType(signalTypeRaw)) {
    return NextResponse.redirect(new URL(`/products/${productId}/signals?error=signal_type_invalid`, request.url));
  }

  let linkedWorkItemId: string | undefined;

  if (workItemIdRaw) {
    const workItem = await prisma.workItem.findFirst({
      where: { id: workItemIdRaw, product_id: productId },
      select: { id: true },
    });

    if (!workItem) {
      return NextResponse.redirect(new URL(`/products/${productId}/signals?error=signal_workitem_invalid`, request.url));
    }

    linkedWorkItemId = workItem.id;
  }

  await ingestSignal(prisma, {
    productId,
    title,
    description: description || null,
    signalType: signalTypeRaw,
    severity: severity || null,
    linkedWorkItemId,
    payload: {
      source: "manual_form",
    },
  });

  return NextResponse.redirect(new URL(`/products/${productId}/signals?success=signal_created`, request.url));
}

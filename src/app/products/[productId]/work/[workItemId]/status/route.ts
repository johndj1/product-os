import { WorkItemStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WORK_ITEM_STATUS_VALUES } from "@/lib/work-item-rules";

type RouteContext = {
  params: Promise<{ productId: string; workItemId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { productId, workItemId } = await context.params;
  const formData = await request.formData();

  const statusRaw = String(formData.get("status") ?? "").trim();

  if (!WORK_ITEM_STATUS_VALUES.includes(statusRaw as (typeof WORK_ITEM_STATUS_VALUES)[number])) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=workitem_status_invalid`, request.url));
  }

  const workItem = await prisma.workItem.findFirst({
    where: { id: workItemId, product_id: productId },
    select: { id: true },
  });

  if (!workItem) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=workitem_not_found`, request.url));
  }

  await prisma.workItem.update({
    where: { id: workItem.id },
    data: { status: statusRaw as WorkItemStatus },
  });

  return NextResponse.redirect(new URL(`/products/${productId}/work?success=workitem_status_updated`, request.url));
}

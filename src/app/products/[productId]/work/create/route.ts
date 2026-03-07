import { WorkItemStatus, WorkItemType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAllowedChildType } from "@/lib/work-item-hierarchy";
import { WORK_ITEM_STATUS_VALUES, WORK_ITEM_TYPE_VALUES } from "@/lib/work-item-rules";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { productId } = await context.params;
  const formData = await request.formData();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const acceptanceCriteria = String(formData.get("acceptance_criteria") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();
  const parentIdRaw = String(formData.get("parent_id") ?? "").trim();

  if (!title) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=workitem_title_required`, request.url));
  }

  if (!WORK_ITEM_TYPE_VALUES.includes(typeRaw as (typeof WORK_ITEM_TYPE_VALUES)[number])) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=workitem_type_invalid`, request.url));
  }

  if (statusRaw && !WORK_ITEM_STATUS_VALUES.includes(statusRaw as (typeof WORK_ITEM_STATUS_VALUES)[number])) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=workitem_status_invalid`, request.url));
  }

  const type = typeRaw as WorkItemType;
  const status = (statusRaw || "new") as WorkItemStatus;
  let parentId: string | undefined;

  if (parentIdRaw) {
    const parent = await prisma.workItem.findFirst({
      where: { id: parentIdRaw, product_id: productId },
      select: { id: true, type: true },
    });

    if (!parent) {
      return NextResponse.redirect(new URL(`/products/${productId}/work?error=workitem_parent_not_found`, request.url));
    }

    try {
      assertAllowedChildType(parent.type, type);
    } catch {
      return NextResponse.redirect(new URL(`/products/${productId}/work?error=workitem_parent_type_invalid`, request.url));
    }

    parentId = parent.id;
  }

  await prisma.workItem.create({
    data: {
      title,
      description: description || null,
      acceptance_criteria: acceptanceCriteria || null,
      type,
      status,
      parent_id: parentId,
      product_id: productId,
    },
  });

  return NextResponse.redirect(new URL(`/products/${productId}/work?success=workitem_created`, request.url));
}

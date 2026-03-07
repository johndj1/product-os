import { RelationshipType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RELATIONSHIP_TYPE_VALUES } from "@/lib/relationships";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { productId } = await context.params;
  const formData = await request.formData();

  const fromWorkItemId = String(formData.get("from_work_item_id") ?? "").trim();
  const toWorkItemId = String(formData.get("to_work_item_id") ?? "").trim();
  const relationshipTypeRaw = String(formData.get("relationship_type") ?? "").trim();

  if (!fromWorkItemId || !toWorkItemId) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=relationship_workitems_required`, request.url));
  }

  if (fromWorkItemId === toWorkItemId) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=relationship_self_link_not_allowed`, request.url));
  }

  if (!RELATIONSHIP_TYPE_VALUES.includes(relationshipTypeRaw as (typeof RELATIONSHIP_TYPE_VALUES)[number])) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=relationship_type_invalid`, request.url));
  }

  const workItems = await prisma.workItem.findMany({
    where: {
      product_id: productId,
      id: { in: [fromWorkItemId, toWorkItemId] },
    },
    select: { id: true },
  });

  if (workItems.length !== 2) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=relationship_workitems_invalid`, request.url));
  }

  try {
    await prisma.relationship.create({
      data: {
        product_id: productId,
        from_work_item_id: fromWorkItemId,
        to_work_item_id: toWorkItemId,
        relationship_type: relationshipTypeRaw as RelationshipType,
      },
    });
  } catch {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=relationship_duplicate`, request.url));
  }

  return NextResponse.redirect(new URL(`/products/${productId}/work?success=relationship_created`, request.url));
}

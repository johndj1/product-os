import { EntityLinkType, EntityType } from "@prisma/client";
import { NextResponse } from "next/server";
import { entityExistsInProduct, isEntityLinkType, isEntityType } from "@/lib/entity-links";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { productId } = await context.params;
  const formData = await request.formData();

  const fromEntityTypeRaw = String(formData.get("from_entity_type") ?? "").trim();
  const fromEntityId = String(formData.get("from_entity_id") ?? "").trim();
  const toEntityTypeRaw = String(formData.get("to_entity_type") ?? "").trim();
  const toEntityId = String(formData.get("to_entity_id") ?? "").trim();
  const relationshipTypeRaw = String(formData.get("relationship_type") ?? "").trim();

  if (!fromEntityId || !toEntityId) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=entitylink_entities_required`, request.url));
  }

  if (!isEntityType(fromEntityTypeRaw) || !isEntityType(toEntityTypeRaw)) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=entitylink_entity_type_invalid`, request.url));
  }

  if (!isEntityLinkType(relationshipTypeRaw)) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=entitylink_relationship_type_invalid`, request.url));
  }

  if (fromEntityTypeRaw === toEntityTypeRaw && fromEntityId === toEntityId) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=entitylink_self_link_not_allowed`, request.url));
  }

  const [fromExists, toExists] = await Promise.all([
    entityExistsInProduct(prisma, productId, fromEntityTypeRaw as EntityType, fromEntityId),
    entityExistsInProduct(prisma, productId, toEntityTypeRaw as EntityType, toEntityId),
  ]);

  if (!fromExists || !toExists) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=entitylink_entities_invalid`, request.url));
  }

  try {
    await prisma.entityLink.create({
      data: {
        product_id: productId,
        from_entity_type: fromEntityTypeRaw as EntityType,
        from_entity_id: fromEntityId,
        to_entity_type: toEntityTypeRaw as EntityType,
        to_entity_id: toEntityId,
        relationship_type: relationshipTypeRaw as EntityLinkType,
      },
    });
  } catch {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=entitylink_duplicate`, request.url));
  }

  return NextResponse.redirect(new URL(`/products/${productId}/work?success=entitylink_created`, request.url));
}

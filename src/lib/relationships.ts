import { PrismaClient, RelationshipType } from "@prisma/client";

export const RELATIONSHIP_TYPE_VALUES = ["supports", "relates_to", "blocks", "depends_on", "informs", "impacts"] as const;

export type RelationshipTypeValue = (typeof RELATIONSHIP_TYPE_VALUES)[number];

export type RelationshipEdge = {
  id: string;
  relationshipType: RelationshipType;
  fromWorkItem: {
    id: string;
    title: string;
    type: string;
    status: string;
  };
  toWorkItem: {
    id: string;
    title: string;
    type: string;
    status: string;
  };
};

export async function getRelationshipsForProduct(prisma: PrismaClient, productId: string): Promise<RelationshipEdge[]> {
  const relationships = await prisma.relationship.findMany({
    where: { product_id: productId },
    orderBy: [{ created_at: "desc" }],
    select: {
      id: true,
      relationship_type: true,
      from_work_item: {
        select: { id: true, title: true, type: true, status: true },
      },
      to_work_item: {
        select: { id: true, title: true, type: true, status: true },
      },
    },
  });

  return relationships.map((relationship) => ({
    id: relationship.id,
    relationshipType: relationship.relationship_type,
    fromWorkItem: {
      id: relationship.from_work_item.id,
      title: relationship.from_work_item.title,
      type: relationship.from_work_item.type,
      status: relationship.from_work_item.status,
    },
    toWorkItem: {
      id: relationship.to_work_item.id,
      title: relationship.to_work_item.title,
      type: relationship.to_work_item.type,
      status: relationship.to_work_item.status,
    },
  }));
}

export async function getRelationshipsForWorkItem(
  prisma: PrismaClient,
  productId: string,
  workItemId: string,
): Promise<RelationshipEdge[]> {
  const relationships = await getRelationshipsForProduct(prisma, productId);
  return relationships.filter((relationship) => relationship.fromWorkItem.id === workItemId || relationship.toWorkItem.id === workItemId);
}

export function groupRelationshipsByWorkItem(relationships: RelationshipEdge[]) {
  const outgoingByWorkItem: Record<string, RelationshipEdge[]> = {};
  const incomingByWorkItem: Record<string, RelationshipEdge[]> = {};

  for (const relationship of relationships) {
    if (!outgoingByWorkItem[relationship.fromWorkItem.id]) {
      outgoingByWorkItem[relationship.fromWorkItem.id] = [];
    }
    outgoingByWorkItem[relationship.fromWorkItem.id].push(relationship);

    if (!incomingByWorkItem[relationship.toWorkItem.id]) {
      incomingByWorkItem[relationship.toWorkItem.id] = [];
    }
    incomingByWorkItem[relationship.toWorkItem.id].push(relationship);
  }

  return { outgoingByWorkItem, incomingByWorkItem };
}

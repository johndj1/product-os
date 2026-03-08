import { EntityLinkType, EntityType, Prisma, PrismaClient } from "@prisma/client";

export const ENTITY_TYPE_VALUES = ["product", "work_item", "signal", "page"] as const;
export const ENTITY_LINK_TYPE_VALUES = [
  "measures",
  "impacts",
  "triggered_by",
  "informs",
  "supports",
  "documents",
  "references",
  "relates_to",
  "creates",
] as const;

export type EntityTypeValue = (typeof ENTITY_TYPE_VALUES)[number];
export type EntityLinkTypeValue = (typeof ENTITY_LINK_TYPE_VALUES)[number];

export type EntityLinkNode = {
  entityType: EntityType;
  entityId: string;
  title: string;
  meta: string;
  href: string;
};

export type EntityLinkEdge = {
  id: string;
  relationshipType: EntityLinkType;
  fromEntity: EntityLinkNode;
  toEntity: EntityLinkNode;
  createdAt: Date;
};

export type EntityLinkGroup = {
  outgoing: EntityLinkEdge[];
  incoming: EntityLinkEdge[];
};

export type EntityLinkOption = {
  entityType: EntityType;
  entityId: string;
  label: string;
};

export function isEntityType(value: string): value is EntityTypeValue {
  return ENTITY_TYPE_VALUES.includes(value as EntityTypeValue);
}

export function isEntityLinkType(value: string): value is EntityLinkTypeValue {
  return ENTITY_LINK_TYPE_VALUES.includes(value as EntityLinkTypeValue);
}

export async function entityExistsInProduct(
  prisma: PrismaClient,
  productId: string,
  entityType: EntityType,
  entityId: string,
): Promise<boolean> {
  if (entityType === EntityType.product) {
    const product = await prisma.product.findUnique({
      where: { id: entityId },
      select: { id: true },
    });
    return product?.id === productId;
  }

  if (entityType === EntityType.work_item) {
    const workItem = await prisma.workItem.findFirst({
      where: { id: entityId, product_id: productId },
      select: { id: true },
    });
    return Boolean(workItem);
  }

  if (entityType === EntityType.signal) {
    const signal = await prisma.signal.findFirst({
      where: { id: entityId, product_id: productId },
      select: { id: true },
    });
    return Boolean(signal);
  }

  const page = await prisma.page.findFirst({
    where: { id: entityId, product_id: productId },
    select: { id: true },
  });
  return Boolean(page);
}

async function buildEntityNodeMap(prisma: PrismaClient, productId: string) {
  const [product, workItems, signals, pages] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    }),
    prisma.workItem.findMany({
      where: { product_id: productId },
      orderBy: [{ type: "asc" }, { title: "asc" }],
      select: { id: true, title: true, type: true, status: true },
    }),
    prisma.signal.findMany({
      where: { product_id: productId },
      orderBy: [{ signal_type: "asc" }, { title: "asc" }],
      select: { id: true, title: true, signal_type: true, status: true },
    }),
    prisma.page.findMany({
      where: { product_id: productId },
      orderBy: [{ title: "asc" }],
      select: { id: true, title: true, updated_at: true },
    }),
  ]);

  const nodeMap = new Map<string, EntityLinkNode>();

  if (product) {
    nodeMap.set(`product:${product.id}`, {
      entityType: EntityType.product,
      entityId: product.id,
      title: product.name,
      meta: "product",
      href: `/products/${product.id}`,
    });
  }

  for (const workItem of workItems) {
    nodeMap.set(`work_item:${workItem.id}`, {
      entityType: EntityType.work_item,
      entityId: workItem.id,
      title: workItem.title,
      meta: `${workItem.type} - ${workItem.status}`,
      href: `/products/${productId}/work/${workItem.id}`,
    });
  }

  for (const signal of signals) {
    nodeMap.set(`signal:${signal.id}`, {
      entityType: EntityType.signal,
      entityId: signal.id,
      title: signal.title,
      meta: `${signal.signal_type} - ${signal.status}`,
      href: `/products/${productId}/signals`,
    });
  }

  for (const page of pages) {
    nodeMap.set(`page:${page.id}`, {
      entityType: EntityType.page,
      entityId: page.id,
      title: page.title,
      meta: "page",
      href: `/products/${productId}/pages`,
    });
  }

  return nodeMap;
}

function getFallbackNode(entityType: EntityType, entityId: string, productId: string): EntityLinkNode {
  if (entityType === EntityType.product) {
    return {
      entityType,
      entityId,
      title: "Unknown Product",
      meta: "product",
      href: `/products/${productId}`,
    };
  }

  if (entityType === EntityType.work_item) {
    return {
      entityType,
      entityId,
      title: "Unknown WorkItem",
      meta: "work_item",
      href: `/products/${productId}/work`,
    };
  }

  if (entityType === EntityType.signal) {
    return {
      entityType,
      entityId,
      title: "Unknown Signal",
      meta: "signal",
      href: `/products/${productId}/signals`,
    };
  }

  return {
    entityType,
    entityId,
    title: "Unknown Page",
    meta: "page",
    href: `/products/${productId}/pages`,
  };
}

async function mapEntityLinks(prisma: PrismaClient, productId: string, where: Prisma.EntityLinkWhereInput) {
  const [links, nodeMap] = await Promise.all([
    prisma.entityLink.findMany({
      where,
      orderBy: [{ created_at: "desc" }],
      select: {
        id: true,
        relationship_type: true,
        from_entity_type: true,
        from_entity_id: true,
        to_entity_type: true,
        to_entity_id: true,
        created_at: true,
      },
    }),
    buildEntityNodeMap(prisma, productId),
  ]);

  return links.map((link) => ({
    id: link.id,
    relationshipType: link.relationship_type,
    fromEntity:
      nodeMap.get(`${link.from_entity_type}:${link.from_entity_id}`) ??
      getFallbackNode(link.from_entity_type, link.from_entity_id, productId),
    toEntity:
      nodeMap.get(`${link.to_entity_type}:${link.to_entity_id}`) ??
      getFallbackNode(link.to_entity_type, link.to_entity_id, productId),
    createdAt: link.created_at,
  }));
}

export async function getEntityLinksForProduct(prisma: PrismaClient, productId: string): Promise<EntityLinkEdge[]> {
  return mapEntityLinks(prisma, productId, { product_id: productId });
}

export async function getEntityLinksForEntity(
  prisma: PrismaClient,
  productId: string,
  entityType: EntityType,
  entityId: string,
): Promise<EntityLinkEdge[]> {
  return mapEntityLinks(prisma, productId, {
    product_id: productId,
    OR: [
      { from_entity_type: entityType, from_entity_id: entityId },
      { to_entity_type: entityType, to_entity_id: entityId },
    ],
  });
}

export function groupEntityLinksByEntity(links: EntityLinkEdge[]): Record<string, EntityLinkGroup> {
  const grouped: Record<string, EntityLinkGroup> = {};

  for (const link of links) {
    const fromKey = `${link.fromEntity.entityType}:${link.fromEntity.entityId}`;
    const toKey = `${link.toEntity.entityType}:${link.toEntity.entityId}`;

    if (!grouped[fromKey]) {
      grouped[fromKey] = { outgoing: [], incoming: [] };
    }
    if (!grouped[toKey]) {
      grouped[toKey] = { outgoing: [], incoming: [] };
    }

    grouped[fromKey].outgoing.push(link);
    grouped[toKey].incoming.push(link);
  }

  return grouped;
}

export async function getGroupedEntityLinksForProduct(prisma: PrismaClient, productId: string) {
  const links = await getEntityLinksForProduct(prisma, productId);
  return {
    links,
    grouped: groupEntityLinksByEntity(links),
  };
}

export async function getGroupedEntityLinksForEntity(
  prisma: PrismaClient,
  productId: string,
  entityType: EntityType,
  entityId: string,
) {
  const links = await getEntityLinksForEntity(prisma, productId, entityType, entityId);
  return {
    links,
    grouped: groupEntityLinksByEntity(links),
  };
}

export async function getEntityLinkOptionsForProduct(prisma: PrismaClient, productId: string): Promise<EntityLinkOption[]> {
  const [product, workItems, signals, pages] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    }),
    prisma.workItem.findMany({
      where: { product_id: productId },
      orderBy: [{ type: "asc" }, { title: "asc" }],
      select: { id: true, title: true, type: true },
    }),
    prisma.signal.findMany({
      where: { product_id: productId },
      orderBy: [{ signal_type: "asc" }, { title: "asc" }],
      select: { id: true, title: true, signal_type: true },
    }),
    prisma.page.findMany({
      where: { product_id: productId },
      orderBy: [{ title: "asc" }],
      select: { id: true, title: true },
    }),
  ]);

  const options: EntityLinkOption[] = [];

  if (product) {
    options.push({
      entityType: EntityType.product,
      entityId: product.id,
      label: `${product.name} (product)`,
    });
  }

  options.push(
    ...workItems.map((workItem) => ({
      entityType: EntityType.work_item,
      entityId: workItem.id,
      label: `${workItem.title} (${workItem.type})`,
    })),
  );

  options.push(
    ...signals.map((signal) => ({
      entityType: EntityType.signal,
      entityId: signal.id,
      label: `${signal.title} (${signal.signal_type})`,
    })),
  );

  options.push(
    ...pages.map((page) => ({
      entityType: EntityType.page,
      entityId: page.id,
      label: `${page.title} (page)`,
    })),
  );

  return options;
}

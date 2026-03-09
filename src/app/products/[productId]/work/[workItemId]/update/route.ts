import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ productId: string; workItemId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { productId, workItemId } = await context.params;
  const formData = await request.formData();

  const description = String(formData.get("description") ?? "").trim();
  const acceptanceCriteria = String(formData.get("acceptance_criteria") ?? "").trim();

  const workItem = await prisma.workItem.findFirst({
    where: { id: workItemId, product_id: productId },
    select: { id: true },
  });

  if (!workItem) {
    return NextResponse.redirect(new URL(`/products/${productId}/work/${workItemId}?error=workitem_not_found`, request.url));
  }

  await prisma.workItem.update({
    where: { id: workItem.id },
    data: {
      description: description || null,
      acceptance_criteria: acceptanceCriteria || null,
    },
  });

  return NextResponse.redirect(new URL(`/products/${productId}/work/${workItemId}?success=workitem_updated`, request.url));
}

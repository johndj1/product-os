import { UserType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ productId: string; workItemId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { productId, workItemId } = await context.params;
  const formData = await request.formData();

  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    return NextResponse.redirect(new URL(`/products/${productId}/work/${workItemId}?error=comment_body_required`, request.url));
  }

  const workItem = await prisma.workItem.findFirst({
    where: { id: workItemId, product_id: productId },
    select: { id: true },
  });

  if (!workItem) {
    return NextResponse.redirect(new URL(`/products/${productId}/work/${workItemId}?error=workitem_not_found`, request.url));
  }

  const defaultAuthor = await prisma.user.findFirst({
    where: { user_type: UserType.system },
    select: { id: true },
  });

  await prisma.comment.create({
    data: {
      body,
      product_id: productId,
      work_item_id: workItemId,
      author_id: defaultAuthor?.id,
    },
  });

  return NextResponse.redirect(new URL(`/products/${productId}/work/${workItemId}?success=comment_created`, request.url));
}

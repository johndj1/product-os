import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { productId } = await context.params;
  const formData = await request.formData();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const workItemIdRaw = String(formData.get("work_item_id") ?? "").trim();

  if (!title) {
    return NextResponse.redirect(new URL(`/products/${productId}/pages?error=page_title_required`, request.url));
  }

  let workItemId: string | undefined;

  if (workItemIdRaw) {
    const workItem = await prisma.workItem.findFirst({
      where: { id: workItemIdRaw, product_id: productId },
      select: { id: true },
    });

    if (!workItem) {
      return NextResponse.redirect(new URL(`/products/${productId}/pages?error=page_workitem_invalid`, request.url));
    }

    workItemId = workItem.id;
  }

  await prisma.page.create({
    data: {
      title,
      body: body || null,
      product_id: productId,
      work_item_id: workItemId,
    },
  });

  return NextResponse.redirect(new URL(`/products/${productId}/pages?success=page_created`, request.url));
}

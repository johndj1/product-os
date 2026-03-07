import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WorkspaceNav from "./workspace-nav";

export const dynamic = "force-dynamic";

type ProductLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ productId: string }>;
}>;

export default async function ProductLayout({ children, params }: ProductLayoutProps) {
  const { productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product Workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{product.name}</h1>
        {product.description ? <p className="text-sm text-slate-600">{product.description}</p> : null}
      </header>

      <WorkspaceNav productId={product.id} />
      {children}
    </main>
  );
}

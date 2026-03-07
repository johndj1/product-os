import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  signalCount: number;
};

type DashboardData = {
  products: ProductListItem[];
  topLevelWorkItems: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  signalCount: number;
  error: string | null;
};

async function loadDashboard(): Promise<DashboardData> {
  try {
    const products = await prisma.product.findMany({
      orderBy: { created_at: "asc" },
      include: {
        _count: {
          select: {
            signals: true,
          },
        },
      },
    });

    const productOS = products.find((product) => product.slug === "product-os") ?? null;

    const topLevelWorkItems = productOS
      ? await prisma.workItem.findMany({
          where: {
            product_id: productOS.id,
            parent_id: null,
          },
          select: {
            id: true,
            title: true,
            type: true,
          },
          orderBy: [{ type: "asc" }, { created_at: "asc" }],
        })
      : [];

    const signalCount = await prisma.signal.count();

    return {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        signalCount: product._count.signals,
      })),
      topLevelWorkItems,
      signalCount,
      error: null,
    };
  } catch (error) {
    return {
      products: [],
      topLevelWorkItems: [],
      signalCount: 0,
      error: String(error),
    };
  }
}

export default async function Home() {
  const data = await loadDashboard();

  if (data.error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Product OS</h1>
        <p className="text-sm text-slate-600">Database connection is not ready.</p>
        <p className="text-sm text-slate-600">
          Set <code className="rounded bg-slate-100 px-1 py-0.5">DATABASE_URL</code>, then run <code className="rounded bg-slate-100 px-1 py-0.5">npm run db:push</code> and <code className="rounded bg-slate-100 px-1 py-0.5">npm run db:seed</code>.
        </p>
        <pre className="overflow-x-auto rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-700">{data.error}</pre>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product OS</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Product workspace directory</h1>
        <p className="text-sm text-slate-600">Select a Product to enter its workspace shell.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Products</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.products.length}</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Top-level WorkItems</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.topLevelWorkItems.length}</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Signals</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.signalCount}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Products</h2>
          <ul className="mt-3 space-y-2">
            {data.products.map((product) => (
              <li key={product.id} className="rounded-md border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">/{product.slug}</p>
                  </div>
                  <Link href={`/products/${product.id}`} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    Open workspace
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Top-level WorkItems for Product OS</h2>
          <ul className="mt-3 space-y-2">
            {data.topLevelWorkItems.length === 0 ? (
              <li className="rounded-md border border-dashed border-slate-200 p-3 text-sm text-slate-500">No WorkItems found.</li>
            ) : (
              data.topLevelWorkItems.map((item) => (
                <li key={item.id} className="rounded-md border border-slate-100 p-3">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{item.type}</p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>
    </main>
  );
}

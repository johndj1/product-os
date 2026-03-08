import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  workItemCount: number;
  pageCount: number;
  signalCount: number;
};

type DashboardData = {
  products: ProductListItem[];
  totalWorkItems: number;
  totalKpis: number;
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
            work_items: true,
            pages: true,
            signals: true,
          },
        },
      },
    });

    const totalWorkItems = await prisma.workItem.count();
    const totalKpis = await prisma.workItem.count({ where: { type: "kpi" } });
    const signalCount = await prisma.signal.count();

    return {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        workItemCount: product._count.work_items,
        pageCount: product._count.pages,
        signalCount: product._count.signals,
      })),
      totalWorkItems,
      totalKpis,
      signalCount,
      error: null,
    };
  } catch (error) {
    return {
      products: [],
      totalWorkItems: 0,
      totalKpis: 0,
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
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">WorkItems</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.totalWorkItems}</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">KPIs</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.totalKpis}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Products</h2>
            <p className="mt-1 text-sm text-slate-600">Browse the active Product graph. Check-a-Train is seeded as the first serious pilot alongside Product OS.</p>
          </div>
          <p className="text-sm text-slate-500">{data.signalCount} total signals</p>
        </div>

        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {data.products.map((product) => (
            <li key={product.id} className="rounded-lg border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">/{product.slug}</p>
                  {product.description ? <p className="text-sm text-slate-600">{product.description}</p> : null}
                </div>
                <Link href={`/products/${product.id}`} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  Open workspace
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded bg-slate-100 px-2 py-1">{product.workItemCount} WorkItems</span>
                <span className="rounded bg-slate-100 px-2 py-1">{product.pageCount} Pages</span>
                <span className="rounded bg-slate-100 px-2 py-1">{product.signalCount} Signals</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

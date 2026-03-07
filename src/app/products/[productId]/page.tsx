import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildWorkItemTree, WorkItemTreeNode } from "@/lib/product-workspace";

export const dynamic = "force-dynamic";

type OverviewPageProps = {
  params: Promise<{ productId: string }>;
};

function getKpiProgressPercent(currentValue: number | null, targetValue: number | null): number | null {
  if (currentValue === null || targetValue === null) {
    return null;
  }

  const current = Math.abs(currentValue);
  const target = Math.abs(targetValue);

  if (current === 0 && target === 0) {
    return 100;
  }

  if (current === 0 || target === 0) {
    return 0;
  }

  return Math.round((Math.min(current, target) / Math.max(current, target)) * 100);
}

function renderTree(nodes: WorkItemTreeNode[]) {
  if (nodes.length === 0) {
    return <p className="text-sm text-slate-500">No WorkItems yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {nodes.map((node) => (
        <li key={node.id} className="rounded-md border border-slate-100 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-slate-900">{node.title}</p>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-600">{node.status}</span>
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{node.type}</p>
          {node.children.length > 0 ? <div className="mt-3 border-l border-slate-200 pl-3">{renderTree(node.children)}</div> : null}
        </li>
      ))}
    </ul>
  );
}

export default async function ProductOverviewPage({ params }: OverviewPageProps) {
  const { productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      description: true,
      definition_of_done: true,
      _count: {
        select: {
          work_items: true,
          pages: true,
          signals: true,
          comments: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const [kpis, workItems, recentWorkItems, recentSignals, recentPages, recentComments] = await Promise.all([
    prisma.workItem.findMany({
      where: {
        product_id: productId,
        type: "kpi",
      },
      select: {
        id: true,
        title: true,
        status: true,
        current_value: true,
        target_value: true,
        unit: true,
        parent: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    }),
    prisma.workItem.findMany({
      where: { product_id: productId },
      orderBy: [{ created_at: "asc" }],
    }),
    prisma.workItem.findMany({
      where: { product_id: productId },
      orderBy: { updated_at: "desc" },
      take: 2,
      select: { id: true, title: true, type: true, updated_at: true },
    }),
    prisma.signal.findMany({
      where: { product_id: productId },
      orderBy: { updated_at: "desc" },
      take: 2,
      select: { id: true, title: true, updated_at: true },
    }),
    prisma.page.findMany({
      where: { product_id: productId },
      orderBy: { updated_at: "desc" },
      take: 2,
      select: { id: true, title: true, updated_at: true },
    }),
    prisma.comment.findMany({
      where: { product_id: productId },
      orderBy: { updated_at: "desc" },
      take: 2,
      select: { id: true, body: true, updated_at: true },
    }),
  ]);

  const tree = buildWorkItemTree(workItems);

  const recentActivity = [
    ...recentWorkItems.map((item) => ({
      id: `work-${item.id}`,
      label: `WorkItem: ${item.title}`,
      type: item.type,
      updated_at: item.updated_at,
    })),
    ...recentSignals.map((item) => ({
      id: `signal-${item.id}`,
      label: `Signal: ${item.title}`,
      type: "signal",
      updated_at: item.updated_at,
    })),
    ...recentPages.map((item) => ({
      id: `page-${item.id}`,
      label: `Page: ${item.title}`,
      type: "page",
      updated_at: item.updated_at,
    })),
    ...recentComments.map((item) => ({
      id: `comment-${item.id}`,
      label: `Comment: ${item.body}`,
      type: "comment",
      updated_at: item.updated_at,
    })),
  ]
    .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
    .slice(0, 6);

  return (
    <section className="grid gap-4">
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
        {product.description ? <p className="mt-2 text-sm text-slate-600">{product.description}</p> : null}
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Definition of Done</h2>
        {product.definition_of_done ? (
          <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{product.definition_of_done}</pre>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No Product definition of done has been set yet.</p>
        )}
      </article>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">WorkItems</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{product._count.work_items}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pages</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{product._count.pages}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Signals</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{product._count.signals}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Comments</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{product._count.comments}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">KPI Summary</h2>
          {kpis.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No KPIs linked yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {kpis.map((kpi) => (
                <li key={kpi.id} className="rounded-md border border-slate-100 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{kpi.title}</p>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-600">{kpi.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    Current: {kpi.current_value ?? "-"}
                    {kpi.unit ? ` ${kpi.unit}` : ""}
                  </p>
                  <p className="text-sm text-slate-700">
                    Target: {kpi.target_value ?? "-"}
                    {kpi.unit ? ` ${kpi.unit}` : ""}
                  </p>
                  {getKpiProgressPercent(kpi.current_value, kpi.target_value) !== null ? (
                    <div className="mt-2">
                      <div className="h-2 w-full rounded bg-slate-100">
                        <div
                          className="h-2 rounded bg-slate-700"
                          style={{ width: `${getKpiProgressPercent(kpi.current_value, kpi.target_value)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Progress: {getKpiProgressPercent(kpi.current_value, kpi.target_value)}%</p>
                    </div>
                  ) : null}
                  <p className="text-xs text-slate-500">Outcome: {kpi.parent?.title ?? "None"}</p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Activity feed placeholder. No recent updates yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentActivity.map((item) => (
                <li key={item.id} className="rounded-md border border-slate-100 p-3">
                  <p className="text-sm text-slate-900">{item.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{item.type}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Golden Thread View</h2>
        <div className="mt-3">{renderTree(tree)}</div>
      </article>
    </section>
  );
}

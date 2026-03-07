import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SignalsViewProps = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

const signalMessages: Record<string, string> = {
  signal_created: "Signal ingested.",
  signal_title_required: "Title is required.",
  signal_type_invalid: "Signal type is invalid.",
  signal_workitem_invalid: "Linked WorkItem was not found for this Product.",
};

export default async function ProductSignalsView({ params, searchParams }: SignalsViewProps) {
  const { productId } = await params;
  const query = await searchParams;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true },
  });

  if (!product) {
    notFound();
  }

  const [signals, workItems] = await Promise.all([
    prisma.signal.findMany({
      where: { product_id: productId },
      orderBy: { updated_at: "desc" },
      select: {
        id: true,
        title: true,
        signal_type: true,
        status: true,
        severity: true,
        created_follow_up: true,
        routing_note: true,
        updated_at: true,
        work_item: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.workItem.findMany({
      where: { product_id: productId },
      orderBy: [{ type: "asc" }, { title: "asc" }],
      select: { id: true, title: true, type: true },
    }),
  ]);

  const errorMessage = query.error ? signalMessages[query.error] ?? "Could not ingest signal." : null;
  const successMessage = query.success ? signalMessages[query.success] ?? "Saved." : null;

  return (
    <section className="grid gap-4">
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Signals</h2>
        <p className="mt-2 text-sm text-slate-600">Signals route into Product work through deterministic rules.</p>
      </article>

      {errorMessage ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p> : null}
      {successMessage ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p> : null}

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Manual Signal Ingestion</h3>
        <form action={`/products/${productId}/signals/create`} method="post" className="mt-3 grid gap-3">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              placeholder="Failed test suite on main"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              placeholder="Add context for routing"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="signal_type" className="mb-1 block text-sm font-medium text-slate-700">
                Signal type
              </label>
              <select id="signal_type" name="signal_type" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900" defaultValue="test_failure">
                <option value="kpi_change">kpi_change</option>
                <option value="customer_feedback">customer_feedback</option>
                <option value="incident_alert">incident_alert</option>
                <option value="delivery_risk">delivery_risk</option>
                <option value="test_failure">test_failure</option>
                <option value="deployment_event">deployment_event</option>
                <option value="usage_pattern">usage_pattern</option>
                <option value="anomaly">anomaly</option>
                <option value="dependency_change">dependency_change</option>
                <option value="external_change">external_change</option>
              </select>
            </div>

            <div>
              <label htmlFor="severity" className="mb-1 block text-sm font-medium text-slate-700">
                Severity (optional)
              </label>
              <select id="severity" name="severity" defaultValue="" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
                <option value="">None</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </div>

            <div>
              <label htmlFor="work_item_id" className="mb-1 block text-sm font-medium text-slate-700">
                Linked WorkItem (optional)
              </label>
              <select id="work_item_id" name="work_item_id" defaultValue="" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
                <option value="">No linked WorkItem</option>
                {workItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Ingest Signal
          </button>
        </form>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">Signal count: {signals.length}</p>

        {signals.length === 0 ? (
          <div className="mt-3 rounded-md border border-dashed border-slate-200 p-4">
            <p className="text-sm text-slate-700">No signals yet.</p>
            <p className="mt-1 text-sm text-slate-500">Ingest a signal with the form above or the API endpoint.</p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {signals.map((signal) => (
              <li key={signal.id} className="rounded-md border border-slate-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{signal.title}</p>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-600">{signal.status}</span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{signal.signal_type}</p>
                {signal.severity ? <p className="mt-1 text-xs text-slate-500">Severity: {signal.severity}</p> : null}
                {signal.work_item?.title ? <p className="mt-1 text-xs text-slate-500">Linked WorkItem: {signal.work_item.title}</p> : null}
                <p className="mt-1 text-xs text-slate-500">Created follow-up work: {signal.created_follow_up ? "yes" : "no"}</p>
                {signal.routing_note ? <p className="mt-1 text-xs text-slate-500">Routing: {signal.routing_note}</p> : null}
                <p className="mt-2 text-xs text-slate-500">Updated {signal.updated_at.toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}

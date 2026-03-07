import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PagesViewProps = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

const pageMessages: Record<string, string> = {
  page_created: "Page created.",
  page_title_required: "Title is required.",
  page_workitem_invalid: "Linked WorkItem was not found for this Product.",
};

export default async function ProductPagesView({ params, searchParams }: PagesViewProps) {
  const { productId } = await params;
  const query = await searchParams;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true },
  });

  if (!product) {
    notFound();
  }

  const [pages, workItems] = await Promise.all([
    prisma.page.findMany({
      where: { product_id: productId },
      orderBy: { updated_at: "desc" },
      select: {
        id: true,
        title: true,
        body: true,
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

  const errorMessage = query.error ? pageMessages[query.error] ?? "Could not create page." : null;
  const successMessage = query.success ? pageMessages[query.success] ?? "Saved." : null;

  return (
    <section className="grid gap-4">
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Pages</h2>
        <p className="mt-2 text-sm text-slate-600">Reference pages and structured notes for {product.name}.</p>
      </article>

      {errorMessage ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p> : null}
      {successMessage ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p> : null}

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Create Page</h3>
        <form action={`/products/${productId}/pages/create`} method="post" className="mt-3 grid gap-3">
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
              placeholder="Workspace notes"
            />
          </div>

          <div>
            <label htmlFor="body" className="mb-1 block text-sm font-medium text-slate-700">
              Body (optional)
            </label>
            <textarea
              id="body"
              name="body"
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              placeholder="Add details"
            />
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

          <button type="submit" className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Create Page
          </button>
        </form>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        {pages.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 p-4">
            <p className="text-sm text-slate-700">No pages yet.</p>
            <p className="mt-1 text-sm text-slate-500">Create the first page with the form above.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {pages.map((page) => (
              <li key={page.id} className="rounded-md border border-slate-100 p-3">
                <p className="font-medium text-slate-900">{page.title}</p>
                {page.body ? <p className="mt-1 line-clamp-2 text-sm text-slate-600">{page.body}</p> : null}
                {page.work_item?.title ? <p className="mt-1 text-xs text-slate-500">Linked WorkItem: {page.work_item.title}</p> : null}
                <p className="mt-2 text-xs text-slate-500">Updated {page.updated_at.toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}

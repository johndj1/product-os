import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildWorkItemTree, groupByType, WorkItemTreeNode } from "@/lib/product-workspace";
import { calculatePriorityForProduct, WorkItemPriority } from "@/lib/priority-scoring";
import { getRelationshipsForProduct, groupRelationshipsByWorkItem, RELATIONSHIP_TYPE_VALUES } from "@/lib/relationships";
import { WORK_ITEM_STATUS_VALUES, WorkItemTypeValue } from "@/lib/work-item-rules";
import DecisionCreateForm from "./decision-create-form";
import WorkItemCreateForm from "./work-item-create-form";

export const dynamic = "force-dynamic";

type WorkPageProps = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

const workMessages: Record<string, string> = {
  workitem_created: "WorkItem created.",
  workitem_status_updated: "WorkItem status updated.",
  relationship_created: "Relationship created.",
  workitem_title_required: "Title is required.",
  workitem_type_invalid: "Type is invalid.",
  workitem_status_invalid: "Status is invalid.",
  workitem_not_found: "WorkItem not found for this Product.",
  workitem_parent_not_found: "Selected parent WorkItem was not found for this Product.",
  workitem_parent_type_invalid: "Selected parent is not allowed for this WorkItem type.",
  relationship_workitems_required: "From and To WorkItems are required.",
  relationship_workitems_invalid: "Selected WorkItems must belong to this Product.",
  relationship_self_link_not_allowed: "A WorkItem cannot link to itself.",
  relationship_type_invalid: "Relationship type is invalid.",
  relationship_duplicate: "This relationship already exists.",
};

function statusBadgeClass(status: string): string {
  if (status === "done") return "bg-emerald-100 text-emerald-700";
  if (status === "blocked") return "bg-rose-100 text-rose-700";
  if (status === "in_progress") return "bg-blue-100 text-blue-700";
  if (status === "ready") return "bg-amber-100 text-amber-700";
  if (status === "cancelled") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-700";
}

function typeBadgeClass(type: string): string {
  if (type === "decision") return "bg-indigo-100 text-indigo-700";
  if (type === "bug") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function renderTree(
  productId: string,
  nodes: WorkItemTreeNode[],
  outgoingByWorkItem: Record<string, Awaited<ReturnType<typeof getRelationshipsForProduct>>>,
  incomingByWorkItem: Record<string, Awaited<ReturnType<typeof getRelationshipsForProduct>>>,
  priorityByWorkItemId: Record<string, WorkItemPriority>,
) {
  if (nodes.length === 0) {
    return <p className="text-sm text-slate-500">No WorkItems found.</p>;
  }

  return (
    <ul className="space-y-2">
      {nodes.map((node) => {
        const outgoing = outgoingByWorkItem[node.id] ?? [];
        const incoming = incomingByWorkItem[node.id] ?? [];
        const priority = priorityByWorkItemId[node.id];

        return (
          <li key={node.id} className="rounded-md border border-slate-100 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/products/${productId}/work/${node.id}`} className="font-medium text-slate-900 hover:underline">
                {node.title}
              </Link>
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs uppercase tracking-wide ${typeBadgeClass(node.type)}`}>{node.type}</span>
                <span className={`rounded px-2 py-0.5 text-xs uppercase tracking-wide ${statusBadgeClass(node.status)}`}>{node.status}</span>
              </div>
            </div>

            <form action={`/products/${productId}/work/${node.id}/status`} method="post" className="mt-2 flex items-center gap-2">
              <label htmlFor={`status-${node.id}`} className="text-xs text-slate-500">
                Update status
              </label>
              <select id={`status-${node.id}`} name="status" defaultValue={node.status} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700">
                {WORK_ITEM_STATUS_VALUES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">
                Save
              </button>
            </form>
            {priority ? (
              <div className="mt-2 rounded border border-slate-100 bg-slate-50 px-2 py-2">
                <p className="text-xs font-medium text-slate-700">Priority score: {priority.score}</p>
                <p className="mt-1 text-xs text-slate-500">{priority.reason}</p>
              </div>
            ) : null}

            {(outgoing.length > 0 || incoming.length > 0) && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Outgoing</p>
                  {outgoing.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-400">None</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {outgoing.map((relationship) => (
                        <li key={relationship.id} className="text-xs text-slate-600">
                          {relationship.relationshipType} {"->"}{" "}
                          <Link href={`/products/${productId}/work/${relationship.toWorkItem.id}`} className="underline">
                            {relationship.toWorkItem.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Incoming</p>
                  {incoming.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-400">None</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {incoming.map((relationship) => (
                        <li key={relationship.id} className="text-xs text-slate-600">
                          <Link href={`/products/${productId}/work/${relationship.fromWorkItem.id}`} className="underline">
                            {relationship.fromWorkItem.title}
                          </Link>{" "}
                          {"->"} {relationship.relationshipType}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {node.children.length > 0 ? (
              <div className="mt-3 border-l border-slate-200 pl-3">
                {renderTree(productId, node.children, outgoingByWorkItem, incomingByWorkItem, priorityByWorkItemId)}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default async function ProductWorkPage({ params, searchParams }: WorkPageProps) {
  const { productId } = await params;
  const query = await searchParams;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true },
  });

  if (!product) {
    notFound();
  }

  const [workItems, relationships, signals] = await Promise.all([
    prisma.workItem.findMany({
      where: { product_id: productId },
      orderBy: [{ created_at: "asc" }],
    }),
    getRelationshipsForProduct(prisma, productId),
    prisma.signal.findMany({
      where: { product_id: productId },
      select: {
        work_item_id: true,
        status: true,
        severity: true,
      },
    }),
  ]);

  const grouped = groupByType(workItems);
  const recentDecisions = workItems
    .filter((item) => item.type === "decision")
    .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
    .slice(0, 6);
  const tree = buildWorkItemTree(workItems);
  const parentOptions = workItems.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type as WorkItemTypeValue,
  }));

  const { outgoingByWorkItem, incomingByWorkItem } = groupRelationshipsByWorkItem(relationships);
  const priorities = calculatePriorityForProduct(workItems, relationships, signals);
  const priorityByWorkItemId = Object.fromEntries(priorities.map((priority) => [priority.workItemId, priority])) as Record<string, WorkItemPriority>;
  const workItemById = new Map(workItems.map((item) => [item.id, item]));
  const recommendedNextWork = priorities
    .map((priority) => ({ priority, workItem: workItemById.get(priority.workItemId) }))
    .filter((entry): entry is { priority: WorkItemPriority; workItem: (typeof workItems)[number] } => Boolean(entry.workItem))
    .filter((entry) => entry.workItem.status !== "done" && entry.workItem.status !== "cancelled")
    .slice(0, 5);

  const errorMessage = query.error ? workMessages[query.error] ?? "Could not update WorkItem." : null;
  const successMessage = query.success ? workMessages[query.success] ?? "Saved." : null;

  return (
    <section className="grid gap-4">
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Work</h2>
        <p className="mt-2 text-sm text-slate-600">Browse, link, and create WorkItems for {product.name}.</p>
      </article>

      {errorMessage ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p> : null}
      {successMessage ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p> : null}

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Create WorkItem</h3>
        <div className="mt-3">
          <WorkItemCreateForm productId={productId} parentOptions={parentOptions} />
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Create Decision</h3>
        <div className="mt-3">
          <DecisionCreateForm productId={productId} />
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Create Relationship</h3>
        <form action={`/products/${productId}/relationships/create`} method="post" className="mt-3 grid gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor="from_work_item_id" className="mb-1 block text-xs font-medium text-slate-700">
              From WorkItem
            </label>
            <select id="from_work_item_id" name="from_work_item_id" className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900" defaultValue="">
              <option value="" disabled>
                Select from
              </option>
              {workItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.type === "decision" ? "decision*" : item.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="relationship_type" className="mb-1 block text-xs font-medium text-slate-700">
              Relationship
            </label>
            <select id="relationship_type" name="relationship_type" className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900" defaultValue="supports">
              {RELATIONSHIP_TYPE_VALUES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="to_work_item_id" className="mb-1 block text-xs font-medium text-slate-700">
              To WorkItem
            </label>
            <select id="to_work_item_id" name="to_work_item_id" className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900" defaultValue="">
              <option value="" disabled>
                Select to
              </option>
              {workItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.type === "decision" ? "decision*" : item.type})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button type="submit" className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Create
            </button>
          </div>
        </form>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Recommended Next Work</h3>
        {recommendedNextWork.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No active WorkItems to rank.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recommendedNextWork.map((entry) => (
              <li key={entry.workItem.id} className="rounded-md border border-slate-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/products/${productId}/work/${entry.workItem.id}`} className="font-medium text-slate-900 hover:underline">
                    {entry.workItem.title}
                  </Link>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs tracking-wide text-slate-700">Score {entry.priority.score}</span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  {entry.workItem.type} - {entry.workItem.status}
                </p>
                <p className="mt-2 text-xs text-slate-500">{entry.priority.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Grouped by Type</h3>
        {grouped.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No WorkItems available.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {grouped.map((group) => (
              <li key={group.type} className="rounded-md border border-slate-100 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{group.type}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{group.count}</p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Decisions</h3>
        {recentDecisions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No decisions yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {recentDecisions.map((decision) => (
              <li key={decision.id} className="rounded-md border border-slate-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/products/${productId}/work/${decision.id}`} className="font-medium text-slate-900 hover:underline">
                    {decision.title}
                  </Link>
                  <span className={`rounded px-2 py-0.5 text-xs uppercase tracking-wide ${statusBadgeClass(decision.status)}`}>{decision.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Decision WorkItem</p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Relationships</h3>
        {relationships.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No relationships yet.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {relationships.map((relationship) => (
              <li key={relationship.id} className="text-sm text-slate-600">
                <Link href={`/products/${productId}/work/${relationship.fromWorkItem.id}`} className="underline">
                  {relationship.fromWorkItem.title}
                </Link>{" "}
                {"->"} {relationship.relationshipType} {"->"}{" "}
                <Link href={`/products/${productId}/work/${relationship.toWorkItem.id}`} className="underline">
                  {relationship.toWorkItem.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Hierarchy</h3>
        <div className="mt-3">{renderTree(productId, tree, outgoingByWorkItem, incomingByWorkItem, priorityByWorkItemId)}</div>
      </article>
    </section>
  );
}

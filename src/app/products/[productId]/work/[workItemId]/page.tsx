import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityType } from "@prisma/client";
import { formatTimestampWithRelative } from "@/lib/date-time";
import { getGroupedEntityLinksForEntity } from "@/lib/entity-links";
import { calculatePriorityForWorkItem } from "@/lib/priority-scoring";
import { prisma } from "@/lib/prisma";
import { getRelationshipsForProduct } from "@/lib/relationships";
import { asObject } from "@/lib/signals";
import { generateCodexPrompt } from "@/lib/workitem-prompt";
import BackButton from "./back-button";
import Breadcrumbs from "./breadcrumbs";
import ChildBuilderPanel from "./child-builder-panel";
import CodexPromptPanel from "./codex-prompt-panel";

export const dynamic = "force-dynamic";

type WorkItemDetailProps = {
  params: Promise<{ productId: string; workItemId: string }>;
  searchParams: Promise<{ count?: string; error?: string; showChildPrompts?: string; success?: string }>;
};

const detailMessages: Record<string, string> = {
  comment_created: "Comment added.",
  comment_body_required: "Comment body is required.",
  workitem_not_found: "WorkItem not found for this Product.",
  feature_decomposition_created: "Suggested Stories and Tasks created for this Feature.",
  feature_decomposition_invalid: "Feature decomposition is only available once per Feature and requires a Feature WorkItem.",
  workitem_content_generated: "Acceptance criteria and structured WorkItem content generated.",
  workitem_updated: "WorkItem details updated.",
};

function getDetailMessage(type: "error" | "success", code?: string, count?: number | null): string | null {
  if (!code) {
    return null;
  }

  if (type === "success" && code === "child_acceptance_criteria_generated") {
    return `Acceptance criteria generated for ${count ?? 0} WorkItem${count === 1 ? "" : "s"}.`;
  }

  return detailMessages[code] ?? (type === "error" ? "Could not save comment." : "Saved.");
}

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

function statusBadgeClass(status: string): string {
  if (status === "done") return "bg-emerald-100 text-emerald-700";
  if (status === "blocked") return "bg-rose-100 text-rose-700";
  if (status === "in_progress") return "bg-blue-100 text-blue-700";
  if (status === "ready") return "bg-amber-100 text-amber-700";
  if (status === "cancelled") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-700";
}

type WorkItemAncestor = {
  id: string;
  title: string;
  parent_id: string | null;
};

async function getWorkItemAncestors(productId: string, parentId: string | null): Promise<WorkItemAncestor[]> {
  const ancestors: WorkItemAncestor[] = [];
  const visited = new Set<string>();
  let currentParentId = parentId;

  while (currentParentId && !visited.has(currentParentId)) {
    visited.add(currentParentId);

    const ancestor = await prisma.workItem.findFirst({
      where: { id: currentParentId, product_id: productId },
      select: {
        id: true,
        title: true,
        parent_id: true,
      },
    });

    if (!ancestor) {
      break;
    }

    ancestors.unshift(ancestor);
    currentParentId = ancestor.parent_id;
  }

  return ancestors;
}

export default async function WorkItemDetailPage({ params, searchParams }: WorkItemDetailProps) {
  const { productId, workItemId } = await params;
  const query = await searchParams;

  const workItem = await prisma.workItem.findFirst({
    where: { id: workItemId, product_id: productId },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      parent_id: true,
      description: true,
      acceptance_criteria: true,
      current_value: true,
      target_value: true,
      unit: true,
      last_updated_at: true,
      product: {
        select: {
          name: true,
        },
      },
      parent: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          description: true,
          parent: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              description: true,
            },
          },
        },
      },
      children: {
        orderBy: [{ type: "asc" }, { title: "asc" }],
        select: { id: true, title: true, type: true, status: true, description: true, acceptance_criteria: true },
      },
      outgoing_relationships: {
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          relationship_type: true,
          to_work_item: {
            select: { id: true, title: true, type: true, status: true },
          },
        },
      },
      incoming_relationships: {
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          relationship_type: true,
          from_work_item: {
            select: { id: true, title: true, type: true, status: true },
          },
        },
      },
      signals: {
        orderBy: { updated_at: "desc" },
        select: {
          id: true,
          title: true,
          signal_type: true,
          status: true,
          created_follow_up: true,
          routing_note: true,
          payload: true,
          created_at: true,
          updated_at: true,
        },
      },
      pages: {
        orderBy: { updated_at: "desc" },
        select: {
          id: true,
          title: true,
        },
      },
      comments: {
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          body: true,
          created_at: true,
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!workItem) {
    notFound();
  }

  const count = query.count ? Number.parseInt(query.count, 10) : null;
  const childBuilderChildren = workItem.children.filter((child) => child.type === "story" || child.type === "task");
  const errorMessage = getDetailMessage("error", query.error, Number.isNaN(count ?? NaN) ? null : count);
  const successMessage = getDetailMessage("success", query.success, Number.isNaN(count ?? NaN) ? null : count);
  const relatedWorkItems = [
    ...workItem.outgoing_relationships.map((relationship) => relationship.to_work_item),
    ...workItem.incoming_relationships.map((relationship) => relationship.from_work_item),
  ];
  const relatedKpis = relatedWorkItems.filter((item) => item.type === "kpi");
  const relatedWorkItemIds = [...new Set(relatedWorkItems.map((item) => item.id))];
  const relatedSignals =
    relatedWorkItemIds.length === 0
      ? []
      : await prisma.signal.findMany({
          where: {
            product_id: productId,
            work_item_id: { in: relatedWorkItemIds },
          },
          orderBy: { updated_at: "desc" },
          take: 8,
          select: {
            id: true,
            title: true,
            signal_type: true,
            status: true,
            work_item: {
              select: { id: true, title: true },
            },
          },
        });
  const [allWorkItems, relationships, signals, entityLinkData] = await Promise.all([
    prisma.workItem.findMany({
      where: { product_id: productId },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        parent_id: true,
      },
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
    getGroupedEntityLinksForEntity(prisma, productId, EntityType.work_item, workItemId),
  ]);
  const ancestorItems = await getWorkItemAncestors(productId, workItem.parent_id);
  const workIndexHref = `/products/${productId}/work`;
  const breadcrumbItems = [
    { label: workItem.product.name, href: `/products/${productId}` },
    { label: "Work", href: workIndexHref },
    ...ancestorItems.map((ancestor) => ({
      label: ancestor.title,
      href: `/products/${productId}/work/${ancestor.id}`,
    })),
    { label: workItem.title },
  ];

  const priority = calculatePriorityForWorkItem(
    {
      id: workItem.id,
      title: workItem.title,
      type: workItem.type,
      status: workItem.status,
      parent_id: workItem.parent_id,
    },
    allWorkItems,
    relationships,
    signals,
  );
  const workItemEntityLinks = entityLinkData.grouped[`work_item:${workItemId}`] ?? { outgoing: [], incoming: [] };
  const reusedSignalCount = workItem.signals.filter((signal) => signal.routing_note?.includes("existing active")).length;
  const usagePatternSignals = workItem.signals.filter((signal) => asObject(signal.payload)?.usagePattern);
  const storyChildren = workItem.children.filter((child) => child.type === "story");
  const childPromptItems = childBuilderChildren.map((child) => ({
    id: child.id,
    title: child.title,
    type: child.type,
    prompt: generateCodexPrompt({
      productName: workItem.product.name,
      workItem: {
        type: child.type,
        title: child.title,
        description: child.description,
        acceptanceCriteria: child.acceptance_criteria,
      },
      parent: {
        type: workItem.type,
        title: workItem.title,
        description: workItem.description,
        acceptanceCriteria: workItem.acceptance_criteria,
      },
      grandparent: workItem.parent
        ? {
            type: workItem.parent.type,
            title: workItem.parent.title,
            description: workItem.parent.description,
            acceptanceCriteria: null,
          }
        : null,
    }),
  }));
  const codexPrompt = generateCodexPrompt({
    productName: workItem.product.name,
    workItem: {
      type: workItem.type,
      title: workItem.title,
      description: workItem.description,
      acceptanceCriteria: workItem.acceptance_criteria,
    },
    parent: workItem.parent
      ? {
          type: workItem.parent.type,
          title: workItem.parent.title,
          description: workItem.parent.description,
          acceptanceCriteria: null,
        }
      : null,
    grandparent: workItem.parent?.parent
      ? {
          type: workItem.parent.parent.type,
          title: workItem.parent.parent.title,
          description: workItem.parent.parent.description,
          acceptanceCriteria: null,
        }
      : null,
    children: workItem.children.map((child) => ({
      type: child.type,
      title: child.title,
      description: null,
      acceptanceCriteria: null,
    })),
  });
  const canGenerateContent = (workItem.type === "story" || workItem.type === "task") && !workItem.acceptance_criteria;
  const canGeneratePrompt = workItem.type === "story" || workItem.type === "task";
  const canPrepareChildren = childBuilderChildren.length > 0;
  const now = new Date();

  return (
    <section className="grid gap-4">
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <BackButton fallbackHref={workIndexHref} />
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold text-slate-900">{workItem.title}</h2>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-600">{workItem.type}</span>
          <span className={`rounded px-2 py-0.5 text-xs uppercase tracking-wide ${statusBadgeClass(workItem.status)}`}>{workItem.status}</span>
        </div>
        {workItem.description ? (
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-slate-600">{workItem.description}</pre>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No description provided.</p>
        )}
        {workItem.signals.length > 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            {workItem.signals.length} linked Signals
            {reusedSignalCount > 0 ? `, including ${reusedSignalCount} repeated routed event${reusedSignalCount === 1 ? "" : "s"}.` : "."}
          </p>
        ) : null}
        {usagePatternSignals.length > 0 ? <p className="mt-2 text-xs text-amber-700">This WorkItem is being used as follow-up for a usage-pattern match.</p> : null}
      </article>

      {workItem.type === "decision" ? (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Decision Context</h3>
          <p className="mt-2 text-sm text-slate-600">Decisions are WorkItems that capture product or architecture choices and their impact on delivery work.</p>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Related KPIs</h4>
              {relatedKpis.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">No KPI links yet.</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {relatedKpis.map((kpi) => (
                    <li key={kpi.id}>
                      <Link href={`/products/${productId}/work/${kpi.id}`} className="text-sm text-slate-700 underline">
                        {kpi.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Related Signals</h4>
              {relatedSignals.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">No signals linked through related WorkItems.</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {relatedSignals.map((signal) => (
                    <li key={signal.id} className="text-sm text-slate-700">
                      {signal.title} ({signal.signal_type}) via {signal.work_item?.title ?? "unknown"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </article>
      ) : null}

      {workItem.type === "feature" ? (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Feature Decomposition</h3>
          <p className="mt-2 text-sm text-slate-600">Generate a first-pass Story and Task breakdown that the builder can review and adjust before handing Tasks to Codex.</p>
          {storyChildren.length > 0 ? (
            <p className="mt-3 text-sm text-slate-700">
              This Feature already has {storyChildren.length} Story child{storyChildren.length === 1 ? "" : "ren"}, so automatic decomposition is locked to avoid duplicate work.
            </p>
          ) : (
            <form action={`/products/${productId}/work/${workItem.id}/decompose`} method="post" className="mt-3">
              <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Generate Stories and Tasks
              </button>
            </form>
          )}
        </article>
      ) : null}

      {canPrepareChildren ? (
        <ChildBuilderPanel
          productId={productId}
          workItemId={workItem.id}
          promptChildren={childPromptItems}
          missingAcceptanceCriteriaCount={childBuilderChildren.filter((child) => !child.acceptance_criteria).length}
          defaultShowPrompts={query.showChildPrompts === "1"}
        />
      ) : null}

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Acceptance Criteria</h3>
        {!workItem.acceptance_criteria ? (
          <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
            <p className="text-sm text-slate-600">No acceptance criteria defined for this WorkItem.</p>
            {canGenerateContent ? (
              <form action={`/products/${productId}/work/${workItem.id}/generate`} method="post" className="mt-3">
                <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                  Generate Acceptance Criteria
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
        <form action={`/products/${productId}/work/${workItem.id}/update`} method="post" className="mt-3 grid gap-3">
          <div>
            <label htmlFor="description" className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={workItem.description ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              placeholder="Short context for this WorkItem"
            />
          </div>
          <div>
            <label htmlFor="acceptance_criteria" className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Acceptance criteria
            </label>
            <textarea
              id="acceptance_criteria"
              name="acceptance_criteria"
              rows={6}
              defaultValue={workItem.acceptance_criteria ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              placeholder="Define what must be true for this WorkItem to be considered complete."
            />
          </div>
          <button type="submit" className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Save WorkItem Details
          </button>
        </form>
      </article>

      {canGeneratePrompt ? (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Codex Handoff Prompt</h3>
          <p className="mt-2 text-sm text-slate-600">Generate a Codex-ready implementation prompt from this {workItem.type} and its hierarchy context.</p>
          <CodexPromptPanel prompt={codexPrompt} />
        </article>
      ) : null}

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Priority</h3>
        <p className="mt-2 text-sm text-slate-700">Priority score: {priority.score}</p>
        <p className="mt-1 text-xs text-slate-500">{priority.reason}</p>
      </article>

      {workItem.type === "kpi" ? (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">KPI Tracking</h3>
          <p className="mt-2 text-sm text-slate-700">
            Current: {workItem.current_value ?? "-"}
            {workItem.unit ? ` ${workItem.unit}` : ""}
          </p>
          <p className="text-sm text-slate-700">
            Target: {workItem.target_value ?? "-"}
            {workItem.unit ? ` ${workItem.unit}` : ""}
          </p>
          {getKpiProgressPercent(workItem.current_value, workItem.target_value) !== null ? (
            <div className="mt-2">
              <div className="h-2 w-full rounded bg-slate-100">
                <div
                  className="h-2 rounded bg-slate-700"
                  style={{ width: `${getKpiProgressPercent(workItem.current_value, workItem.target_value)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Progress: {getKpiProgressPercent(workItem.current_value, workItem.target_value)}%</p>
            </div>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">
            Last updated: {workItem.last_updated_at ? workItem.last_updated_at.toLocaleString() : "Never"}
          </p>
        </article>
      ) : null}

      {errorMessage ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p> : null}
      {successMessage ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Parent</h3>
          {workItem.parent ? (
            <Link href={`/products/${productId}/work/${workItem.parent.id}`} className="mt-2 block rounded-md border border-slate-100 p-3 hover:bg-slate-50">
              <p className="font-medium text-slate-900">{workItem.parent.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {workItem.parent.type} - {workItem.parent.status}
              </p>
            </Link>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No parent WorkItem.</p>
          )}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Children</h3>
          {workItem.children.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No child WorkItems.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {workItem.children.map((child) => (
                <li key={child.id}>
                  <Link href={`/products/${productId}/work/${child.id}`} className="block rounded-md border border-slate-100 p-3 hover:bg-slate-50">
                    <p className="font-medium text-slate-900">{child.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {child.type} - {child.status}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Outgoing EntityLinks</h3>
          {workItemEntityLinks.outgoing.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No outgoing EntityLinks.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {workItemEntityLinks.outgoing.map((link) => (
                <li key={link.id} className="rounded-md border border-slate-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{link.relationshipType}</p>
                  <Link href={link.toEntity.href} className="mt-1 block font-medium text-slate-900 hover:underline">
                    {link.toEntity.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">{link.toEntity.meta}</p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Incoming EntityLinks</h3>
          {workItemEntityLinks.incoming.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No incoming EntityLinks.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {workItemEntityLinks.incoming.map((link) => (
                <li key={link.id} className="rounded-md border border-slate-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{link.relationshipType}</p>
                  <Link href={link.fromEntity.href} className="mt-1 block font-medium text-slate-900 hover:underline">
                    {link.fromEntity.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">{link.fromEntity.meta}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Outgoing Relationships</h3>
          {workItem.outgoing_relationships.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No outgoing relationships.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {workItem.outgoing_relationships.map((relationship) => (
                <li key={relationship.id} className="rounded-md border border-slate-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{relationship.relationship_type}</p>
                  <Link href={`/products/${productId}/work/${relationship.to_work_item.id}`} className="mt-1 block font-medium text-slate-900 hover:underline">
                    {relationship.to_work_item.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Incoming Relationships</h3>
          {workItem.incoming_relationships.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No incoming relationships.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {workItem.incoming_relationships.map((relationship) => (
                <li key={relationship.id} className="rounded-md border border-slate-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{relationship.relationship_type}</p>
                  <Link href={`/products/${productId}/work/${relationship.from_work_item.id}`} className="mt-1 block font-medium text-slate-900 hover:underline">
                    {relationship.from_work_item.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Linked Signals</h3>
          {workItem.signals.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No linked signals.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {workItem.signals.map((signal) => (
                <li key={signal.id} className="rounded-md border border-slate-100 p-3 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">{signal.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {signal.signal_type} - {signal.status}
                  </p>
                  {asObject(signal.payload)?.usagePattern ? <p className="mt-1 text-xs text-amber-700">Usage-pattern-triggered routing.</p> : null}
                  {signal.routing_note?.includes("existing active") ? (
                    <p className="mt-1 text-xs text-slate-500">Reused existing follow-up WorkItem.</p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500">Occurred: {formatTimestampWithRelative(signal.created_at, now)}</p>
                  <p className="mt-1 text-xs text-slate-500">Last updated: {formatTimestampWithRelative(signal.updated_at, now)}</p>
                  {signal.routing_note ? <p className="mt-1 text-xs text-slate-500">Routing: {signal.routing_note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Linked Pages</h3>
          {workItem.pages.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No linked pages.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {workItem.pages.map((page) => (
                <li key={page.id} className="rounded-md border border-slate-100 p-3 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">{page.title}</p>
                  <p className="mt-1 text-xs text-slate-500">Page route not added yet.</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Add Comment</h3>
        <form action={`/products/${productId}/work/${workItem.id}/comments/create`} method="post" className="mt-3 grid gap-3">
          <textarea
            id="body"
            name="body"
            required
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            placeholder="Add a comment"
          />
          <button type="submit" className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Add Comment
          </button>
        </form>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Comments</h3>
        {workItem.comments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No comments yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {workItem.comments.map((comment) => (
              <li key={comment.id} className="rounded-md border border-slate-100 p-3">
                <p className="text-sm text-slate-800">{comment.body}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {comment.author?.name ?? comment.author?.email ?? "System"} - {comment.created_at.toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}

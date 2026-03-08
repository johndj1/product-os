import { WORK_ITEM_STATUS_VALUES } from "@/lib/work-item-rules";

type DecisionCreateFormProps = {
  productId: string;
};

export default function DecisionCreateForm({ productId }: DecisionCreateFormProps) {
  return (
    <form action={`/products/${productId}/work/create`} method="post" className="grid gap-3">
      <input type="hidden" name="type" value="decision" />

      <div>
        <label htmlFor="decision_title" className="mb-1 block text-sm font-medium text-slate-700">
          Decision title
        </label>
        <input
          id="decision_title"
          name="title"
          type="text"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          placeholder="Adopt deterministic signal routing for v1"
        />
      </div>

      <div>
        <label htmlFor="decision_description" className="mb-1 block text-sm font-medium text-slate-700">
          Description (optional)
        </label>
        <textarea
          id="decision_description"
          name="description"
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          placeholder="Context, alternatives considered, and chosen direction."
        />
      </div>

      <div>
        <label htmlFor="decision_acceptance_criteria" className="mb-1 block text-sm font-medium text-slate-700">
          Acceptance Criteria (optional)
        </label>
        <textarea
          id="decision_acceptance_criteria"
          name="acceptance_criteria"
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          placeholder="Conditions that indicate this decision is implemented successfully."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="decision_status" className="mb-1 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select id="decision_status" name="status" defaultValue="new" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
            {WORK_ITEM_STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="decision_parent_id" className="mb-1 block text-sm font-medium text-slate-700">
            Parent WorkItem (optional)
          </label>
          <select id="decision_parent_id" name="parent_id" defaultValue="" disabled className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-500">
            <option value="">No parent (root WorkItem)</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">Decisions are root WorkItems in the current hierarchy guardrails.</p>
        </div>
      </div>

      <button type="submit" className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        Create Decision
      </button>
    </form>
  );
}

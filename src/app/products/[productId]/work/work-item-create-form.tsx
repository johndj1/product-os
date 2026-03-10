"use client";

import { useMemo, useState } from "react";
import { ALLOWED_CHILDREN_BY_PARENT, WORK_ITEM_STATUS_VALUES, WORK_ITEM_TYPE_VALUES, WorkItemTypeValue } from "@/lib/work-item-rules";

type WorkParentOption = {
  id: string;
  title: string;
  type: WorkItemTypeValue;
};

type OutcomeOption = {
  id: string;
  title: string;
  journeyTitle: string;
  journeyStepTitle: string;
};

type WorkItemCreateFormProps = {
  productId: string;
  parentOptions: WorkParentOption[];
  outcomeOptions: OutcomeOption[];
};

export default function WorkItemCreateForm({ productId, parentOptions, outcomeOptions }: WorkItemCreateFormProps) {
  const [selectedType, setSelectedType] = useState<WorkItemTypeValue>("outcome");

  const allowedParentTypes = useMemo(() => {
    return Object.entries(ALLOWED_CHILDREN_BY_PARENT)
      .filter(([, childTypes]) => childTypes?.includes(selectedType))
      .map(([type]) => type as WorkItemTypeValue);
  }, [selectedType]);

  const filteredParents = useMemo(() => {
    if (allowedParentTypes.length === 0) {
      return [];
    }

    return parentOptions.filter((item) => allowedParentTypes.includes(item.type));
  }, [allowedParentTypes, parentOptions]);

  return (
    <form action={`/products/${productId}/work/create`} method="post" className="grid gap-3">
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
          placeholder="Define core entities"
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
          placeholder="Short context for this WorkItem"
        />
      </div>

      <div>
        <label htmlFor="acceptance_criteria" className="mb-1 block text-sm font-medium text-slate-700">
          Acceptance Criteria (optional)
        </label>
        <textarea
          id="acceptance_criteria"
          name="acceptance_criteria"
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          placeholder="Define what must be true for this WorkItem to be considered complete."
        />
        {selectedType === "story" || selectedType === "task" ? (
          <p className="mt-1 text-xs text-slate-500">Leave this blank if you want to generate deterministic acceptance criteria later from the WorkItem detail page.</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium text-slate-700">
            Type
          </label>
          <select
            id="type"
            name="type"
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value as WorkItemTypeValue)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            {WORK_ITEM_TYPE_VALUES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Customer Outcomes live in the journey model. Use the Outcome field below to anchor delivery Features to customer value.
          </p>
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select id="status" name="status" defaultValue="new" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
            {WORK_ITEM_STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="parent_id" className="mb-1 block text-sm font-medium text-slate-700">
            Parent WorkItem (optional)
          </label>
          <select
            id="parent_id"
            name="parent_id"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            disabled={filteredParents.length === 0}
            defaultValue=""
          >
            <option value="">No parent (root WorkItem)</option>
            {filteredParents.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.type})
              </option>
            ))}
          </select>
          {allowedParentTypes.length === 0 ? (
            <p className="mt-1 text-xs text-slate-500">This type can only be created as a root WorkItem in v1 guardrails.</p>
          ) : selectedType === "feature" ? (
            <p className="mt-1 text-xs text-slate-500">
              Features use the linked Outcome as the delivery anchor. Parent is only for optional supporting groupings such as a capability.
            </p>
          ) : selectedType === "story" ? (
            <p className="mt-1 text-xs text-slate-500">Stories should normally sit beneath a Feature.</p>
          ) : selectedType === "task" ? (
            <p className="mt-1 text-xs text-slate-500">Tasks should normally sit beneath a Story.</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="outcome_id" className="mb-1 block text-sm font-medium text-slate-700">
          Outcome {selectedType === "feature" ? "(required)" : "(optional)"}
        </label>
        <select
          id="outcome_id"
          name="outcome_id"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          defaultValue=""
          disabled={selectedType !== "feature" || outcomeOptions.length === 0}
          required={selectedType === "feature"}
        >
          <option value="">
            {selectedType === "feature" ? "Select journey outcome" : "Outcome linkage only applies to Features here"}
          </option>
          {outcomeOptions.map((outcome) => (
            <option key={outcome.id} value={outcome.id}>
              {outcome.journeyTitle} / {outcome.journeyStepTitle} / {outcome.title}
            </option>
          ))}
        </select>
        {selectedType === "feature" ? (
          outcomeOptions.length > 0 ? (
            <p className="mt-1 text-xs text-slate-500">This is the delivery anchor for the Feature. Stories and Tasks will trace through the Feature parent-child chain.</p>
          ) : (
            <p className="mt-1 text-xs text-rose-600">No Outcomes exist for this Product yet. Create journey Outcomes before adding Features.</p>
          )
        ) : null}
      </div>

      {selectedType === "feature" ? (
        <label className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="generate_decomposition"
            value="true"
            defaultChecked
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900"
          />
          <span>
            Automatically generate suggested Stories and Tasks for this outcome-linked Feature.
          </span>
        </label>
      ) : null}

      <button type="submit" className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        Create WorkItem
      </button>
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ENTITY_LINK_TYPE_VALUES, ENTITY_TYPE_VALUES, type EntityLinkOption, type EntityTypeValue } from "@/lib/entity-links";

type EntityLinkCreateFormProps = {
  productId: string;
  entityOptions: EntityLinkOption[];
};

export default function EntityLinkCreateForm({ productId, entityOptions }: EntityLinkCreateFormProps) {
  const [fromEntityType, setFromEntityType] = useState<EntityTypeValue>("product");
  const [toEntityType, setToEntityType] = useState<EntityTypeValue>("work_item");

  const fromOptions = useMemo(
    () => entityOptions.filter((option) => option.entityType === fromEntityType),
    [entityOptions, fromEntityType],
  );
  const toOptions = useMemo(
    () => entityOptions.filter((option) => option.entityType === toEntityType),
    [entityOptions, toEntityType],
  );

  return (
    <form action={`/products/${productId}/entity-links/create`} method="post" className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="from_entity_type" className="mb-1 block text-xs font-medium text-slate-700">
            From entity type
          </label>
          <select
            id="from_entity_type"
            name="from_entity_type"
            value={fromEntityType}
            onChange={(event) => setFromEntityType(event.target.value as EntityTypeValue)}
            className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900"
          >
            {ENTITY_TYPE_VALUES.map((entityType) => (
              <option key={entityType} value={entityType}>
                {entityType}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="from_entity_id" className="mb-1 block text-xs font-medium text-slate-700">
            From entity
          </label>
          <select id="from_entity_id" name="from_entity_id" className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900" defaultValue="">
            <option value="" disabled>
              Select entity
            </option>
            {fromOptions.map((option) => (
              <option key={`${option.entityType}:${option.entityId}`} value={option.entityId}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="relationship_type" className="mb-1 block text-xs font-medium text-slate-700">
            Relationship
          </label>
          <select id="relationship_type" name="relationship_type" defaultValue="relates_to" className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900">
            {ENTITY_LINK_TYPE_VALUES.map((relationshipType) => (
              <option key={relationshipType} value={relationshipType}>
                {relationshipType}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="to_entity_type" className="mb-1 block text-xs font-medium text-slate-700">
            To entity type
          </label>
          <select
            id="to_entity_type"
            name="to_entity_type"
            value={toEntityType}
            onChange={(event) => setToEntityType(event.target.value as EntityTypeValue)}
            className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900"
          >
            {ENTITY_TYPE_VALUES.map((entityType) => (
              <option key={entityType} value={entityType}>
                {entityType}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="to_entity_id" className="mb-1 block text-xs font-medium text-slate-700">
            To entity
          </label>
          <select id="to_entity_id" name="to_entity_id" className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900" defaultValue="">
            <option value="" disabled>
              Select entity
            </option>
            {toOptions.map((option) => (
              <option key={`${option.entityType}:${option.entityId}`} value={option.entityId}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        Create EntityLink
      </button>
    </form>
  );
}

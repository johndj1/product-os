"use client";

import { useState } from "react";

type ChildPrompt = {
  id: string;
  title: string;
  type: string;
  prompt: string;
};

type ChildBuilderPanelProps = {
  productId: string;
  workItemId: string;
  promptChildren: ChildPrompt[];
  missingAcceptanceCriteriaCount: number;
  defaultShowPrompts?: boolean;
};

export default function ChildBuilderPanel({
  productId,
  workItemId,
  promptChildren,
  missingAcceptanceCriteriaCount,
  defaultShowPrompts = false,
}: ChildBuilderPanelProps) {
  const [showPrompts, setShowPrompts] = useState(defaultShowPrompts);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopyAll() {
    try {
      await navigator.clipboard.writeText(
        promptChildren.map((child) => `${child.type.toUpperCase()}: ${child.title}\n\n${child.prompt}`).join("\n\n---\n\n"),
      );
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Builder Preparation</h3>
      <p className="mt-2 text-sm text-slate-600">Prepare direct child Stories and Tasks in this delivery chain without opening each WorkItem individually.</p>

      <div className="mt-3 flex flex-wrap gap-3">
        <form action={`/products/${productId}/work/${workItemId}/generate-children`} method="post">
          <button
            type="submit"
            disabled={missingAcceptanceCriteriaCount === 0}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Generate AC for children
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setShowPrompts(true);
            setCopyState("idle");
          }}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Generate Codex prompts for children
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {missingAcceptanceCriteriaCount === 0
          ? "All direct child Stories and Tasks already have acceptance criteria."
          : `${missingAcceptanceCriteriaCount} direct child WorkItem${missingAcceptanceCriteriaCount === 1 ? "" : "s"} missing acceptance criteria.`}
      </p>

      {showPrompts ? (
        <div className="mt-4 grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-emerald-700">
              Codex prompts prepared for {promptChildren.length} WorkItem{promptChildren.length === 1 ? "" : "s"}.
            </p>
            <button type="button" onClick={handleCopyAll} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Copy All Prompts
            </button>
            <button type="button" onClick={() => setShowPrompts(false)} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Hide Prompts
            </button>
          </div>

          {copyState === "copied" ? <p className="text-xs text-emerald-700">All prompts copied to clipboard.</p> : null}
          {copyState === "failed" ? <p className="text-xs text-rose-700">Clipboard copy failed in this browser context.</p> : null}

          {promptChildren.map((child) => (
            <div key={child.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {child.type} · {child.title}
              </p>
              <pre className="mt-2 overflow-x-auto text-xs text-slate-800">
                <code>{child.prompt}</code>
              </pre>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

"use client";

import { useState } from "react";

type CodexPromptPanelProps = {
  prompt: string;
};

export default function CodexPromptPanel({ prompt }: CodexPromptPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className="mt-3">
      {!isVisible ? (
        <button type="button" onClick={() => setIsVisible(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Generate Codex Prompt
        </button>
      ) : (
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleCopy} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Copy Prompt
            </button>
            <button type="button" onClick={() => setIsVisible(false)} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Hide Prompt
            </button>
          </div>
          {copyState === "copied" ? <p className="text-xs text-emerald-700">Prompt copied to clipboard.</p> : null}
          {copyState === "failed" ? <p className="text-xs text-rose-700">Clipboard copy failed in this browser context.</p> : null}
          <pre className="overflow-x-auto rounded-md border border-slate-300 bg-slate-50 p-3 text-xs text-slate-800">
            <code>{prompt}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

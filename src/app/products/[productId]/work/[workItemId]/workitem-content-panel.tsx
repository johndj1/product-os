import { WorkItemType } from "@prisma/client";
import { getParsedWorkItemContent, WorkItemContentSection } from "@/lib/workitem-content";

type WorkItemContentPanelProps = {
  type: WorkItemType;
  description: string | null;
  acceptanceCriteria: string | null;
};

function renderBulletList(content: string) {
  const items = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s+/, ""));

  return (
    <ul className="space-y-2 text-sm text-slate-700">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function renderGherkin(content: string) {
  const scenarios = content
    .split(/\n\s*\n/)
    .map((scenario) => scenario.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {scenarios.map((scenario, index) => (
        <div key={`${index}-${scenario.slice(0, 24)}`} className="rounded-md border border-slate-200 bg-white p-3">
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">{scenario}</pre>
        </div>
      ))}
    </div>
  );
}

function renderSectionContent(section: WorkItemContentSection) {
  if (section.kind === "bullets") {
    return renderBulletList(section.content);
  }

  if (section.kind === "gherkin") {
    return renderGherkin(section.content);
  }

  return <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{section.content}</p>;
}

export default function WorkItemContentPanel({ type, description, acceptanceCriteria }: WorkItemContentPanelProps) {
  const parsedContent = getParsedWorkItemContent(type, description, acceptanceCriteria);

  if (!description) {
    return <p className="mt-2 text-sm text-slate-500">No description provided.</p>;
  }

  if (!parsedContent.isStructured) {
    return <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-slate-600">{description}</pre>;
  }

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {parsedContent.sections.map((section) => (
        <section key={section.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{section.title}</h3>
          <div className="mt-3">{renderSectionContent(section)}</div>
        </section>
      ))}
    </div>
  );
}

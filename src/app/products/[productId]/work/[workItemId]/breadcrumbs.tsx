import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true" className="text-slate-300">/</span> : null}
            {item.href && !isCurrent ? (
              <Link href={item.href} className="text-slate-600 hover:text-slate-900 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={isCurrent ? "font-medium text-slate-900" : "text-slate-600"}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

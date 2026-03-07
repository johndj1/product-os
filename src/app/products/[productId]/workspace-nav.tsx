"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type WorkspaceNavProps = {
  productId: string;
};

export default function WorkspaceNav({ productId }: WorkspaceNavProps) {
  const pathname = usePathname();

  const items = [
    { label: "Overview", href: `/products/${productId}` },
    { label: "Work", href: `/products/${productId}/work` },
    { label: "Pages", href: `/products/${productId}/pages` },
    { label: "Signals", href: `/products/${productId}/signals` },
  ];

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              isActive
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

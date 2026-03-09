"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref: string;
};

export default function BackButton({ fallbackHref }: BackButtonProps) {
  const router = useRouter();

  function hasSameOriginReferrer(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    if (!document.referrer) {
      return false;
    }

    try {
      return new URL(document.referrer).origin === window.location.origin;
    } catch {
      return false;
    }
  }

  function handleBack() {
    if (typeof window === "undefined") {
      router.push(fallbackHref);
      return;
    }

    const hasHistory = window.history.length > 1;
    const isSameOriginReferrer = hasSameOriginReferrer();

    if (hasHistory && isSameOriginReferrer) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-slate-300"
    >
      Back
    </button>
  );
}

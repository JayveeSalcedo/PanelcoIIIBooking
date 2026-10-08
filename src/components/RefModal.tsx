"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function RefModal({ refNo }: { refNo: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(refNo);
    } catch {
      // Clipboard API unavailable (e.g. plain http): fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = refNo;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Drop ?new=1 so a refresh doesn't reopen the modal.
  function onClose() {
    router.replace(pathname, { scroll: false });
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="ref-modal-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-zinc-900/60"
    >
      <div className="space-y-5 p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
          ✓
        </div>
        <div className="space-y-1">
          <h2 id="ref-modal-title" className="text-xl font-semibold">Request submitted</h2>
          <p className="text-sm text-zinc-500">Your reference number is</p>
        </div>

        <p className="select-all rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 font-mono text-4xl font-bold tracking-wider break-all sm:text-5xl">
          {refNo}
        </p>

        <button type="button" onClick={copy} className={`w-full py-3 text-base ${copied ? "btn-success" : "btn-primary"}`}>
          {copied ? "✓ Copied" : "Copy reference number"}
        </button>

        <p className="text-sm text-zinc-600">
          Save this number — you&apos;ll need it to check the status of your request or cancel it.
        </p>

        <form method="dialog">
          <button className="btn-secondary w-full">Done</button>
        </form>
      </div>
    </dialog>
  );
}

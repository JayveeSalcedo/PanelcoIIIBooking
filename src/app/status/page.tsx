import { lookupRef } from "@/app/actions";

export default function StatusLookupPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Check request status</h1>
      <form action={lookupRef} className="card space-y-3 p-5">
        <label className="label" htmlFor="ref">Reference number</label>
        <input id="ref" name="ref" required placeholder="RB-XXXXXX" className="input font-mono uppercase" autoComplete="off" />
        <button className="btn-primary w-full">Check status</button>
      </form>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Approver sign in</h1>
      <form action={action} className="card space-y-3 p-5">
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoFocus className="input" />
        {state.error && <p className="text-sm text-rose-700">{state.error}</p>}
        <button disabled={pending} className="btn-primary w-full">Sign in</button>
      </form>
    </div>
  );
}

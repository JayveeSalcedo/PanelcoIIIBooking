import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1 rounded-lg bg-zinc-200/60 p-1 text-sm">
          <Link href="/admin" className="rounded-md px-3 py-1.5 hover:bg-white">Requests</Link>
          <Link href="/admin/rooms" className="rounded-md px-3 py-1.5 hover:bg-white">Rooms</Link>
        </nav>
        <form action={logout}>
          <button className="text-sm text-zinc-500 hover:text-zinc-900">Sign out</button>
        </form>
      </div>
      {children}
    </div>
  );
}

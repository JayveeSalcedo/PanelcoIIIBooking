import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-xl font-semibold">Request not found</h1>
      <p className="text-sm text-zinc-500">Check the reference number and try again.</p>
      <Link href="/status" className="btn-secondary">Look up another</Link>
    </div>
  );
}

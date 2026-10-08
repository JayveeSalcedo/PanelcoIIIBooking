import { requireAdmin } from "@/lib/auth";
import { listRooms } from "@/lib/bookings";
import type { Room } from "@/db/schema";
import { saveRoom } from "../actions";

export default async function RoomsPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  await requireAdmin();
  const { msg } = await searchParams;
  const rooms = await listRooms(false);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Rooms</h1>
        <p className="text-sm text-zinc-500">
          Leave capacity blank if unknown — no capacity check is applied. Inactive rooms are hidden from the request form.
        </p>
      </div>
      {msg && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-900">{msg}</div>}
      <div className="space-y-2">
        {rooms.map((r) => <RoomRow key={r.id} room={r} />)}
        <h2 className="pt-4 text-sm font-semibold text-zinc-700">Add a room</h2>
        <RoomRow />
      </div>
    </div>
  );
}

function RoomRow({ room }: { room?: Room }) {
  return (
    <form action={saveRoom} className="card grid items-end gap-3 p-3 sm:grid-cols-[1fr_140px_90px_auto_auto]">
      <input type="hidden" name="id" value={room?.id ?? ""} />
      <div>
        <label className="label">Name</label>
        <input name="name" required defaultValue={room?.name} className="input" />
      </div>
      <div>
        <label className="label">Capacity (pax)</label>
        <input name="capacity" type="number" min={1} defaultValue={room?.capacity ?? ""} className="input" />
      </div>
      <div>
        <label className="label">Order</label>
        <input name="sortOrder" type="number" defaultValue={room?.sortOrder ?? 99} className="input" />
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm">
        <input name="active" type="checkbox" defaultChecked={room?.active ?? true} /> Active
      </label>
      <button className="btn-secondary">{room ? "Save" : "Add"}</button>
    </form>
  );
}

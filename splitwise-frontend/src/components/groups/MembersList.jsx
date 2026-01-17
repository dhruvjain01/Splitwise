export default function MembersList({ members }) {
  if (!members || members.length === 0) {
    return (
      <div className="rounded-xl border bg-gray-50 p-4 text-gray-600">
        No members found.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((m) => (
        <div
          key={m.id || m.userId || m.email}
          className="flex items-center justify-between rounded-xl border p-3"
        >
          <div>
            <div className="font-medium">{m.name || "Unnamed User"}</div>
            <div className="text-sm text-gray-500">{m.email}</div>
          </div>

          <div className="text-xs text-gray-500">
            {m.id || m.userId}
          </div>
        </div>
      ))}
    </div>
  );
}

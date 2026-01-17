export default function GroupCard({ group, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border bg-white p-4 shadow-sm hover:shadow transition"
    >
      <div className="text-lg font-semibold">{group?.name}</div>
      <div className="text-sm text-gray-500 mt-1">
        Group ID: {group?.id}
      </div>
    </button>
  );
}

import SettlementLine from "./SettlementLine";

export default function SettlementList({ settlements, userMap }) {
  if (!settlements || settlements.length === 0) {
    return (
      <div className="rounded-2xl border bg-gray-50 p-5 text-gray-600">
        🎉 Everyone is settled up (or no expenses yet).
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {settlements.map((s, idx) => (
        <SettlementLine key={idx} line={s} userMap={userMap} />
      ))}
    </div>
  );
}

import NetBalanceRow from "./NetBalanceRow";

export default function NetBalancesList({ balances }) {
  if (!balances || balances.length === 0) {
    return (
      <div className="rounded-2xl border bg-gray-50 p-5 text-gray-600">
        No balances available yet. Add expenses first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {balances.map((b) => (
        <NetBalanceRow key={b.userId || b.id || b.email} row={b} />
      ))}
    </div>
  );
}

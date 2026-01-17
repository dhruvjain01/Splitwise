import { formatCurrency } from "../../utils/formatCurrency";

export default function SettlementLine({ line, userMap }) {
  const from = userMap[line.fromUserId] || { name: line.fromUserId };
  const to = userMap[line.toUserId] || { name: line.toUserId };

  return (
    <div className="flex items-center justify-between rounded-xl border p-3">
      <div className="text-sm">
        <span className="font-semibold">{from.name}</span>{" "}
        <span className="text-gray-600">owes</span>{" "}
        <span className="font-semibold">{to.name}</span>
      </div>

      <div className="text-sm font-semibold">{formatCurrency(line.amount)}</div>
    </div>
  );
}

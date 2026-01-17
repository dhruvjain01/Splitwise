import { formatCurrency } from "../../utils/formatCurrency";

export default function NetBalanceRow({ row }) {
  const bal = Number(row.balance || 0);

  return (
    <div className="flex items-center justify-between rounded-xl border p-3">
      <div>
        <div className="font-medium">{row.name || "Unnamed"}</div>
        <div className="text-sm text-gray-500">{row.email || row.userId}</div>
      </div>

      <div
        className={`text-sm font-semibold ${
          bal > 0 ? "text-green-600" : bal < 0 ? "text-red-600" : "text-gray-600"
        }`}
      >
        {bal > 0 ? `+ ${formatCurrency(bal)}` : formatCurrency(bal)}
      </div>
    </div>
  );
}

import { formatCurrency } from "../../utils/formatCurrency";

export default function ExpenseCard({ expense }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">{expense?.description || "Expense"}</div>
          <div className="text-sm text-gray-500 mt-1">
            Paid by: <span className="font-medium">{expense?.payerName || expense?.payerEmail || expense?.payerId}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold">{formatCurrency(expense?.amount)}</div>
          <div className="text-xs text-gray-500 mt-1">Split: {expense?.splitType}</div>
        </div>
      </div>
    </div>
  );
}

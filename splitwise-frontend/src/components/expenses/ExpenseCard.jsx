import { formatCurrency } from "../../utils/formatCurrency";

export default function ExpenseCard({ expense, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">{expense?.description || "Expense"}</div>
          <div className="text-sm text-gray-500 mt-1">
            Paid by:{" "}
            <span className="font-medium">
              {expense?.paidByUserId || expense?.payerId || "Unknown"}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Split: {expense?.splitType}</div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold">{formatCurrency(expense?.amount)}</div>

          <div className="flex gap-2 justify-end mt-3">
            <button
              onClick={() => onEdit(expense)}
              className="rounded-xl border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(expense)}
              className="rounded-xl border px-3 py-1 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

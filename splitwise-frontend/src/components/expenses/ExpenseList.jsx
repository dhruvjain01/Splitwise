import ExpenseCard from "./ExpenseCard";

export default function ExpenseList({ expenses, onEdit, onDelete }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="rounded-2xl border bg-gray-50 p-5 text-gray-600">
        No expenses yet. Add your first expense 💸
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((e) => (
        <ExpenseCard key={e.id} expense={e} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

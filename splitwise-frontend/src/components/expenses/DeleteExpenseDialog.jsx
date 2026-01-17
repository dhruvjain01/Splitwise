import Modal from "../common/Modal";
import Button from "../common/Button";

export default function DeleteExpenseDialog({ open, onClose, expense, onConfirm }) {
  return (
    <Modal open={open} title="Delete Expense" onClose={onClose}>
      <div className="space-y-5">

        {/* content */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Expense
          </div>

          <div className="mt-2 text-base font-extrabold tracking-tight text-slate-900">
            {expense?.description || "Untitled expense"}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            If this expense affects balances, they will be recalculated after deletion.
          </p>
        </div>

        {/* actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button
            onClick={onClose}
            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>

          <Button
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}

import Modal from "../common/Modal";
import Button from "../common/Button";
import { formatCurrency } from "../../utils/formatCurrency";

export default function SettlePaymentModal({
  open,
  onClose,
  onConfirm,
  loading,
  err,
  fromName,
  toName,
  amount,
}) {
  return (
    <Modal open={open} title="Confirm Settlement" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          You are about to mark this payment as settled:
        </p>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{fromName}</span>{" "}
            <span className="text-slate-600">pays</span>{" "}
            <span className="font-semibold text-slate-900">{toName}</span>
          </div>

          <div className="mt-2 text-lg font-extrabold text-slate-900">
            {formatCurrency(Number(amount || 0))}
          </div>
        </div>

        {err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            onClick={onClose}
            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {loading ? "Settling..." : "Confirm Settle"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

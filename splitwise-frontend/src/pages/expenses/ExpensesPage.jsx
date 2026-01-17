import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import { expenseService } from "../../services/expenseService";
import { groupService } from "../../services/groupService";
import { formatCurrency } from "../../utils/formatCurrency";
import DeleteExpenseDialog from "../../components/expenses/DeleteExpenseDialog";
// modals (keep your existing ones)
import AddExpenseModal from "../../components/expenses/AddExpenseModal";
import EditExpenseModal from "../../components/expenses/EditExpenseModal";

export default function ExpensesPage() {
  const { groupId } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);


  const userMap = useMemo(() => {
    const map = {};
    (members || []).forEach((m) => {
      const id = m.id || m.userId;
      map[id] = { name: m.name || m.email, email: m.email };
    });
    return map;
  }, [members]);

  const getName = (userId) => userMap[userId]?.name || userId;

  const unwrap = (res) => {
    if (!res) return res;
    if (typeof res === "object" && "data" in res) return res.data;
    return res;
  };

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const mRes = await groupService.getMembers(groupId);
      setMembers(unwrap(mRes) || []);

      const eRes = await expenseService.getExpenses(groupId);
      setExpenses(unwrap(eRes) || []);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [groupId]);

  const openEditModal = (expense) => {
    setSelectedExpense(expense);
    setOpenEdit(true);
  };

  const deleteExpense = (expense) => {
  // ✅ open modal instead of window.confirm
  setDeleteTarget(expense);
  setOpenDelete(true);
};

const confirmDeleteExpense = async () => {
  if (!deleteTarget?.id) return;

  try {
    await expenseService.deleteExpense(groupId, deleteTarget.id);
    setOpenDelete(false);
    setDeleteTarget(null);
    await load();
  } catch (e) {
    alert(e.response?.data?.message || "Failed to delete expense");
  }
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Expenses
          </div>

          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
            Expenses & Splits
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Add expenses and track who paid, who owes, and how it's split.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setOpenAdd(true)}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            + Add Expense
          </Button>

          <Button
            onClick={load}
            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error */}
      {err ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {/* Loading */}
      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-60 rounded-xl bg-slate-100" />
            <div className="h-24 w-full rounded-3xl bg-slate-100" />
            <div className="h-24 w-full rounded-3xl bg-slate-100" />
            <div className="h-24 w-full rounded-3xl bg-slate-100" />
          </div>
        </div>
      ) : null}

      {/* Content */}
      {!loading ? (
        <>
          {expenses.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white grid place-items-center font-black shadow-sm">
                  $
                </div>

                <div className="flex-1">
                  <div className="text-lg font-extrabold tracking-tight text-slate-900">
                    No expenses yet
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Add your first expense to start tracking balances.
                  </p>

                  <div className="mt-5">
                    <Button
                      onClick={() => setOpenAdd(true)}
                      className="bg-slate-900 text-white hover:bg-slate-800"
                    >
                      + Add Expense
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((ex) => {
                const payerName = getName(ex.paidByUserId || ex.paidBy);

                return (
                  <div
                    key={ex.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    {/* Top row */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-base font-extrabold tracking-tight text-slate-900 truncate">
                          {ex.description || "Expense"}
                        </div>

                        <div className="mt-1 text-sm text-slate-500">
                          Paid by{" "}
                          <span className="font-semibold text-slate-700">
                            {payerName}
                          </span>{" "}
                          • Split:{" "}
                          <span className="font-semibold text-slate-700">
                            {ex.splitType}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-bold text-slate-900">
                          {formatCurrency(ex.amount)}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(ex)}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteExpense(ex)}
                            className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {/* Add Modal */}
      <AddExpenseModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        members={members}
        onCreate={async (payload) => {
          await expenseService.addExpense(groupId, payload);
          setOpenAdd(false);
          await load();
        }}
      />

      {/* Edit Modal */}
      <EditExpenseModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        members={members}
        expense={selectedExpense}
        onUpdate={async (payload) => {
          await expenseService.updateExpense(groupId, selectedExpense.id, payload);
          setOpenEdit(false);
          await load();
        }}
      />

      <DeleteExpenseDialog
        open={openDelete}
        onClose={() => {
          setOpenDelete(false);
          setDeleteTarget(null);
        }}
        expense={deleteTarget}
        onConfirm={confirmDeleteExpense}
      />

    </div>
  );
}

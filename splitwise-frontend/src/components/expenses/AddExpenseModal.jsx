import { useEffect, useMemo, useState } from "react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";

const SPLIT_TYPES = ["EQUAL", "EXACT", "PERCENTAGE"];

export default function AddExpenseModal({ open, onClose, members, onCreate }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const [paidByUserId, setPaidByUserId] = useState("");
  const [splitType, setSplitType] = useState("EQUAL");

  // userId -> string input
  const [splitDetails, setSplitDetails] = useState({});

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const memberOptions = useMemo(() => {
    return (members || []).map((m) => ({
      id: m.id || m.userId,
      name: m.name || m.email,
      email: m.email,
    }));
  }, [members]);

  useEffect(() => {
    if (!open) return;

    // reset on open
    setErr("");
    setDescription("");
    setAmount("");
    setSplitType("EQUAL");

    const first = memberOptions[0]?.id || "";
    setPaidByUserId(first);

    const init = {};
    memberOptions.forEach((m) => (init[m.id] = ""));
    setSplitDetails(init);
  }, [open, memberOptions]);

  const setSplitValue = (userId, value) => {
    setSplitDetails((prev) => ({ ...prev, [userId]: value }));
  };

  const deriveParticipantUserIds = () => {
    if (splitType === "EQUAL") return memberOptions.map((m) => m.id);

    // EXACT / PERCENTAGE: include only > 0
    return memberOptions
      .map((m) => m.id)
      .filter((id) => Number(splitDetails[id] || 0) > 0);
  };

  const validate = () => {
    const amt = Number(amount);

    if (!description.trim()) return "Description is required";
    if (!amt || amt <= 0) return "Amount must be greater than 0";
    if (!paidByUserId) return "Paid by is required";
    if (memberOptions.length === 0) return "No group members found";

    const participants = deriveParticipantUserIds();

    if (splitType === "EQUAL") {
      if (!participants || participants.length === 0)
        return "No members available to split";
    }

    if (splitType === "EXACT") {
      if (participants.length === 0)
        return "Enter exact amount > 0 for at least one member";

      let sum = 0;
      for (const id of participants) {
        const v = Number(splitDetails[id] || 0);
        if (v < 0) return "Exact values must be >= 0";
        sum += v;
      }
      if (Math.abs(sum - amt) > 0.01) {
        return `Exact split must total ${amt}. Current total is ${sum.toFixed(2)}.`;
      }
    }

    if (splitType === "PERCENTAGE") {
      if (participants.length === 0)
        return "Enter percentage > 0 for at least one member";

      let sum = 0;
      for (const id of participants) {
        const v = Number(splitDetails[id] || 0);
        if (v < 0) return "Percent values must be >= 0";
        sum += v;
      }
      if (Math.abs(sum - 100) > 0.01) {
        return `Percentage split must total 100%. Current total is ${sum.toFixed(
          2
        )}%.`;
      }
    }

    return null;
  };

  const buildPayload = () => {
    const amt = Number(amount);
    const participantUserIds = deriveParticipantUserIds();

    let splitDetailsPayload = null;

    if (splitType === "EXACT" || splitType === "PERCENTAGE") {
      splitDetailsPayload = {};
      participantUserIds.forEach((id) => {
        splitDetailsPayload[id] = Number(splitDetails[id] || 0);
      });
    }

    return {
      description: description.trim(),
      paidByUserId,
      amount: amt,
      participantUserIds,
      splitType,
      splitDetails: splitDetailsPayload,
    };
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    const error = validate();
    if (error) {
      setErr(error);
      return;
    }

    try {
      setLoading(true);
      const payload = buildPayload();
      await onCreate(payload);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  // totals UI
  const amt = Number(amount || 0);
  const exactTotal = memberOptions.reduce((acc, m) => acc + (Number(splitDetails[m.id] || 0) || 0), 0);
  const percentTotal = memberOptions.reduce((acc, m) => acc + (Number(splitDetails[m.id] || 0) || 0), 0);

  return (
    <Modal open={open} title="Add Expense" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        {/* error */}
        {err ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        {/* top details */}
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Expense Details
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner"
            />

            <Input
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Paid by */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Paid by
              </label>
              <select
                value={paidByUserId}
                onChange={(e) => setPaidByUserId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-slate-900 outline-none"
              >
                {memberOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Split type */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Split type
              </label>
              <select
                value={splitType}
                onChange={(e) => setSplitType(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-slate-900 outline-none"
              >
                {SPLIT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Split content */}
        {splitType === "EQUAL" ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-700 font-semibold">
              Equal split
            </div>
            <div className="mt-1 text-sm text-slate-500">
              All members will be included automatically.
            </div>
          </div>
        ) : null}

        {splitType === "EXACT" ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Exact split amounts
              </div>
              <div className="text-sm text-slate-500">
                Leave blank / 0 to exclude a member.
              </div>
            </div>

            <div className="space-y-2">
              {memberOptions.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {m.name}
                    </div>
                    {/* <div className="text-xs text-slate-500 truncate">{m.email}</div> */}
                  </div>

                  <input
                    type="number"
                    value={splitDetails[m.id] ?? ""}
                    onChange={(e) => setSplitValue(m.id, e.target.value)}
                    placeholder="0"
                    className="w-28 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>
              ))}
            </div>

            <div className="text-xs text-slate-500">
              Total: <span className="font-semibold">{exactTotal.toFixed(2)}</span>{" "}
              / {amt.toFixed(2)}
            </div>
          </div>
        ) : null}

        {splitType === "PERCENTAGE" ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Percentage split
              </div>
              <div className="text-sm text-slate-500">
                Leave blank / 0 to exclude a member.
              </div>
            </div>

            <div className="space-y-2">
              {memberOptions.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {m.name}
                    </div>
                    {/* <div className="text-xs text-slate-500 truncate">{m.email}</div> */}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={splitDetails[m.id] ?? ""}
                      onChange={(e) => setSplitValue(m.id, e.target.value)}
                      placeholder="0"
                      className="w-24 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                    />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-slate-500">
              Total: <span className="font-semibold">{percentTotal.toFixed(2)}%</span>{" "}
              / 100%
            </div>
          </div>
        ) : null}

        {/* actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            onClick={onClose}
            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>

          <Button
            disabled={loading}
            type="submit"
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {loading ? "Adding..." : "Add Expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

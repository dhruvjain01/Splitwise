import { useState } from "react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import { groupService } from "../../services/groupService";

export default function AddMemberModal({ open, onClose, groupId, onAdded }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!email.trim()) {
      setErr("Member email is required");
      return;
    }

    try {
      setLoading(true);
      await groupService.addMember(groupId, { email: email.trim() }); // ✅ keep your service function
      setEmail("");
      onAdded?.();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title="Add Member" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="text-sm text-slate-600">
          Enter the user’s email. If they exist in the system, they’ll be added to the group.
        </div>

        {err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <Input
          label="Member Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@gmail.com"
        />

        <div className="flex items-center justify-end gap-2 pt-2">
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
            {loading ? "Adding..." : "Add Member"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

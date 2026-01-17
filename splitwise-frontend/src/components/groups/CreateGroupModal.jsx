import { useState } from "react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import { groupService } from "../../services/groupService";

export default function CreateGroupModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!name.trim()) {
      setErr("Group name is required");
      return;
    }

    try {
      setLoading(true);
      await groupService.createGroup({ name: name.trim() });
      setName("");
      onCreated?.();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title="Create Group" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="text-sm text-slate-600">
          Choose a simple name like <span className="font-semibold">“Goa Trip”</span>{" "}
          or <span className="font-semibold">“Flatmates”</span>.
        </div>

        {err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <Input
          label="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bali Trip"
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
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

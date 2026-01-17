import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import AddMemberModal from "../../components/groups/AddMemberModal";
import { groupService } from "../../services/groupService";

export default function GroupDashboardPage() {
  const { groupId } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);

  const [openAddMember, setOpenAddMember] = useState(false);

  const memberOptions = useMemo(() => {
    return (members || []).map((m) => ({
      id: m.id || m.userId,
      name: m.name || m.email,
      email: m.email,
    }));
  }, [members]);

  // ✅ unwrap {message,data} style response
  const unwrap = (res) => {
    if (!res) return res;
    if (typeof res === "object" && "data" in res) {
      return res.data
    };
    return res;
  };

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      // ✅ FIX: backend returns { message, data }
      const gRes = await groupService.getGroups(groupId);
      const g = unwrap(gRes);
      setGroup(g);

      const mRes = await groupService.getMembers(groupId);
      const list = unwrap(mRes);
      setMembers(list || []);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load group");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [groupId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Dashboard
          </div>

          {/* ✅ show group name */}
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
            {group?.name || "Group"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage members and expenses for this group.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => nav(`/groups/${groupId}/expenses`)}
            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            View Expenses →
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
            <div className="h-6 w-52 rounded-xl bg-slate-100" />
            <div className="h-24 w-full rounded-3xl bg-slate-100" />
            <div className="h-24 w-full rounded-3xl bg-slate-100" />
          </div>
        </div>
      ) : null}

      {/* Content */}
      {!loading ? (
        <>
          {/* Members */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-base font-extrabold tracking-tight text-slate-900">
                  Members
                </div>
                <div className="text-sm text-slate-500">
                  {memberOptions.length} member{memberOptions.length === 1 ? "" : "s"}
                </div>
              </div>

              <Button
                onClick={() => setOpenAddMember(true)}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                + Add Member
              </Button>
            </div>

            <div className="p-5">
              {memberOptions.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
                  No members yet. Add members to start splitting expenses.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {memberOptions.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-3xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-slate-100 border border-slate-200 grid place-items-center text-slate-600 font-bold">
                          {(m.name || "U")[0]?.toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {m.name || "Unnamed"}
                          </div>
                          <div className="text-sm text-slate-500 truncate">
                            {m.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      {/* Add Member Modal */}
      <AddMemberModal
        open={openAddMember}
        onClose={() => setOpenAddMember(false)}
        groupId={groupId}
        onAdded={async () => {
          setOpenAddMember(false);
          await load();
        }}
      />
    </div>
  );
}

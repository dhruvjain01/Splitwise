import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import CreateGroupModal from "../../components/groups/CreateGroupModal";
import { groupService } from "../../services/groupService";

export default function GroupsListPage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [groups, setGroups] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const list = await groupService.getGroups();
      setGroups(list || []);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onGroupCreated = async () => {
    setOpenCreate(false);
    await load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Groups
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create groups for trips, roommates, parties, events — and track expenses easily.
          </p>
        </div>

        <Button
          onClick={() => setOpenCreate(true)}
          className="bg-slate-900 text-white hover:bg-slate-800"
        >
          + Create Group
        </Button>
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
          {groups.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white grid place-items-center font-black shadow-sm">
                  S
                </div>

                <div className="flex-1">
                  <div className="text-lg font-extrabold tracking-tight text-slate-900">
                    No groups yet
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Create your first group to start tracking shared expenses.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      onClick={() => setOpenCreate(true)}
                      className="bg-slate-900 text-white hover:bg-slate-800"
                    >
                      + Create Group
                    </Button>
                    <Button
                      onClick={load}
                      className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => {
                const membersCount = (g.members || []).length;

                return (
                  <button
                    key={g.id}
                    onClick={() => nav(`/groups/${g.id}`)}
                    className="group text-left rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
                  >
                    {/* Top */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-extrabold tracking-tight text-slate-900 truncate">
                          {g.name || "Untitled group"}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {membersCount} member{membersCount === 1 ? "" : "s"}
                        </div>
                      </div>

                      <div className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-200 grid place-items-center text-slate-600 group-hover:bg-slate-100 transition">
                        →
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {/* Modal */}
      <CreateGroupModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={onGroupCreated}
      />
    </div>
  );
}

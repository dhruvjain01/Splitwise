import { NavLink, Outlet, useParams } from "react-router-dom";

const tabClass = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition
   ${
     isActive
       ? "bg-slate-900 text-white"
       : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
   }`;

export default function GroupLayout() {
  const { groupId } = useParams();

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <NavLink to={`/groups/${groupId}`} end className={tabClass}>
          🧭 Dashboard
        </NavLink>

        <NavLink to={`/groups/${groupId}/expenses`} className={tabClass}>
          💳 Expenses
        </NavLink>

        {/* <NavLink to={`/groups/${groupId}/balances`} className={tabClass}>
          ⚖️ Balances
        </NavLink> */}

        <NavLink to={`/groups/${groupId}/settle`} className={tabClass}>
          ✅ Settle Up
        </NavLink>
      </div>

      {/* Page container */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

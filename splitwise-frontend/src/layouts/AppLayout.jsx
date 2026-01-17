import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItem = ({ isActive }) =>
  `flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition
   ${
     isActive
       ? "bg-slate-900 text-white shadow-sm"
       : "text-slate-700 hover:bg-slate-100"
   }`;

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between py-3">
            {/* Brand */}
            <Link to="/groups" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white grid place-items-center font-black">
                S
              </div>
              <div className="leading-tight">
                <div className="text-sm font-extrabold tracking-tight">
                  Splitwise
                </div>
              </div>
            </Link>

            {/* User */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-slate-900">
                  {user?.name || "User"}
                </div>
                <div className="text-xs text-slate-500">{user?.email}</div>
              </div>

              <button
                onClick={logout}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Shell */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-12 gap-4">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-4 lg:col-span-3 xl:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Navigation
                </div>

                <nav className="mt-3 space-y-1">
                  <NavLink to="/groups" className={navItem}>
                    <span className="text-base">📁</span>
                    <span>Groups</span>
                  </NavLink>
                </nav>

                <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3 text-xs text-slate-600">
                  Tip: Use Groups to create trips, roommates, events etc.
                </div>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="col-span-12 md:col-span-8 lg:col-span-9 xl:col-span-10">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-5">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

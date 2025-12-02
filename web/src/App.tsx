import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Dashboard from "./pages/Dashboard";
import Buildings from "./pages/Buildings";
import BuildingView from "./pages/BuildingView";
import GeneratorView from "./pages/GeneratorView";
import Assignments from "./pages/Assignments";
import Escalations from "./pages/Escalations";
import Completed from "./pages/Completed";
import CreateAccount from "./pages/CreateAccount";
import UploadBrainMock from "./pages/UploadBrainMock";
import Login from "./pages/Login";

import {
  LayoutGrid,
  Building2,
  Siren,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";

import { users } from "./data/users";
import {
  getCurrentUser,
  setCurrentUserById,
  subscribeUser,
} from "./data/userStore";

import { getAuthState, subscribeAuth, signOut } from "./data/authStore";
import type { JSX } from "react/jsx-runtime";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/buildings", label: "Buildings", icon: Building2 },
  { to: "/escalations", label: "Escalations", icon: Siren },
  { to: "/assignments", label: "My Tasks", icon: ClipboardCheck },
  { to: "/completed", label: "Completed", icon: CheckCircle2 },
];

function SideItem({ to, label, icon: Icon }: any) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
          isActive
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-700 hover:bg-slate-100",
        ].join(" ")
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const [authed, setAuthed] = useState(
    !!getAuthState().currentAccountId
  );

  useEffect(() => {
    return subscribeAuth((s) => setAuthed(!!s.currentAccountId));
  }, []);

  if (!authed) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  // mock role switch for now (still useful)
  const [me, setMe] = useState(getCurrentUser());
  useEffect(() => subscribeUser(setMe), []);

  const devUser = users.find((u) => u.role === "DEVELOPER")!;
  const mockDceo = users.find((u) => u.role === "DCEO")!;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto grid max-w-[1500px] grid-cols-[260px_1fr]">

          {/* Sidebar hidden on login/signup routes? keep simple for now */}
          <aside className="sticky top-0 h-screen border-r border-slate-200 bg-white px-3 py-4">
            <div className="px-2">
              <div className="text-lg font-extrabold tracking-tight">
                Generator Ops
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Maintenance • Tasks • Reporting
              </div>
            </div>

            <nav className="mt-5 flex flex-col gap-1">
              {nav.map((n) => (
                <SideItem key={n.to} {...n} />
              ))}
            </nav>

            <div className="mt-auto px-2 pt-6 text-[11px] text-slate-400">
              v0.9 • auth live
            </div>
          </aside>

          <main className="p-5 md:p-7">

            {/* Top Bar (only meaningful when authed, fine to leave) */}
            <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-sm font-semibold text-slate-600">
                Live sync:{" "}
                <span className="font-extrabold text-slate-900">Mock Brain</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-700">
                  Role:
                  <select
                    value={me.id}
                    onChange={(e) => setCurrentUserById(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-extrabold text-slate-900 outline-none"
                  >
                    <option value={devUser.id}>
                      Developer • {devUser.name}
                    </option>
                    <option value={mockDceo.id}>
                      DCEO • {mockDceo.name}
                    </option>
                  </select>
                </div>

                <button
                  onClick={() => signOut()}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                >
                  Sign out
                </button>

                <div className="text-right">
                  <div className="text-sm font-extrabold leading-none">
                    {me.name}
                  </div>
                  <div className="text-[11px] text-slate-500">{me.role}</div>
                </div>

                <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-white text-sm font-extrabold">
                  {me.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                </div>
              </div>
            </div>

            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/create-account" element={<CreateAccount />} />

              {/* Protected app */}
              <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/buildings" element={<RequireAuth><Buildings /></RequireAuth>} />
              <Route path="/buildings/:buildingId" element={<RequireAuth><BuildingView /></RequireAuth>} />
              <Route path="/generators/:generatorId" element={<RequireAuth><GeneratorView /></RequireAuth>} />
              <Route path="/assignments" element={<RequireAuth><Assignments /></RequireAuth>} />
              <Route path="/escalations" element={<RequireAuth><Escalations /></RequireAuth>} />
              <Route path="/completed" element={<RequireAuth><Completed /></RequireAuth>} />
              <Route path="/upload-brain" element={<RequireAuth><UploadBrainMock /></RequireAuth>} />

              {/* Default unknown → login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

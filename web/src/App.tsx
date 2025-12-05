import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Buildings from "./pages/Buildings";
import BuildingView from "./pages/BuildingView";
import GeneratorView from "./pages/GeneratorView";
import WorkOrders from "./pages/WorkOrders";
import UploadData from "./pages/UploadData";
import TodayPage from "./pages/Today";
import MyTasksPage from "./pages/MyTasks";
import EscalatedPage from "./pages/Escalated";

import {
  LayoutGrid,
  Building2,
  ClipboardList,
  Upload,
  Zap,
  CalendarDays,
  User,
  AlertTriangle,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/today", label: "Today", icon: CalendarDays },
  { to: "/my-tasks", label: "My Tasks", icon: User },
  { to: "/escalated", label: "Escalated", icon: AlertTriangle },
  { to: "/buildings", label: "Buildings", icon: Building2 },
  { to: "/work-orders", label: "Work Orders", icon: ClipboardList },
  { to: "/upload", label: "Upload Data", icon: Upload },
];

function SideItem({ to, label, icon: Icon }: { to: string; label: string; icon: any }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200",
          isActive
            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/40"
            : "text-slate-400 hover:bg-slate-800/70 hover:text-white hover:translate-x-1",
        ].join(" ")
      }
    >
      <div className="grid h-7 w-7 place-items-center rounded-lg bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors">
        <Icon size={14} />
      </div>
      {label}
    </NavLink>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950">
        <div className="mx-auto grid max-w-[1600px] grid-cols-[220px_1fr]">
          {/* Sidebar */}
          <aside className="sticky top-0 h-screen border-r border-slate-800/40 bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-950 px-3 py-5">
            {/* Logo */}
            <div className="px-2 mb-8">
              <div className="flex items-center gap-3">
                <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/40">
                  <Zap size={18} />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
                </div>
                <div>
                  <div className="text-base font-black text-white tracking-tight">
                    GenOps
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Generator Operations
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="mb-4 px-3">
              <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Menu</div>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((n) => (
                <SideItem key={n.to} {...n} />
              ))}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-5 left-3 right-3">
              <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-3">
                <div className="text-[10px] font-bold text-slate-500">GenOps v1.0</div>
                <div className="text-[9px] text-slate-600 mt-0.5">CSV Import System</div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="p-6 bg-gradient-to-br from-slate-950 via-slate-900/95 to-slate-950 min-h-screen">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/today" element={<TodayPage />} />
              <Route path="/my-tasks" element={<MyTasksPage />} />
              <Route path="/escalated" element={<EscalatedPage />} />
              <Route path="/buildings" element={<Buildings />} />
              <Route path="/buildings/:buildingId" element={<BuildingView />} />
              <Route path="/generators/:buildingId/:generatorId" element={<GeneratorView />} />
              <Route path="/work-orders" element={<WorkOrders />} />
              <Route path="/work-orders/:woId" element={<WorkOrders />} />
              <Route path="/upload" element={<UploadData />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

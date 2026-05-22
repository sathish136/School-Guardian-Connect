import { useState } from "react";
import {
  useListBuses, useCreateBus, useUpdateBus, useDeleteBus,
  useListRoutes, getListBusesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ArrowLeft, Save, Bus, User, Phone, MapPin, Users as UsersIcon, Hash } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import type { Bus as BusType, BusInput } from "@workspace/api-client-react";

const ACCENT = "#F59E0B";
const BORDER = "#E2E8F0";
const MUTED = "#64748B";
const HEAD = "#0F172A";

type View = "list" | "add" | { edit: BusType };

function Inp({ label, hint, value, onChange, placeholder, type = "text", icon: Icon, required }: {
  label: string; hint?: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: React.ElementType; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <label className="text-[13px] font-semibold" style={{ color: HEAD }}>{label}</label>
        {hint && <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{hint}</p>}
      </div>
      <div className="relative">
        {Icon && <Icon style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: MUTED }} />}
        <input
          type={type}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-10 pr-3 rounded-xl text-sm outline-none transition-all"
          style={{ border: `1px solid ${BORDER}`, background: "#fff", color: HEAD, paddingLeft: Icon ? "2.25rem" : "0.875rem" }}
          onFocus={e => (e.target.style.borderColor = ACCENT)}
          onBlur={e => (e.target.style.borderColor = BORDER)}
        />
      </div>
    </div>
  );
}

function BusFullForm({ initial, routes, onSubmit, onCancel, isPending }: {
  initial?: BusType;
  routes: { id: number; name: string }[];
  onSubmit: (data: BusInput) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<BusInput>({
    busNumber: initial?.busNumber ?? "",
    driverName: initial?.driverName ?? "",
    driverPhone: initial?.driverPhone ?? "",
    routeId: initial?.routeId ?? null,
    capacity: initial?.capacity ?? 40,
    isActive: initial?.isActive ?? true,
  });

  return (
    <div className="space-y-6">
      {/* Back header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
          style={{ color: MUTED, background: "#fff", border: `1px solid ${BORDER}` }}
          onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
          onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />
          Back to buses
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: HEAD }}>
            {initial ? `Edit — Bus ${initial.busNumber}` : "Add New Bus"}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>
            {initial ? "Update bus details and driver assignment" : "Register a new bus in the fleet"}
          </p>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
        <div className="grid grid-cols-3 gap-6">
          {/* Left — Bus Card Preview */}
          <div className="col-span-1 space-y-4">
            {/* Bus preview card */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
              <div className="h-28 relative" style={{ background: "#1E3A5F" }}>
                <img
                  src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80"
                  alt="Bus"
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.35 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-black text-white">{form.busNumber || "—"}</p>
                    <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Bus Number</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 space-y-2">
                <div className="flex items-center gap-2 text-sm" style={{ color: HEAD }}>
                  <User style={{ width: 13, height: 13, color: MUTED }} />
                  <span className="font-medium">{form.driverName || "Driver name"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                  <Phone style={{ width: 12, height: 12 }} />
                  {form.driverPhone || "Driver phone"}
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                  <MapPin style={{ width: 12, height: 12 }} />
                  {form.routeId ? routes.find(r => r.id === form.routeId)?.name : "No route"}
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                  <UsersIcon style={{ width: 12, height: 12 }} />
                  {form.capacity ?? 40} seats capacity
                </div>
              </div>
            </div>

            {/* Status toggle */}
            <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>Bus Status</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: HEAD }}>{form.isActive ? "Active" : "Inactive"}</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>{form.isActive ? "Available for trips" : "Not in service"}</p>
                </div>
                <Switch checked={form.isActive ?? true} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
              </div>
            </div>
          </div>

          {/* Right columns */}
          <div className="col-span-2 space-y-4">
            {/* Bus details */}
            <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>Bus Details</p>
              <div className="grid grid-cols-2 gap-4">
                <Inp
                  label="Bus Number"
                  hint="Unique identifier on the bus"
                  value={form.busNumber}
                  onChange={v => setForm(p => ({ ...p, busNumber: v }))}
                  placeholder="e.g. BUS-001"
                  icon={Hash}
                  required
                />
                <Inp
                  label="Capacity"
                  hint="Maximum student seats"
                  value={form.capacity ?? 40}
                  onChange={v => setForm(p => ({ ...p, capacity: parseInt(v) || 40 }))}
                  placeholder="40"
                  type="number"
                  icon={UsersIcon}
                />
              </div>
            </div>

            {/* Driver details */}
            <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>Driver Details</p>
              <div className="grid grid-cols-2 gap-4">
                <Inp
                  label="Driver Name"
                  hint="Full name of the driver"
                  value={form.driverName}
                  onChange={v => setForm(p => ({ ...p, driverName: v }))}
                  placeholder="e.g. Ravi Kumar"
                  icon={User}
                  required
                />
                <Inp
                  label="Driver Phone"
                  hint="Contact number with country code"
                  value={form.driverPhone}
                  onChange={v => setForm(p => ({ ...p, driverPhone: v }))}
                  placeholder="+91 98765 43210"
                  icon={Phone}
                  required
                />
              </div>
            </div>

            {/* Route assignment */}
            <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>Route Assignment</p>
              <div>
                <label className="text-[13px] font-semibold block mb-1.5" style={{ color: HEAD }}>Assigned Route</label>
                <div className="relative">
                  <MapPin style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: MUTED }} />
                  <select
                    value={form.routeId ? String(form.routeId) : "none"}
                    onChange={e => setForm(p => ({ ...p, routeId: e.target.value === "none" ? null : Number(e.target.value) }))}
                    className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none appearance-none transition-all"
                    style={{ border: `1px solid ${BORDER}`, background: "#fff", color: HEAD }}
                    onFocus={e => (e.target.style.borderColor = ACCENT)}
                    onBlur={e => (e.target.style.borderColor = BORDER)}
                  >
                    <option value="none">No route assigned</option>
                    {routes.map(r => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ border: `1px solid ${BORDER}`, background: "#fff", color: MUTED }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                onClick={() => onSubmit(form)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity"
                style={{ background: ACCENT, opacity: isPending ? 0.7 : 1, border: "none" }}
              >
                <Save style={{ width: 14, height: 14 }} />
                {isPending ? "Saving…" : initial ? "Save changes" : "Add bus"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function Buses() {
  const qc = useQueryClient();
  const [view, setView] = useState<View>("list");
  const { data: buses = [], isLoading } = useListBuses();
  const { data: routes = [] } = useListRoutes();
  const create = useCreateBus();
  const update = useUpdateBus();
  const remove = useDeleteBus();
  const refresh = () => qc.invalidateQueries({ queryKey: getListBusesQueryKey() });
  const routeMap = Object.fromEntries(routes.map(r => [r.id, r.name]));

  if (view === "add") {
    return (
      <BusFullForm
        routes={routes}
        onSubmit={data => create.mutate({ data }, { onSuccess: () => { refresh(); setView("list"); } })}
        onCancel={() => setView("list")}
        isPending={create.isPending}
      />
    );
  }

  if (typeof view === "object" && "edit" in view) {
    return (
      <BusFullForm
        initial={view.edit}
        routes={routes}
        onSubmit={data => update.mutate({ id: view.edit.id, data }, { onSuccess: () => { refresh(); setView("list"); } })}
        onCancel={() => setView("list")}
        isPending={update.isPending}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold" style={{ color: HEAD }}>Buses</h1>
          <p className="text-[13px] mt-0.5 font-medium" style={{ color: MUTED }}>
            {buses.length > 0 ? `${buses.length} bus${buses.length !== 1 ? "es" : ""} · ${buses.filter(b => b.isActive).length} active` : "Manage fleet and driver assignments"}
          </p>
        </div>
        <button
          onClick={() => setView("add")}
          className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white"
          style={{ background: ACCENT, border: "none" }}
        >
          <Plus style={{ width: 15, height: 15 }} />
          Add bus
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-sm" style={{ border: `1px solid ${BORDER}`, color: MUTED }}>Loading…</div>
      ) : buses.length === 0 ? (
        <div className="bg-white rounded-2xl py-20 text-center" style={{ border: `1px solid ${BORDER}` }}>
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF3C7" }}>
            <Bus style={{ width: 28, height: 28, color: ACCENT }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: HEAD }}>No buses yet</p>
          <p className="text-xs mt-1 mb-5" style={{ color: MUTED }}>Add your first bus to start managing your fleet</p>
          <button
            onClick={() => setView("add")}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-bold text-white"
            style={{ background: ACCENT, border: "none" }}
          >
            <Plus style={{ width: 14, height: 14 }} /> Add bus
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {buses.map(b => (
            <div key={b.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}`, opacity: b.isActive ? 1 : 0.65 }}>
              {/* Card header */}
              <div className="h-24 relative flex items-center justify-center" style={{ background: "#1E3A5F" }}>
                <img
                  src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80"
                  alt="Bus"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: 0.2 }}
                />
                <div className="relative text-center">
                  <p className="text-3xl font-black text-white">Bus {b.busNumber}</p>
                </div>
                {b.isActive
                  ? <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#15803D" }}>Active</span>
                  : <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#F1F5F9", color: MUTED }}>Inactive</span>
                }
              </div>
              {/* Card body */}
              <div className="p-5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FEF3C7" }}>
                    <User style={{ width: 12, height: 12, color: ACCENT }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: HEAD }}>{b.driverName}</p>
                    <p className="text-xs" style={{ color: MUTED }}>{b.driverPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                  <MapPin style={{ width: 12, height: 12 }} />
                  {b.routeId ? routeMap[b.routeId] : <span style={{ color: "#CBD5E1" }}>No route assigned</span>}
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                  <UsersIcon style={{ width: 12, height: 12 }} />
                  {b.capacity ?? 40} seats capacity
                </div>
              </div>
              {/* Card footer */}
              <div className="px-5 pb-4 pt-2 flex items-center gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                <button
                  onClick={() => setView({ edit: b })}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-colors"
                  style={{ border: `1px solid ${BORDER}`, background: "#fff", color: MUTED }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  <Pencil style={{ width: 12, height: 12 }} /> Edit
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ border: `1px solid #FECDD3`, background: "#FFF1F2", color: "#EF4444" }}
                    >
                      <Trash2 style={{ width: 12, height: 12 }} />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Bus {b.busNumber}?</AlertDialogTitle>
                      <AlertDialogDescription>This will remove the bus and all associated data.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate({ id: b.id }, { onSuccess: refresh })} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

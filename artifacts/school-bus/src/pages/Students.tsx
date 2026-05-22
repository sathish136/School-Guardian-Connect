import { useState } from "react";
import {
  useListStudents, useCreateStudent, useUpdateStudent, useDeleteStudent,
  getListStudentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Pencil, Trash2, UserCheck, UserX, Fingerprint,
  Phone, User, GraduationCap, ArrowLeft, Save, Users,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import type { Student, StudentInput } from "@workspace/api-client-react";

const ACCENT = "#F59E0B";
const BORDER = "#E2E8F0";
const MUTED = "#64748B";
const HEAD = "#0F172A";

const PALETTE = [
  { bg: "#FEF3C7", fg: "#92400E" }, { bg: "#F0FDF4", fg: "#15803D" },
  { bg: "#EEF2FF", fg: "#4338CA" }, { bg: "#FDF2F8", fg: "#9D174D" },
  { bg: "#F0FDFA", fg: "#0F766E" }, { bg: "#FFF7ED", fg: "#C2410C" },
  { bg: "#FFF1F2", fg: "#BE123C" },
];
const palette = (id: number) => PALETTE[id % PALETTE.length];
const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

type View = "list" | "add" | { edit: Student };

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div>
        <label className="text-[13px] font-semibold" style={{ color: HEAD }}>{label}</label>
        {hint && <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type = "text", inputMode, pattern, required, mono }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string; required?: boolean; mono?: boolean;
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      pattern={pattern}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-10 px-3.5 rounded-xl text-sm outline-none transition-all"
      style={{
        border: `1px solid ${BORDER}`,
        background: "#fff",
        color: HEAD,
        fontFamily: mono ? "monospace" : undefined,
      }}
      onFocus={e => (e.target.style.borderColor = ACCENT)}
      onBlur={e => (e.target.style.borderColor = BORDER)}
    />
  );
}

function StudentFullForm({ initial, onSubmit, onCancel, isPending }: {
  initial?: Student; onSubmit: (d: StudentInput) => void; onCancel: () => void; isPending: boolean;
}) {
  const [form, setForm] = useState<StudentInput>({
    name: initial?.name ?? "", grade: initial?.grade ?? "",
    guardianName: initial?.guardianName ?? "", guardianPhone: initial?.guardianPhone ?? "",
    biometricId: initial?.biometricId ?? "", busId: initial?.busId ?? null, isActive: initial?.isActive ?? true,
  });
  const f = (key: keyof StudentInput) => (v: string) => setForm(p => ({ ...p, [key]: v }));

  return (
    <div className="space-y-6">
      {/* Back header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
            style={{ color: MUTED, background: "#fff", border: `1px solid ${BORDER}` }}
            onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Back to students
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: HEAD }}>
              {initial ? `Edit — ${initial.name}` : "Add New Student"}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>
              {initial ? "Update student information and settings" : "Fill in all fields to enroll a new student"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
        <div className="grid grid-cols-3 gap-6">
          {/* Left column — avatar + status */}
          <div className="col-span-1 space-y-4">
            {/* Avatar preview */}
            <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3" style={{ border: `1px solid ${BORDER}` }}>
              <div
                className="h-20 w-20 rounded-full flex items-center justify-center text-[28px] font-bold"
                style={form.name ? palette(initial?.id ?? 99) : { background: "#F1F5F9", color: MUTED }}
              >
                {form.name ? initials(form.name) : <Users style={{ width: 32, height: 32, color: MUTED }} />}
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm" style={{ color: HEAD }}>{form.name || "Student name"}</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>{form.grade || "Grade"}</p>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>Status</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: HEAD }}>{form.isActive ? "Active" : "Inactive"}</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>{form.isActive ? "Student can scan" : "Scans will be rejected"}</p>
                </div>
                <Switch checked={form.isActive ?? true} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
              </div>
            </div>

            {/* Biometric */}
            <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>Biometric</p>
              <FieldGroup label="Biometric ID" hint="Numeric enrollment ID from scanner device">
                <div className="relative">
                  <Fingerprint style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: ACCENT }} />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    placeholder="e.g. 100042"
                    value={form.biometricId}
                    onChange={e => {
                      const v = e.target.value.replace(/[^0-9]/g, "");
                      setForm(p => ({ ...p, biometricId: v }));
                    }}
                    className="w-full h-10 pl-9 pr-3 rounded-xl text-sm font-mono outline-none transition-all"
                    style={{ border: `1px solid ${BORDER}`, background: "#fff", color: HEAD }}
                    onFocus={e => (e.target.style.borderColor = ACCENT)}
                    onBlur={e => (e.target.style.borderColor = BORDER)}
                  />
                </div>
              </FieldGroup>
            </div>
          </div>

          {/* Right columns — main form */}
          <div className="col-span-2 space-y-4">
            {/* Student info */}
            <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>Student Information</p>
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="Full Name" hint="As registered in school records">
                  <Inp value={form.name} onChange={f("name")} placeholder="e.g. Arjun Sharma" required />
                </FieldGroup>
                <FieldGroup label="Grade / Class" hint="Current class or grade level">
                  <Inp value={form.grade} onChange={f("grade")} placeholder="e.g. Grade 5A" required />
                </FieldGroup>
              </div>
            </div>

            {/* Guardian info */}
            <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>Guardian Information</p>
              <p className="text-xs -mt-2" style={{ color: MUTED }}>SMS/WhatsApp notifications will be sent to this contact when the student boards or alights.</p>
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="Guardian Name">
                  <div className="relative">
                    <User style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: MUTED }} />
                    <input
                      type="text"
                      required
                      placeholder="Parent / guardian name"
                      value={form.guardianName}
                      onChange={e => setForm(p => ({ ...p, guardianName: e.target.value }))}
                      className="w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none transition-all"
                      style={{ border: `1px solid ${BORDER}`, background: "#fff", color: HEAD }}
                      onFocus={e => (e.target.style.borderColor = ACCENT)}
                      onBlur={e => (e.target.style.borderColor = BORDER)}
                    />
                  </div>
                </FieldGroup>
                <FieldGroup label="Guardian Phone" hint="Include country code, e.g. +91">
                  <div className="relative">
                    <Phone style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: MUTED }} />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={form.guardianPhone}
                      onChange={e => setForm(p => ({ ...p, guardianPhone: e.target.value }))}
                      className="w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none transition-all"
                      style={{ border: `1px solid ${BORDER}`, background: "#fff", color: HEAD }}
                      onFocus={e => (e.target.style.borderColor = ACCENT)}
                      onBlur={e => (e.target.style.borderColor = BORDER)}
                    />
                  </div>
                </FieldGroup>
              </div>
            </div>

            {/* Save button */}
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
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity"
                style={{ background: ACCENT, opacity: isPending ? 0.7 : 1, border: "none" }}
              >
                <Save style={{ width: 14, height: 14 }} />
                {isPending ? "Saving…" : initial ? "Save changes" : "Add student"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function Students() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("list");

  const { data: students = [], isLoading } = useListStudents({ search: search || undefined });
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const remove = useDeleteStudent();
  const refresh = () => qc.invalidateQueries({ queryKey: getListStudentsQueryKey() });

  if (view === "add") {
    return (
      <StudentFullForm
        onSubmit={d => create.mutate({ data: d }, { onSuccess: () => { refresh(); setView("list"); } })}
        onCancel={() => setView("list")}
        isPending={create.isPending}
      />
    );
  }

  if (typeof view === "object" && "edit" in view) {
    return (
      <StudentFullForm
        initial={view.edit}
        onSubmit={d => update.mutate({ id: view.edit.id, data: d }, { onSuccess: () => { refresh(); setView("list"); } })}
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
          <h1 className="text-[24px] font-bold" style={{ color: HEAD }}>Students</h1>
          <p className="text-[13px] mt-0.5 font-medium" style={{ color: MUTED }}>
            {students.length > 0
              ? `${students.filter(s => s.isActive).length} active · ${students.filter(s => !s.isActive).length} inactive`
              : "Manage enrolled students"}
          </p>
        </div>
        <button
          onClick={() => setView("add")}
          className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white transition-opacity"
          style={{ background: ACCENT, border: "none" }}
        >
          <Plus style={{ width: 15, height: 15 }} />
          Add student
        </button>
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: MUTED }} />
        <input
          className="w-full h-10 pl-10 pr-4 rounded-xl text-sm outline-none transition-all"
          style={{ border: `1px solid ${BORDER}`, background: "#fff", color: HEAD }}
          placeholder="Search students…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => (e.target.style.borderColor = ACCENT)}
          onBlur={e => (e.target.style.borderColor = BORDER)}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-sm" style={{ border: `1px solid ${BORDER}`, color: MUTED }}>Loading…</div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl py-20 text-center" style={{ border: `1px solid ${BORDER}` }}>
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF3C7" }}>
            <Users style={{ width: 28, height: 28, color: ACCENT }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: HEAD }}>No students yet</p>
          <p className="text-xs mt-1 mb-5" style={{ color: MUTED }}>Add your first student to start tracking attendance</p>
          <button
            onClick={() => setView("add")}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-bold text-white"
            style={{ background: ACCENT, border: "none" }}
          >
            <Plus style={{ width: 14, height: 14 }} /> Add student
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
                {["Student", "Guardian", "Biometric ID", "Status", ""].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const { bg, fg } = palette(s.id);
                return (
                  <tr key={s.id} style={{ borderBottom: i < students.length - 1 ? `1px solid #F1F5F9` : "none" }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: bg, color: fg }}>
                          {initials(s.name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: HEAD }}>{s.name}</p>
                          <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: MUTED }}>
                            <GraduationCap style={{ width: 11, height: 11 }} />{s.grade}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm" style={{ color: HEAD }}>{s.guardianName}</p>
                      <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: MUTED }}>
                        <Phone style={{ width: 11, height: 11 }} />{s.guardianPhone}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs font-mono px-2.5 py-1 rounded-lg" style={{ background: "#FEF3C7", color: "#92400E" }}>
                        {s.biometricId}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      {s.isActive
                        ? <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#DCFCE7", color: "#15803D" }}>
                            <UserCheck style={{ width: 11, height: 11 }} />Active
                          </span>
                        : <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#F1F5F9", color: MUTED }}>
                            <UserX style={{ width: 11, height: 11 }} />Inactive
                          </span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setView({ edit: s })}
                          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors"
                          style={{ border: `1px solid ${BORDER}`, background: "#fff", color: MUTED }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                          onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                        >
                          <Pencil style={{ width: 12, height: 12 }} /> Edit
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors" style={{ border: `1px solid #FECDD3`, background: "#FFF1F2", color: "#EF4444" }}>
                              <Trash2 style={{ width: 12, height: 12 }} />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {s.name}?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete this student record.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove.mutate({ id: s.id }, { onSuccess: refresh })} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

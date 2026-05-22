import { useState } from "react";
import {
  useListStudents, useCreateStudent, useUpdateStudent, useDeleteStudent,
  getListStudentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, UserCheck, UserX, Fingerprint, Phone, User, GraduationCap, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
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

/* ─── Form ─── */
function StudentForm({ initial, onSubmit, onClose, isPending }: {
  initial?: Student; onSubmit: (d: StudentInput) => void; onClose: () => void; isPending: boolean;
}) {
  const [form, setForm] = useState<StudentInput>({
    name: initial?.name ?? "", grade: initial?.grade ?? "",
    guardianName: initial?.guardianName ?? "", guardianPhone: initial?.guardianPhone ?? "",
    biometricId: initial?.biometricId ?? "", busId: initial?.busId ?? null, isActive: initial?.isActive ?? true,
  });
  const f = (key: keyof StudentInput) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-5 pt-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium" style={{ color: MUTED }}>Full name</Label>
          <Input className="h-9 text-sm rounded-md" style={{ borderColor: BORDER }} placeholder="John Doe" value={form.name} onChange={f("name")} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium" style={{ color: MUTED }}>Grade / class</Label>
          <Input className="h-9 text-sm rounded-md" style={{ borderColor: BORDER }} placeholder="Grade 5A" value={form.grade} onChange={f("grade")} required />
        </div>
      </div>
      <div className="pt-1" style={{ borderTop: `1px solid ${BORDER}` }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: MUTED }}>Guardian</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium" style={{ color: MUTED }}>Name</Label>
            <Input className="h-9 text-sm rounded-md" style={{ borderColor: BORDER }} placeholder="Guardian name" value={form.guardianName} onChange={f("guardianName")} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium" style={{ color: MUTED }}>Phone</Label>
            <Input className="h-9 text-sm rounded-md" style={{ borderColor: BORDER }} placeholder="+1 555 000 0000" value={form.guardianPhone} onChange={f("guardianPhone")} required />
          </div>
        </div>
      </div>
      <div className="pt-1" style={{ borderTop: `1px solid ${BORDER}` }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: MUTED }}>Biometric</p>
        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium" style={{ color: MUTED }}>Biometric ID</Label>
          <Input className="h-9 text-sm rounded-md font-mono" style={{ borderColor: BORDER }} placeholder="Device enrollment ID" value={form.biometricId} onChange={f("biometricId")} required />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          <Switch id="active" checked={form.isActive ?? true} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
          <Label htmlFor="active" className="text-[13px]" style={{ color: "#52525B" }}>Active</Label>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-md h-8 text-[13px]" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" disabled={isPending} className="rounded-md h-8 text-[13px] text-white border-0"
            style={{ background: ACCENT }}>
            {isPending ? "Saving…" : initial ? "Save changes" : "Add student"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ─── Row ─── */
function Row({ s, onEdit, onDelete, isDeleting }: { s: Student; onEdit: () => void; onDelete: () => void; isDeleting: boolean }) {
  const { bg, fg } = palette(s.id);
  return (
    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: bg, color: fg }}>{initials(s.name)}</div>
          <div>
            <p className="text-[13px] font-medium" style={{ color: HEAD }}>{s.name}</p>
            <p className="text-[12px] flex items-center gap-1" style={{ color: MUTED }}><GraduationCap style={{ width: 11, height: 11 }} />{s.grade}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <p className="text-[13px]" style={{ color: "#3F3F46" }}>{s.guardianName}</p>
        <p className="text-[12px] flex items-center gap-1" style={{ color: MUTED }}><Phone style={{ width: 11, height: 11 }} />{s.guardianPhone}</p>
      </td>
      <td className="px-5 py-3">
        <code className="text-[12px] font-mono px-2 py-0.5 rounded" style={{ background: "#F4F4F5", color: "#52525B" }}>{s.biometricId}</code>
      </td>
      <td className="px-5 py-3">
        {s.isActive
          ? <span className="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded" style={{ background: "#F0FDF4", color: "#15803D" }}><UserCheck style={{ width: 11, height: 11 }} />Active</span>
          : <span className="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded" style={{ background: "#F4F4F5", color: MUTED }}><UserX style={{ width: 11, height: 11 }} />Inactive</span>
        }
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          <button onClick={onEdit} className="h-7 w-7 rounded flex items-center justify-center hover:bg-gray-100 transition-colors" style={{ color: MUTED }}>
            <Pencil style={{ width: 13, height: 13 }} />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button disabled={isDeleting} className="h-7 w-7 rounded flex items-center justify-center hover:bg-red-50 transition-colors" style={{ color: "#EF4444" }}>
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Remove {s.name}?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this student record.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
}

/* ─── Card ─── */
function Card({ s, onEdit, onDelete, isDeleting }: { s: Student; onEdit: () => void; onDelete: () => void; isDeleting: boolean }) {
  const { bg, fg } = palette(s.id);
  return (
    <div className="bg-white rounded-lg p-4 hover:shadow-sm transition-shadow" style={{ border: `1px solid ${BORDER}`, opacity: s.isActive ? 1 : 0.6 }}>
      <div className="flex items-start gap-3 mb-3">
        <div className="h-9 w-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: bg, color: fg }}>{initials(s.name)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold truncate" style={{ color: HEAD }}>{s.name}</p>
          <p className="text-[12px]" style={{ color: MUTED }}>{s.grade}</p>
        </div>
        {s.isActive
          ? <span className="text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ background: "#F0FDF4", color: "#15803D" }}>Active</span>
          : <span className="text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ background: "#F4F4F5", color: MUTED }}>Inactive</span>
        }
      </div>
      <div className="space-y-1.5 text-[12px] mb-3" style={{ color: MUTED }}>
        <div className="flex items-center gap-1.5"><User style={{ width: 11, height: 11, flexShrink: 0 }} />{s.guardianName}</div>
        <div className="flex items-center gap-1.5"><Phone style={{ width: 11, height: 11, flexShrink: 0 }} />{s.guardianPhone}</div>
        <div className="flex items-center gap-1.5"><Fingerprint style={{ width: 11, height: 11, flexShrink: 0, color: ACCENT }} /><code style={{ background: "#F4F4F5", color: "#52525B" }} className="px-1.5 py-0.5 rounded font-mono text-[11px]">{s.biometricId}</code></div>
      </div>
      <div className="flex gap-1.5 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button onClick={onEdit} className="flex-1 h-7 text-[12px] font-medium rounded flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors" style={{ border: `1px solid ${BORDER}`, color: "#52525B" }}>
          <Pencil style={{ width: 11, height: 11 }} /> Edit
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button disabled={isDeleting} className="h-7 px-2 rounded hover:bg-red-50 transition-colors" style={{ border: `1px solid ${BORDER}`, color: "#EF4444" }}>
              <Trash2 style={{ width: 13, height: 13 }} />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Remove {s.name}?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this student.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function Students() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { data: students = [], isLoading } = useListStudents({ search: search || undefined });
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const remove = useDeleteStudent();
  const refresh = () => qc.invalidateQueries({ queryKey: getListStudentsQueryKey() });

  const editStudent = students.find(s => s.id === editId) ?? null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold" style={{ color: HEAD }}>Students</h1>
          <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
            {students.length > 0 ? `${students.filter(s => s.isActive).length} active · ${students.filter(s => !s.isActive).length} inactive` : "Manage enrolled students"}
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-[13px] rounded-md text-white border-0 gap-1.5" style={{ background: ACCENT }}>
              <Plus style={{ width: 14, height: 14 }} /> Add student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New student</DialogTitle></DialogHeader>
            <StudentForm onSubmit={d => create.mutate({ data: d }, { onSuccess: () => { refresh(); setAddOpen(false); } })} onClose={() => setAddOpen(false)} isPending={create.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: MUTED }} />
          <Input
            className="pl-8 h-8 text-[13px] rounded-md w-56"
            style={{ borderColor: BORDER }}
            placeholder="Search students…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${BORDER}`, background: "#fff" }}>
          {(["list", "grid"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="h-8 w-8 flex items-center justify-center transition-colors"
              style={view === v ? { background: ACCENT, color: "#fff" } : { color: MUTED }}
            >
              {v === "list" ? <List style={{ width: 14, height: 14 }} /> : <LayoutGrid style={{ width: 14, height: 14 }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg p-8 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: MUTED }}>Loading…</div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-lg py-16 text-center" style={{ border: `1px solid ${BORDER}` }}>
          <p className="text-[13px] font-medium" style={{ color: "#52525B" }}>No students yet</p>
          <p className="text-[12px] mt-1 mb-4" style={{ color: MUTED }}>Add your first student to start tracking</p>
          <Button size="sm" onClick={() => setAddOpen(true)} className="h-8 text-[13px] rounded-md text-white border-0" style={{ background: ACCENT }}>
            <Plus style={{ width: 13, height: 13, marginRight: 4 }} /> Add student
          </Button>
        </div>
      ) : view === "list" ? (
        <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, background: "#FAFAFA" }}>
                {["Student", "Guardian", "Biometric ID", "Status", ""].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <Dialog key={s.id} open={editId === s.id} onOpenChange={open => setEditId(open ? s.id : null)}>
                  <Row s={s} onEdit={() => setEditId(s.id)} onDelete={() => remove.mutate({ id: s.id }, { onSuccess: refresh })} isDeleting={remove.isPending} />
                  <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Edit student</DialogTitle></DialogHeader>
                    {editStudent && <StudentForm initial={editStudent} onSubmit={d => update.mutate({ id: editStudent.id, data: d }, { onSuccess: () => { refresh(); setEditId(null); } })} onClose={() => setEditId(null)} isPending={update.isPending} />}
                  </DialogContent>
                </Dialog>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {students.map(s => (
            <Dialog key={s.id} open={editId === s.id} onOpenChange={open => setEditId(open ? s.id : null)}>
              <Card s={s} onEdit={() => setEditId(s.id)} onDelete={() => remove.mutate({ id: s.id }, { onSuccess: refresh })} isDeleting={remove.isPending} />
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Edit student</DialogTitle></DialogHeader>
                {editStudent && <StudentForm initial={editStudent} onSubmit={d => update.mutate({ id: editStudent.id, data: d }, { onSuccess: () => { refresh(); setEditId(null); } })} onClose={() => setEditId(null)} isPending={update.isPending} />}
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}

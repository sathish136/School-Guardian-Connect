import { useState } from "react";
import {
  useListStudents, useCreateStudent, useUpdateStudent, useDeleteStudent,
  getListStudentsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Pencil, Trash2, UserCheck, UserX, Fingerprint,
  Phone, User, GraduationCap, LayoutGrid, List, BookOpen
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Student, StudentInput } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const teal = "#0d9488";

const AVATAR_PALETTE = [
  { bg: "#f0fdfa", fg: "#0f766e" },
  { bg: "#eff6ff", fg: "#1d4ed8" },
  { bg: "#faf5ff", fg: "#7c3aed" },
  { bg: "#fff7ed", fg: "#c2410c" },
  { bg: "#f0fdf4", fg: "#15803d" },
  { bg: "#fef3c7", fg: "#b45309" },
  { bg: "#fff1f2", fg: "#be123c" },
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function getPalette(id: number) {
  return AVATAR_PALETTE[id % AVATAR_PALETTE.length];
}

/* ─── Form ─────────────────────────────────────────────────────────────────── */
function StudentForm({ initial, onSubmit, onClose, isPending }: {
  initial?: Student; onSubmit: (data: StudentInput) => void;
  onClose: () => void; isPending: boolean;
}) {
  const [form, setForm] = useState<StudentInput>({
    name: initial?.name ?? "", grade: initial?.grade ?? "",
    guardianName: initial?.guardianName ?? "", guardianPhone: initial?.guardianPhone ?? "",
    biometricId: initial?.biometricId ?? "", busId: initial?.busId ?? null,
    isActive: initial?.isActive ?? true,
  });

  const field = (id: keyof StudentInput, label: string, icon: React.ReactNode, extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <Input id={id} className="pl-9 h-10 text-sm rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-400"
          value={(form[id] as string) ?? ""} onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))} {...extra} />
      </div>
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {field("name", "Full Name", <User className="h-4 w-4" />, { placeholder: "e.g. John Doe", required: true })}
        {field("grade", "Grade / Class", <GraduationCap className="h-4 w-4" />, { placeholder: "e.g. Grade 5A", required: true })}
      </div>
      <div className="border-t pt-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Guardian</p>
        <div className="grid grid-cols-2 gap-4">
          {field("guardianName", "Name", <User className="h-4 w-4" />, { placeholder: "Guardian name", required: true })}
          {field("guardianPhone", "Phone", <Phone className="h-4 w-4" />, { placeholder: "+1 555 000 0000", required: true })}
        </div>
      </div>
      <div className="border-t pt-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Biometric</p>
        {field("biometricId", "Biometric ID", <Fingerprint className="h-4 w-4" />, { placeholder: "Device enrollment ID", required: true, className: "pl-9 h-10 font-mono text-sm rounded-xl border-slate-200" })}
      </div>
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2.5">
          <Switch id="isActive" checked={form.isActive ?? true} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
          <Label htmlFor="isActive" className="text-sm text-slate-600">{form.isActive ? "Active" : "Inactive"}</Label>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" disabled={isPending} className="rounded-xl text-white"
            style={{ background: teal }}>
            {isPending ? "Saving..." : initial ? "Save Changes" : "Add Student"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ─── Card ──────────────────────────────────────────────────────────────────── */
function StudentCard({ student, onEdit, onDelete, isDeleting }: {
  student: Student; onEdit: () => void; onDelete: (id: number) => void; isDeleting: boolean;
}) {
  const { bg, fg } = getPalette(student.id);
  return (
    <Card className={cn("border border-slate-100 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white", !student.isActive && "opacity-60")}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: bg, color: fg }}>
            {getInitials(student.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{student.name}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><GraduationCap className="h-3 w-3" />{student.grade}</p>
          </div>
          {student.isActive
            ? <Badge className="border-0 text-[10px] px-1.5 shrink-0" style={{ background: "#f0fdfa", color: "#0f766e" }}><UserCheck className="h-2.5 w-2.5 mr-0.5" />Active</Badge>
            : <Badge variant="outline" className="text-slate-400 text-[10px] px-1.5 shrink-0"><UserX className="h-2.5 w-2.5 mr-0.5" />Inactive</Badge>
          }
        </div>
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500"><User className="h-3 w-3 text-slate-300 shrink-0" />{student.guardianName}</div>
          <div className="flex items-center gap-2 text-xs text-slate-500"><Phone className="h-3 w-3 text-slate-300 shrink-0" />{student.guardianPhone}</div>
          <div className="flex items-center gap-2 text-xs">
            <Fingerprint className="h-3 w-3 shrink-0" style={{ color: teal }} />
            <code className="font-mono text-[10px] px-1.5 py-0.5 rounded-md tracking-wider" style={{ background: "#f0fdfa", color: "#0f766e" }}>{student.biometricId}</code>
          </div>
        </div>
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 h-7 text-xs rounded-lg"><Pencil className="h-3 w-3 mr-1" />Edit</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDeleting} className="h-7 px-2 text-red-400 hover:text-red-600 hover:border-red-200 rounded-lg"><Trash2 className="h-3 w-3" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Remove {student.name}?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this student.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(student.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Row ───────────────────────────────────────────────────────────────────── */
function StudentRow({ student, onEdit, onDelete, isDeleting }: {
  student: Student; onEdit: () => void; onDelete: (id: number) => void; isDeleting: boolean;
}) {
  const { bg, fg } = getPalette(student.id);
  return (
    <tr className={cn("hover:bg-slate-50/80 transition-colors border-b border-slate-100", !student.isActive && "opacity-60")}>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0" style={{ background: bg, color: fg }}>{getInitials(student.name)}</div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{student.name}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1"><GraduationCap className="h-2.5 w-2.5" />{student.grade}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <p className="text-sm text-slate-700">{student.guardianName}</p>
        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="h-2.5 w-2.5" />{student.guardianPhone}</p>
      </td>
      <td className="px-5 py-3">
        <code className="font-mono text-xs px-2 py-1 rounded-lg tracking-wider" style={{ background: "#f0fdfa", color: "#0f766e" }}>{student.biometricId}</code>
      </td>
      <td className="px-5 py-3">
        {student.isActive
          ? <Badge className="border-0 text-xs" style={{ background: "#f0fdfa", color: "#0f766e" }}><UserCheck className="h-2.5 w-2.5 mr-1" />Active</Badge>
          : <Badge variant="outline" className="text-slate-400 text-xs"><UserX className="h-2.5 w-2.5 mr-1" />Inactive</Badge>
        }
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 px-2 text-slate-400 hover:text-slate-700"><Pencil className="h-3.5 w-3.5" /></Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isDeleting} className="h-7 px-2 text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Remove {student.name}?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this student.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(student.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function Students() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  const { data: students = [], isLoading } = useListStudents({ search: search || undefined });
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const remove = useDeleteStudent();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });

  const handleCreate = (data: StudentInput) => create.mutate({ data }, { onSuccess: () => { invalidate(); setDialogOpen(false); } });
  const handleUpdate = (data: StudentInput) => {
    if (!editStudent) return;
    update.mutate({ id: editStudent.id, data }, { onSuccess: () => { invalidate(); setEditStudent(null); } });
  };
  const handleDelete = (id: number) => remove.mutate({ id }, { onSuccess: invalidate });

  const active = students.filter(s => s.isActive);
  const inactive = students.filter(s => !s.isActive);

  const editDialog = (s: Student) => (
    <DialogContent className="max-w-xl">
      <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
      <StudentForm initial={s} onSubmit={handleUpdate} onClose={() => setEditStudent(null)} isPending={update.isPending} />
    </DialogContent>
  );

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {students.length > 0 ? `${active.length} active · ${inactive.length} inactive` : "Manage enrolled students"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-1.5 text-white shadow-sm" style={{ background: teal }}>
              <Plus className="h-4 w-4" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>New Student</DialogTitle></DialogHeader>
            <StudentForm onSubmit={handleCreate} onClose={() => setDialogOpen(false)} isPending={create.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input className="pl-9 h-9 text-sm rounded-xl border-slate-200" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}
            className={cn("h-7 w-7 p-0 rounded-lg", view === "list" && "shadow-sm text-white")}
            style={view === "list" ? { background: teal } : {}}>
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setView("grid")}
            className={cn("h-7 w-7 p-0 rounded-lg", view === "grid" && "shadow-sm text-white")}
            style={view === "grid" ? { background: teal } : {}}>
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 text-sm">Loading students…</div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><BookOpen className="h-6 w-6 text-slate-300" /></div>
          <p className="font-semibold text-slate-700">No students yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-5">Add your first student to start tracking</p>
          <Button size="sm" onClick={() => setDialogOpen(true)} className="rounded-xl text-white" style={{ background: teal }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add First Student
          </Button>
        </div>
      ) : view === "list" ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100" style={{ background: "#f8fafc" }}>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Student</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Guardian</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Biometric ID</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <Dialog key={s.id} open={editStudent?.id === s.id} onOpenChange={open => setEditStudent(open ? s : null)}>
                  <StudentRow student={s} onEdit={() => setEditStudent(s)} onDelete={handleDelete} isDeleting={remove.isPending} />
                  {editDialog(s)}
                </Dialog>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-5">
          {active.length > 0 && (
            <div>
              {inactive.length > 0 && <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Active ({active.length})</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {active.map(s => (
                  <Dialog key={s.id} open={editStudent?.id === s.id} onOpenChange={open => setEditStudent(open ? s : null)}>
                    <StudentCard student={s} onEdit={() => setEditStudent(s)} onDelete={handleDelete} isDeleting={remove.isPending} />
                    {editDialog(s)}
                  </Dialog>
                ))}
              </div>
            </div>
          )}
          {inactive.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Inactive ({inactive.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {inactive.map(s => (
                  <Dialog key={s.id} open={editStudent?.id === s.id} onOpenChange={open => setEditStudent(open ? s : null)}>
                    <StudentCard student={s} onEdit={() => setEditStudent(s)} onDelete={handleDelete} isDeleting={remove.isPending} />
                    {editDialog(s)}
                  </Dialog>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

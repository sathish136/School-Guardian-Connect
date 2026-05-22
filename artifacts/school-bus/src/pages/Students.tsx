import { useState } from "react";
import {
  useListStudents, useCreateStudent, useUpdateStudent, useDeleteStudent,
  getListStudentsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Pencil, Trash2, UserCheck, UserX, Fingerprint,
  Phone, User, BookOpen, GraduationCap, Bus
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

function StudentForm({
  initial, onSubmit, onClose, isPending
}: {
  initial?: Student;
  onSubmit: (data: StudentInput) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<StudentInput>({
    name: initial?.name ?? "",
    grade: initial?.grade ?? "",
    guardianName: initial?.guardianName ?? "",
    guardianPhone: initial?.guardianPhone ?? "",
    biometricId: initial?.biometricId ?? "",
    busId: initial?.busId ?? null,
    isActive: initial?.isActive ?? true,
  });

  const field = (
    id: keyof StudentInput,
    label: string,
    icon: React.ReactNode,
    extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <Input
          id={id}
          className="pl-9 h-10"
          value={form[id] as string ?? ""}
          onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))}
          {...extra}
        />
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
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Guardian Information</p>
        <div className="grid grid-cols-2 gap-4">
          {field("guardianName", "Guardian Name", <User className="h-4 w-4" />, { placeholder: "e.g. Jane Doe", required: true })}
          {field("guardianPhone", "Guardian Phone", <Phone className="h-4 w-4" />, { placeholder: "+1 555 000 0000", required: true })}
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Biometric & Transport</p>
        <div className="grid grid-cols-2 gap-4">
          {field("biometricId", "Biometric ID", <Fingerprint className="h-4 w-4" />, { placeholder: "Device enrollment ID", required: true, className: "pl-9 h-10 font-mono" })}
          <div className="space-y-1.5">
            <Label htmlFor="busId" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Bus Number (optional)
            </Label>
            <div className="relative">
              <Bus className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="busId"
                className="pl-9 h-10"
                placeholder="e.g. BUS-01"
                value={form.busId ?? ""}
                onChange={e => setForm(p => ({ ...p, busId: e.target.value ? Number(e.target.value) : null }))}
                type="number"
                min={1}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-3">
          <Switch
            id="isActive"
            checked={form.isActive ?? true}
            onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))}
          />
          <Label htmlFor="isActive" className="text-sm text-slate-700">
            {form.isActive ? "Active — will receive SMS notifications" : "Inactive — SMS notifications paused"}
          </Label>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending} className="bg-slate-900 hover:bg-slate-800">
            {isPending ? "Saving..." : initial ? "Save Changes" : "Add Student"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function StudentCard({
  student, onEdit, onDelete, isDeleting
}: {
  student: Student;
  onEdit: () => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}) {
  const initials = student.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = [
    "bg-violet-100 text-violet-700",
    "bg-blue-100 text-blue-700",
    "bg-amber-100 text-amber-700",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
  ];
  const color = colors[student.id % colors.length];

  return (
    <Card className={`group hover:shadow-md transition-all duration-200 border ${student.isActive ? "border-slate-200" : "border-slate-100 opacity-70"}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center font-bold text-sm shrink-0`}>
              {initials}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm leading-tight">{student.name}</p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {student.grade}
              </p>
            </div>
          </div>
          {student.isActive
            ? <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs shrink-0"><UserCheck className="h-3 w-3 mr-1" />Active</Badge>
            : <Badge variant="outline" className="text-slate-400 text-xs shrink-0"><UserX className="h-3 w-3 mr-1" />Inactive</Badge>
          }
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{student.guardianName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="font-medium">{student.guardianPhone}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Fingerprint className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 tracking-wider">
              {student.biometricId}
            </span>
          </div>
          {student.busId && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Bus className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>Bus #{student.busId}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1 h-8 text-xs"
          >
            <Pencil className="h-3 w-3 mr-1.5" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-red-500 hover:text-red-700 hover:border-red-300 hover:bg-red-50"
                disabled={isDeleting}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {student.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this student and all associated scan records. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(student.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Students() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  const { data: students = [], isLoading } = useListStudents({ search: search || undefined });
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const remove = useDeleteStudent();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });

  const handleCreate = (data: StudentInput) => {
    create.mutate({ data }, {
      onSuccess: () => { invalidate(); setDialogOpen(false); }
    });
  };

  const handleUpdate = (data: StudentInput) => {
    if (!editStudent) return;
    update.mutate({ id: editStudent.id, data }, {
      onSuccess: () => { invalidate(); setEditStudent(null); }
    });
  };

  const handleDelete = (id: number) => {
    remove.mutate({ id }, { onSuccess: invalidate });
  };

  const active = students.filter(s => s.isActive);
  const inactive = students.filter(s => !s.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Students</h1>
          <p className="text-sm text-slate-500 mt-1">
            {students.length > 0
              ? `${active.length} active · ${inactive.length} inactive · ${students.length} total`
              : "Manage enrolled students and guardian contacts"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="h-4 w-4 mr-2" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg">Add New Student</DialogTitle>
            </DialogHeader>
            <StudentForm onSubmit={handleCreate} onClose={() => setDialogOpen(false)} isPending={create.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          className="pl-9 h-10"
          placeholder="Search by name, grade, or guardian..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 h-44 bg-slate-50" />
            </Card>
          ))}
        </div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">No students yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-5">Add your first student to get started with biometric tracking</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-slate-900 hover:bg-slate-800">
              <Plus className="h-4 w-4 mr-2" /> Add First Student
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              {inactive.length > 0 && (
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Active ({active.length})
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {active.map(s => (
                  <Dialog key={s.id} open={editStudent?.id === s.id} onOpenChange={open => setEditStudent(open ? s : null)}>
                    <StudentCard
                      student={s}
                      onEdit={() => setEditStudent(s)}
                      onDelete={handleDelete}
                      isDeleting={remove.isPending}
                    />
                    <DialogContent className="max-w-2xl">
                      <DialogHeader><DialogTitle className="text-lg">Edit Student</DialogTitle></DialogHeader>
                      <StudentForm initial={s} onSubmit={handleUpdate} onClose={() => setEditStudent(null)} isPending={update.isPending} />
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          )}
          {inactive.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Inactive ({inactive.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {inactive.map(s => (
                  <Dialog key={s.id} open={editStudent?.id === s.id} onOpenChange={open => setEditStudent(open ? s : null)}>
                    <StudentCard
                      student={s}
                      onEdit={() => setEditStudent(s)}
                      onDelete={handleDelete}
                      isDeleting={remove.isPending}
                    />
                    <DialogContent className="max-w-2xl">
                      <DialogHeader><DialogTitle className="text-lg">Edit Student</DialogTitle></DialogHeader>
                      <StudentForm initial={s} onSubmit={handleUpdate} onClose={() => setEditStudent(null)} isPending={update.isPending} />
                    </DialogContent>
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

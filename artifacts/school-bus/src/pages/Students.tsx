import { useState } from "react";
import {
  useListStudents, useCreateStudent, useUpdateStudent, useDeleteStudent,
  useListBuses, getListStudentsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Student, StudentInput } from "@workspace/api-client-react";

function StudentForm({
  initial, buses, onSubmit, onClose, isPending
}: {
  initial?: Student;
  buses: { id: number; busNumber: string }[];
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

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" data-testid="input-student-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="grade">Grade</Label>
          <Input id="grade" data-testid="input-student-grade" value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guardianName">Guardian Name</Label>
          <Input id="guardianName" data-testid="input-guardian-name" value={form.guardianName} onChange={e => setForm(p => ({ ...p, guardianName: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guardianPhone">Guardian Phone</Label>
          <Input id="guardianPhone" data-testid="input-guardian-phone" value={form.guardianPhone} onChange={e => setForm(p => ({ ...p, guardianPhone: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="biometricId">Biometric ID</Label>
          <Input id="biometricId" data-testid="input-biometric-id" value={form.biometricId} onChange={e => setForm(p => ({ ...p, biometricId: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bus">Assigned Bus</Label>
          <Select value={form.busId ? String(form.busId) : "none"} onValueChange={v => setForm(p => ({ ...p, busId: v === "none" ? null : Number(v) }))}>
            <SelectTrigger data-testid="select-bus">
              <SelectValue placeholder="No bus assigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No bus assigned</SelectItem>
              {buses.map(b => <SelectItem key={b.id} value={String(b.id)}>Bus {b.busNumber}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isPending} data-testid="button-save-student">
          {isPending ? "Saving..." : initial ? "Update Student" : "Add Student"}
        </Button>
      </div>
    </form>
  );
}

export default function Students() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  const { data: students = [], isLoading } = useListStudents({ search: search || undefined });
  const { data: buses = [] } = useListBuses();
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

  const busMap = Object.fromEntries(buses.map(b => [b.id, b.busNumber]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight" data-testid="page-title">Students</h1>
          <p className="text-sm text-slate-500 mt-1">Manage enrolled students and guardian contacts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-student" className="bg-slate-900 hover:bg-slate-800">
              <Plus className="h-4 w-4 mr-2" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <StudentForm buses={buses} onSubmit={handleCreate} onClose={() => setDialogOpen(false)} isPending={create.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          data-testid="input-search-students"
          className="pl-9 max-w-sm"
          placeholder="Search students..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500" data-testid="students-loading">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <UserCheck className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="font-medium">No students found</p>
              <p className="text-sm mt-1">Add a student to get started</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Student</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Grade</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Guardian</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Guardian Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Biometric ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Bus</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors" data-testid={`row-student-${s.id}`}>
                    <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600">{s.grade}</td>
                    <td className="px-4 py-3 text-slate-600">{s.guardianName}</td>
                    <td className="px-4 py-3 text-slate-600">{s.guardianPhone}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 bg-slate-50">{s.biometricId}</td>
                    <td className="px-4 py-3 text-slate-600">{s.busId ? `Bus ${busMap[s.busId]}` : <span className="text-slate-400">Unassigned</span>}</td>
                    <td className="px-4 py-3">
                      {s.isActive
                        ? <Badge className="bg-emerald-100 text-emerald-700 border-0"><UserCheck className="h-3 w-3 mr-1" />Active</Badge>
                        : <Badge variant="outline" className="text-slate-500"><UserX className="h-3 w-3 mr-1" />Inactive</Badge>
                      }
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2 justify-end">
                      <Dialog open={editStudent?.id === s.id} onOpenChange={open => setEditStudent(open ? s : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`button-edit-student-${s.id}`}><Pencil className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
                          <StudentForm initial={s} buses={buses} onSubmit={handleUpdate} onClose={() => setEditStudent(null)} isPending={update.isPending} />
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" data-testid={`button-delete-student-${s.id}`}><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {s.name}?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(s.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

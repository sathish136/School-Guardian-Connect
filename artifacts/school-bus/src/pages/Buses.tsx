import { useState } from "react";
import {
  useListBuses, useCreateBus, useUpdateBus, useDeleteBus,
  useListRoutes, getListBusesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Bus, BusInput } from "@workspace/api-client-react";

function BusForm({ initial, routes, onSubmit, onClose, isPending }: {
  initial?: Bus;
  routes: { id: number; name: string }[];
  onSubmit: (data: BusInput) => void;
  onClose: () => void;
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
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Bus Number</Label>
          <Input data-testid="input-bus-number" value={form.busNumber} onChange={e => setForm(p => ({ ...p, busNumber: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Capacity</Label>
          <Input type="number" data-testid="input-bus-capacity" value={form.capacity ?? ""} onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Driver Name</Label>
          <Input data-testid="input-driver-name" value={form.driverName} onChange={e => setForm(p => ({ ...p, driverName: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Driver Phone</Label>
          <Input data-testid="input-driver-phone" value={form.driverPhone} onChange={e => setForm(p => ({ ...p, driverPhone: e.target.value }))} required />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Assigned Route</Label>
          <Select value={form.routeId ? String(form.routeId) : "none"} onValueChange={v => setForm(p => ({ ...p, routeId: v === "none" ? null : Number(v) }))}>
            <SelectTrigger data-testid="select-route">
              <SelectValue placeholder="No route assigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No route assigned</SelectItem>
              {routes.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isPending} data-testid="button-save-bus">
          {isPending ? "Saving..." : initial ? "Update Bus" : "Add Bus"}
        </Button>
      </div>
    </form>
  );
}

export default function Buses() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBus, setEditBus] = useState<Bus | null>(null);
  const { data: buses = [], isLoading } = useListBuses();
  const { data: routes = [] } = useListRoutes();
  const create = useCreateBus();
  const update = useUpdateBus();
  const remove = useDeleteBus();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListBusesQueryKey() });
  const routeMap = Object.fromEntries(routes.map(r => [r.id, r.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight" data-testid="page-title">Buses</h1>
          <p className="text-sm text-slate-500 mt-1">Manage fleet and driver assignments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-bus" className="bg-slate-900 hover:bg-slate-800"><Plus className="h-4 w-4 mr-2" /> Add Bus</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Add New Bus</DialogTitle></DialogHeader>
            <BusForm routes={routes} onSubmit={data => create.mutate({ data }, { onSuccess: () => { invalidate(); setDialogOpen(false); } })} onClose={() => setDialogOpen(false)} isPending={create.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500" data-testid="buses-loading">Loading buses...</div>
          ) : buses.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No buses found. Add a bus to get started.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Bus No.</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Driver</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Driver Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Route</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Capacity</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {buses.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors" data-testid={`row-bus-${b.id}`}>
                    <td className="px-4 py-3 font-semibold text-slate-900">Bus {b.busNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{b.driverName}</td>
                    <td className="px-4 py-3 text-slate-600">{b.driverPhone}</td>
                    <td className="px-4 py-3 text-slate-600">{b.routeId ? routeMap[b.routeId] : <span className="text-slate-400">No route</span>}</td>
                    <td className="px-4 py-3 text-slate-600">{b.capacity ?? 40} seats</td>
                    <td className="px-4 py-3">
                      {b.isActive
                        ? <Badge className="bg-emerald-100 text-emerald-700 border-0">Active</Badge>
                        : <Badge variant="outline" className="text-slate-500">Inactive</Badge>}
                    </td>
                    <td className="px-4 py-3 flex gap-2 justify-end">
                      <Dialog open={editBus?.id === b.id} onOpenChange={open => setEditBus(open ? b : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`button-edit-bus-${b.id}`}><Pencil className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                          <DialogHeader><DialogTitle>Edit Bus</DialogTitle></DialogHeader>
                          <BusForm initial={b} routes={routes} onSubmit={data => update.mutate({ id: b.id, data }, { onSuccess: () => { invalidate(); setEditBus(null); } })} onClose={() => setEditBus(null)} isPending={update.isPending} />
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" data-testid={`button-delete-bus-${b.id}`}><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Bus {b.busNumber}?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove the bus and all associated data.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove.mutate({ id: b.id }, { onSuccess: invalidate })} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
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

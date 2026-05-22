import { useState } from "react";
import { useListRoutes, useCreateRoute, useUpdateRoute, useDeleteRoute, getListRoutesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import type { Route, RouteInput } from "@workspace/api-client-react";

function RouteForm({ initial, onSubmit, onClose, isPending }: {
  initial?: Route;
  onSubmit: (data: RouteInput) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<RouteInput>({
    name: initial?.name ?? "",
    description: initial?.description ?? null,
    totalStops: initial?.totalStops ?? 0,
    estimatedDurationMinutes: initial?.estimatedDurationMinutes ?? null,
  });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Route Name</Label>
        <Input data-testid="input-route-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea data-testid="input-route-description" value={form.description ?? ""} onChange={e => setForm(p => ({ ...p, description: e.target.value || null }))} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Total Stops</Label>
          <Input type="number" data-testid="input-route-stops" value={form.totalStops ?? ""} onChange={e => setForm(p => ({ ...p, totalStops: Number(e.target.value) }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Est. Duration (minutes)</Label>
          <Input type="number" data-testid="input-route-duration" value={form.estimatedDurationMinutes ?? ""} onChange={e => setForm(p => ({ ...p, estimatedDurationMinutes: e.target.value ? Number(e.target.value) : null }))} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isPending} data-testid="button-save-route">
          {isPending ? "Saving..." : initial ? "Update Route" : "Add Route"}
        </Button>
      </div>
    </form>
  );
}

export default function RoutesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRoute, setEditRoute] = useState<Route | null>(null);
  const { data: routes = [], isLoading } = useListRoutes();
  const create = useCreateRoute();
  const update = useUpdateRoute();
  const remove = useDeleteRoute();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListRoutesQueryKey() });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight" data-testid="page-title">Routes</h1>
          <p className="text-sm text-slate-500 mt-1">Manage bus routes and stop information</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-route" className="bg-slate-900 hover:bg-slate-800"><Plus className="h-4 w-4 mr-2" /> Add Route</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add New Route</DialogTitle></DialogHeader>
            <RouteForm onSubmit={data => create.mutate({ data }, { onSuccess: () => { invalidate(); setDialogOpen(false); } })} onClose={() => setDialogOpen(false)} isPending={create.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 p-8 text-center text-slate-500" data-testid="routes-loading">Loading routes...</div>
        ) : routes.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-slate-500">
            <MapPin className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium">No routes found</p>
            <p className="text-sm mt-1">Add a route to get started</p>
          </div>
        ) : routes.map(r => (
          <Card key={r.id} data-testid={`card-route-${r.id}`} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <MapPin className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{r.name}</h3>
                </div>
                <div className="flex gap-1">
                  <Dialog open={editRoute?.id === r.id} onOpenChange={open => setEditRoute(open ? r : null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`button-edit-route-${r.id}`}><Pencil className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader><DialogTitle>Edit Route</DialogTitle></DialogHeader>
                      <RouteForm initial={r} onSubmit={data => update.mutate({ id: r.id, data }, { onSuccess: () => { invalidate(); setEditRoute(null); } })} onClose={() => setEditRoute(null)} isPending={update.isPending} />
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" data-testid={`button-delete-route-${r.id}`}><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Route "{r.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>This will remove the route permanently.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove.mutate({ id: r.id }, { onSuccess: invalidate })} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {r.description && <p className="text-sm text-slate-500 mb-3">{r.description}</p>}
              <div className="flex gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.totalStops ?? 0} stops</span>
                {r.estimatedDurationMinutes && <span>{r.estimatedDurationMinutes} min est.</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

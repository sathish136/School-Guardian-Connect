import { useState } from "react";
import {
  useListTrips, useCreateTrip, useUpdateTrip, useGetTripScans,
  useListBuses, useListRoutes, getListTripsQueryKey, getGetTripScansQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import type { Trip, TripInput } from "@workspace/api-client-react";

function TripScansPanel({ tripId }: { tripId: number }) {
  const { data: scans = [] } = useGetTripScans(tripId, { query: { queryKey: getGetTripScansQueryKey(tripId) } });
  return (
    <div className="space-y-2">
      {scans.length === 0 ? (
        <p className="text-slate-500 text-sm py-4 text-center">No scans recorded for this trip yet.</p>
      ) : (
        <div className="divide-y text-sm">
          {scans.map(s => (
            <div key={s.id} className="py-2 flex items-center gap-3" data-testid={`scan-row-${s.id}`}>
              <Badge className={s.scanType === "board" ? "bg-emerald-100 text-emerald-700 border-0" : "bg-blue-100 text-blue-700 border-0"}>
                {s.scanType === "board" ? "Boarded" : "Alighted"}
              </Badge>
              <span className="font-medium text-slate-800">{s.studentName}</span>
              <span className="text-slate-400 ml-auto">{format(new Date(s.scannedAt), "h:mm:ss a")}</span>
              {s.smsSent && <span className="text-xs text-emerald-600">SMS sent</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Trips() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const { data: trips = [], isLoading } = useListTrips({ status: filter === "all" ? undefined : filter });
  const { data: buses = [] } = useListBuses();
  const { data: routes = [] } = useListRoutes();
  const create = useCreateTrip();
  const update = useUpdateTrip();

  const [newTrip, setNewTrip] = useState<TripInput>({ busId: 0, routeId: null });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
  const busMap = Object.fromEntries(buses.map(b => [b.id, b.busNumber]));
  const routeMap = Object.fromEntries(routes.map(r => [r.id, r.name]));

  const handleCreate = () => {
    if (!newTrip.busId) return;
    create.mutate({ data: newTrip }, {
      onSuccess: () => { invalidate(); setDialogOpen(false); setNewTrip({ busId: 0, routeId: null }); }
    });
  };

  const endTrip = (trip: Trip) => {
    update.mutate({ id: trip.id, data: { status: "completed" } }, { onSuccess: invalidate });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight" data-testid="page-title">Trips</h1>
          <p className="text-sm text-slate-500 mt-1">Active and completed bus trips</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as "" | "active" | "completed")}>
            <SelectTrigger className="w-40" data-testid="select-trip-filter">
              <SelectValue placeholder="All trips" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All trips</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-start-trip" className="bg-slate-900 hover:bg-slate-800"><Plus className="h-4 w-4 mr-2" /> Start Trip</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Start New Trip</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Bus</Label>
                  <Select value={newTrip.busId ? String(newTrip.busId) : ""} onValueChange={v => setNewTrip(p => ({ ...p, busId: Number(v) }))}>
                    <SelectTrigger data-testid="select-trip-bus">
                      <SelectValue placeholder="Select bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses.filter(b => b.isActive).map(b => <SelectItem key={b.id} value={String(b.id)}>Bus {b.busNumber} — {b.driverName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Route (optional)</Label>
                  <Select value={newTrip.routeId ? String(newTrip.routeId) : "none"} onValueChange={v => setNewTrip(p => ({ ...p, routeId: v === "none" ? null : Number(v) }))}>
                    <SelectTrigger data-testid="select-trip-route">
                      <SelectValue placeholder="No route" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No route</SelectItem>
                      {routes.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!newTrip.busId || create.isPending} data-testid="button-confirm-start-trip">
                    {create.isPending ? "Starting..." : "Start Trip"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500" data-testid="trips-loading">Loading trips...</div>
      ) : trips.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <Clock className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="font-medium">No trips found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map(trip => (
            <Card key={trip.id} data-testid={`card-trip-${trip.id}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Badge className={trip.status === "active" ? "bg-emerald-100 text-emerald-700 border-0" : "bg-slate-100 text-slate-600 border-0"}>
                    {trip.status === "active" ? <><span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>Active</> : "Completed"}
                  </Badge>
                  <div>
                    <p className="font-semibold text-slate-900">Bus {busMap[trip.busId]}</p>
                    <p className="text-xs text-slate-500">
                      {trip.routeId ? routeMap[trip.routeId] : "No route"} &nbsp;•&nbsp;
                      Started {format(new Date(trip.startedAt), "MMM d, h:mm a")}
                      {trip.endedAt && ` • Ended ${format(new Date(trip.endedAt), "h:mm a")}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span>{trip.totalBoardings ?? 0} boarded</span>
                  <span>{trip.totalAlightings ?? 0} alighted</span>
                </div>
                <div className="flex items-center gap-2">
                  {trip.status === "active" && (
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => endTrip(trip)} data-testid={`button-end-trip-${trip.id}`}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> End Trip
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedTrip(trip)} data-testid={`button-view-trip-${trip.id}`}>
                    View Scans <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedTrip} onOpenChange={open => !open && setSelectedTrip(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Trip Scans — Bus {selectedTrip && busMap[selectedTrip.busId]}</DialogTitle>
          </DialogHeader>
          {selectedTrip && <TripScansPanel tripId={selectedTrip.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

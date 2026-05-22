import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListDevices, useDeleteDevice, getListDevicesQueryKey } from "@workspace/api-client-react";
import type { Device } from "@workspace/api-client-react";
import { Cpu, Wifi, WifiOff, Trash2, RefreshCw, Circle, Clock, Fingerprint } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function DeviceCard({ device, onDelete }: { device: Device; onDelete: (id: number) => void }) {
  const lastSeen = new Date(device.lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  const lastSeenLabel =
    diffMin < 1 ? "Just now" :
    diffMin < 60 ? `${diffMin}m ago` :
    lastSeen.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <Card className={`relative border-2 transition-all ${device.isOnline ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${device.isOnline ? "bg-emerald-100" : "bg-slate-100"}`}>
              <Cpu className={`h-5 w-5 ${device.isOnline ? "text-emerald-600" : "text-slate-400"}`} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">
                {device.deviceName ?? device.serialNumber}
              </p>
              <p className="text-xs text-slate-500 font-mono">{device.serialNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {device.isOnline ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1">
                <Circle className="h-2 w-2 fill-emerald-500" />
                Online
              </Badge>
            ) : (
              <Badge variant="outline" className="text-slate-500 gap-1">
                <Circle className="h-2 w-2 fill-slate-300" />
                Offline
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600">
          {device.ipAddress && (
            <div className="flex items-center gap-2">
              <Wifi className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-mono">{device.ipAddress}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Last seen: {lastSeenLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <Fingerprint className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{device.totalPunches.toLocaleString()} punches recorded</span>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove device?</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove <strong>{device.serialNumber}</strong> from the system. It will reappear automatically when it reconnects.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(device.id)} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Devices() {
  const queryClient = useQueryClient();
  const { data: devices = [], isLoading, refetch } = useListDevices();
  const deleteDevice = useDeleteDevice();
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetch();
    }, 10_000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const handleDelete = (id: number) => {
    deleteDevice.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey() }),
    });
  };

  const online = devices.filter(d => d.isOnline);
  const offline = devices.filter(d => !d.isOnline);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Biometric Devices</h1>
          <p className="text-sm text-slate-500 mt-1">
            ZK devices connect automatically via ADMS on port 8082
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(r => !r)}
            className={autoRefresh ? "border-emerald-300 text-emerald-700 bg-emerald-50" : ""}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${autoRefresh ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
            {autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Cpu className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{devices.length}</p>
              <p className="text-xs text-slate-500">Total Devices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Wifi className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{online.length}</p>
              <p className="text-xs text-slate-500">Online Now</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Fingerprint className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {devices.reduce((sum, d) => sum + d.totalPunches, 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Total Punches</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device setup info */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Cpu className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800 mb-1">Setting up a ZKTeco device</p>
              <p className="text-amber-700">
                On your device: go to <strong>Communication → ADMS Settings</strong>, set the server address to this server's IP and port <strong>8082</strong>. Enable <strong>Real-time push</strong>. The device will appear here automatically once connected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading devices...</div>
      ) : devices.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <WifiOff className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">No devices connected yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Configure your ZKTeco device to point to this server on port 8082
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {online.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Online ({online.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {online.map(d => <DeviceCard key={d.id} device={d} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
          {offline.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Offline ({offline.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offline.map(d => <DeviceCard key={d.id} device={d} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListDevices, useDeleteDevice, getListDevicesQueryKey } from "@workspace/api-client-react";
import type { Device } from "@workspace/api-client-react";
import { Cpu, Wifi, WifiOff, Trash2, RefreshCw, Circle, Clock, Fingerprint } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const teal = "#0d9488";

function DeviceCard({ device, onDelete }: { device: Device; onDelete: (id: number) => void }) {
  const lastSeen = new Date(device.lastSeen);
  const diffMin = Math.floor((Date.now() - lastSeen.getTime()) / 60000);
  const lastSeenLabel =
    diffMin < 1 ? "Just now" :
    diffMin < 60 ? `${diffMin}m ago` :
    lastSeen.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <Card className={`border-2 transition-all rounded-2xl bg-white ${device.isOnline ? "border-teal-200" : "border-slate-100 opacity-70"}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: device.isOnline ? "#f0fdfa" : "#f8fafc" }}>
              <Cpu className="h-5 w-5" style={{ color: device.isOnline ? teal : "#94a3b8" }} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{device.deviceName ?? device.serialNumber}</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{device.serialNumber}</p>
            </div>
          </div>
          {device.isOnline
            ? <Badge className="border-0 gap-1 text-[10px]" style={{ background: "#f0fdfa", color: "#0f766e" }}>
                <Circle className="h-2 w-2 fill-current" style={{ color: teal }} /> Online
              </Badge>
            : <Badge variant="outline" className="text-slate-400 gap-1 text-[10px]">
                <Circle className="h-2 w-2 fill-slate-300" /> Offline
              </Badge>
          }
        </div>
        <div className="space-y-2 text-xs text-slate-500">
          {device.ipAddress && (
            <div className="flex items-center gap-2"><Wifi className="h-3.5 w-3.5 text-slate-300 shrink-0" /><span className="font-mono">{device.ipAddress}</span></div>
          )}
          <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-slate-300 shrink-0" /><span>Last seen: {lastSeenLabel}</span></div>
          <div className="flex items-center gap-2"><Fingerprint className="h-3.5 w-3.5 shrink-0" style={{ color: teal }} /><span>{device.totalPunches.toLocaleString()} punches</span></div>
        </div>
        <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove device?</AlertDialogTitle>
                <AlertDialogDescription>Remove <strong>{device.serialNumber}</strong>. It will reappear automatically when it reconnects.</AlertDialogDescription>
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
    const interval = setInterval(() => refetch(), 10_000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const handleDelete = (id: number) => {
    deleteDevice.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey() }) });
  };

  const online = devices.filter(d => d.isOnline);
  const offline = devices.filter(d => !d.isOnline);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Biometric Devices</h1>
          <p className="text-sm text-slate-400 mt-0.5">ZK devices connect automatically via ADMS on port 8082</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(r => !r)} className="rounded-xl text-sm"
            style={autoRefresh ? { borderColor: "#99f6e4", background: "#f0fdfa", color: teal } : {}}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${autoRefresh ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
            {autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Devices", value: devices.length, icon: Cpu, bg: "#f8fafc", color: "#64748b" },
          { label: "Online Now", value: online.length, icon: Wifi, bg: "#f0fdfa", color: teal },
          { label: "Total Punches", value: devices.reduce((s, d) => s + d.totalPunches, 0).toLocaleString(), icon: Fingerprint, bg: "#f8fafc", color: "#64748b" },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl" style={{ background: bg }}><Icon className="h-5 w-5" style={{ color }} /></div>
            <div><p className="text-2xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-400 mt-0.5">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Setup hint */}
      <div className="rounded-2xl border px-5 py-4 flex items-start gap-3" style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
        <Cpu className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#d97706" }} />
        <div className="text-sm">
          <p className="font-semibold mb-1" style={{ color: "#92400e" }}>Setting up a ZKTeco device</p>
          <p style={{ color: "#b45309" }}>Go to <strong>Communication → ADMS Settings</strong> on your device, set the server IP and port <strong>8082</strong>, enable <strong>Real-time push</strong>. The device will appear here automatically.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading devices…</div>
      ) : devices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <WifiOff className="h-12 w-12 mx-auto text-slate-200 mb-3" />
          <p className="font-semibold text-slate-600">No devices connected yet</p>
          <p className="text-sm text-slate-400 mt-1">Configure your ZKTeco device to point to port 8082</p>
        </div>
      ) : (
        <>
          {online.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Online ({online.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {online.map(d => <DeviceCard key={d.id} device={d} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
          {offline.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Offline ({offline.length})</p>
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

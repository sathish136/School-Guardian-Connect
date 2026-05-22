import { useState } from "react";
import {
  useListScans, useRecordScan, useListTrips, useListStudents,
  getListScansQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Radio, ArrowUpCircle, ArrowDownCircle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function Scans() {
  const queryClient = useQueryClient();
  const [biometricId, setBiometricId] = useState("");
  const [tripId, setTripId] = useState<number | null>(null);
  const [scanType, setScanType] = useState<"board" | "alight">("board");
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: scans = [], isLoading } = useListScans({ limit: 30 });
  const { data: activeTrips = [] } = useListTrips({ status: "active" });
  const { data: students = [] } = useListStudents();
  const record = useRecordScan();
  const studentMap = Object.fromEntries(students.map(s => [s.biometricId, s.name]));

  const handleScan = () => {
    if (!biometricId || !tripId) return;
    record.mutate(
      { data: { biometricId, tripId, scanType } },
      {
        onSuccess: (result) => {
          setLastResult({
            success: true,
            message: `${result.studentName} ${scanType === "board" ? "boarded" : "alighted"}. SMS ${result.smsSent ? "sent" : "queued"}.`
          });
          setBiometricId("");
          queryClient.invalidateQueries({ queryKey: getListScansQueryKey() });
        },
        onError: () => {
          setLastResult({ success: false, message: "Scan failed. Check biometric ID and try again." });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight" data-testid="page-title">Live Scans</h1>
        <p className="text-sm text-slate-500 mt-1">Simulate biometric device — record student boarding and alighting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan Form */}
        <Card className="lg:col-span-1 border-2 border-slate-900">
          <CardHeader className="bg-slate-900 text-white rounded-t-lg">
            <CardTitle className="flex items-center text-base">
              <Radio className="h-4 w-4 mr-2 text-amber-400" />
              Biometric Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Active Trip</Label>
              <Select value={tripId ? String(tripId) : ""} onValueChange={v => setTripId(Number(v))}>
                <SelectTrigger data-testid="select-scan-trip">
                  <SelectValue placeholder={activeTrips.length === 0 ? "No active trips" : "Select active trip"} />
                </SelectTrigger>
                <SelectContent>
                  {activeTrips.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>Trip #{t.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Scan Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={scanType === "board" ? "default" : "outline"}
                  className={`flex-1 ${scanType === "board" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                  onClick={() => setScanType("board")}
                  data-testid="button-scan-board"
                >
                  <ArrowUpCircle className="h-4 w-4 mr-2" /> Board
                </Button>
                <Button
                  type="button"
                  variant={scanType === "alight" ? "default" : "outline"}
                  className={`flex-1 ${scanType === "alight" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                  onClick={() => setScanType("alight")}
                  data-testid="button-scan-alight"
                >
                  <ArrowDownCircle className="h-4 w-4 mr-2" /> Alight
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Biometric ID</Label>
              <Input
                data-testid="input-biometric-id"
                placeholder="Scan or enter biometric ID"
                value={biometricId}
                onChange={e => setBiometricId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleScan()}
                className="font-mono"
              />
              {biometricId && studentMap[biometricId] && (
                <p className="text-xs text-emerald-600 font-medium">Student: {studentMap[biometricId]}</p>
              )}
            </div>

            {lastResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${lastResult.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`} data-testid="scan-result">
                {lastResult.success
                  ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  : <XCircle className="h-4 w-4 flex-shrink-0" />}
                <span>{lastResult.message}</span>
              </div>
            )}

            <Button
              className="w-full bg-slate-900 hover:bg-slate-800"
              onClick={handleScan}
              disabled={!biometricId || !tripId || record.isPending}
              data-testid="button-submit-scan"
            >
              {record.isPending ? "Processing..." : "Record Scan"}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b bg-slate-50">
            <CardTitle className="text-base font-semibold text-slate-800">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500" data-testid="scans-loading">Loading scans...</div>
            ) : scans.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Radio className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p>No scans recorded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {scans.map(s => (
                  <div key={s.id} className="flex items-center px-4 py-3 hover:bg-slate-50 transition-colors" data-testid={`scan-row-${s.id}`}>
                    <Badge className={`mr-3 border-0 ${s.scanType === "board" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                      {s.scanType === "board" ? "Boarded" : "Alighted"}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{s.studentName}</p>
                      <p className="text-xs text-slate-500">Trip #{s.tripId} • Bus {s.busNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{format(new Date(s.scannedAt), "h:mm:ss a")}</p>
                      {s.smsSent && <span className="text-xs text-emerald-600">SMS sent</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

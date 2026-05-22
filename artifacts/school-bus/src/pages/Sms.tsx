import { useState, useEffect } from "react";
import {
  useGetSmsGateway, useUpsertSmsGateway, useListSmsLogs,
  getGetSmsGatewayQueryKey, getListSmsLogsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, CheckCircle2, XCircle, Clock, Save, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { SmsGatewayInput } from "@workspace/api-client-react";

function GatewayConfig() {
  const queryClient = useQueryClient();
  const { data: gateway } = useGetSmsGateway();
  const upsert = useUpsertSmsGateway();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<SmsGatewayInput>({
    provider: "", apiUrl: "", apiKey: "", senderId: "", isActive: true
  });

  useEffect(() => {
    if (gateway) setForm({
      provider: gateway.provider,
      apiUrl: gateway.apiUrl,
      apiKey: gateway.apiKey,
      senderId: gateway.senderId,
      isActive: gateway.isActive,
    });
  }, [gateway]);

  const handleSave = () => {
    upsert.mutate({ data: form }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSmsGatewayQueryKey() });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="border-b bg-slate-50">
        <CardTitle className="flex items-center text-base font-semibold text-slate-800">
          <Settings className="h-4 w-4 mr-2 text-slate-500" /> SMS Gateway Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Provider Name</Label>
            <Input data-testid="input-sms-provider" placeholder="e.g. Twilio, Vonage" value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Sender ID</Label>
            <Input data-testid="input-sms-sender-id" placeholder="e.g. SCHOOL" value={form.senderId} onChange={e => setForm(p => ({ ...p, senderId: e.target.value }))} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>API URL</Label>
            <Input data-testid="input-sms-api-url" placeholder="https://api.your-sms-gateway.com/send" value={form.apiUrl} onChange={e => setForm(p => ({ ...p, apiUrl: e.target.value }))} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>API Key</Label>
            <Input data-testid="input-sms-api-key" type="password" placeholder="Your API key" value={form.apiKey} onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))} />
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-900">Gateway Active</p>
            <p className="text-xs text-slate-500 mt-0.5">When disabled, SMS logs are recorded but messages are not sent</p>
          </div>
          <Switch data-testid="switch-sms-active" checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={upsert.isPending || !form.provider || !form.apiUrl} data-testid="button-save-gateway" className="bg-slate-900 hover:bg-slate-800">
            <Save className="h-4 w-4 mr-2" />
            {saved ? "Saved!" : upsert.isPending ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SmsLogs() {
  const { data: logs = [], isLoading } = useListSmsLogs({ limit: 50 });

  const statusIcon = (status: string) => {
    if (status === "sent") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status === "failed") return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  const statusBadge = (status: string) => {
    if (status === "sent") return <Badge className="bg-emerald-100 text-emerald-700 border-0">Sent</Badge>;
    if (status === "failed") return <Badge className="bg-red-100 text-red-700 border-0">Failed</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 border-0">Pending</Badge>;
  };

  return (
    <Card>
      <CardHeader className="border-b bg-slate-50">
        <CardTitle className="text-base font-semibold text-slate-800">SMS Delivery Logs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500" data-testid="sms-logs-loading">Loading SMS logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <MessageSquare className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p>No SMS logs yet. Scans will trigger SMS notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map(log => (
              <div key={log.id} className="px-4 py-3 hover:bg-slate-50 transition-colors" data-testid={`log-row-${log.id}`}>
                <div className="flex items-start gap-3">
                  {statusIcon(log.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-900">{log.studentName}</span>
                      {statusBadge(log.status)}
                      <span className="text-xs text-slate-400 ml-auto">{format(new Date(log.sentAt), "MMM d, h:mm a")}</span>
                    </div>
                    <p className="text-xs text-slate-600 truncate">{log.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">To: {log.guardianPhone}</p>
                    {log.errorMessage && <p className="text-xs text-red-500 mt-0.5">{log.errorMessage}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SmsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight" data-testid="page-title">SMS</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your SMS gateway and view delivery logs</p>
      </div>
      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config" data-testid="tab-sms-config">Gateway Config</TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-sms-logs">Delivery Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="config" className="mt-4"><GatewayConfig /></TabsContent>
        <TabsContent value="logs" className="mt-4"><SmsLogs /></TabsContent>
      </Tabs>
    </div>
  );
}

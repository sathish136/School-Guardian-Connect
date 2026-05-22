import { useState, useEffect } from "react";
import {
  useGetSmsGateway, useUpsertSmsGateway, useListSmsLogs,
  useGetWhatsappGateway, useUpsertWhatsappGateway,
  getGetSmsGatewayQueryKey, getGetWhatsappGatewayQueryKey, getListSmsLogsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare, CheckCircle2, XCircle, Clock, Save,
  Smartphone, Plug, Eye, EyeOff, Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { SmsGatewayInput, WhatsappGatewayInput } from "@workspace/api-client-react";

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function Section({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">{children}</div>;
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: React.ElementType }) {
  return (
    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
      <div className="p-2 bg-indigo-50 rounded-xl">
        <Icon className="h-4 w-4 text-indigo-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-6 items-start py-4 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

/* ─── WhatsApp Config ───────────────────────────────────────────────────── */
function WhatsappConfig() {
  const queryClient = useQueryClient();
  const { data: gw } = useGetWhatsappGateway();
  const upsert = useUpsertWhatsappGateway();
  const [saved, setSaved] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [form, setForm] = useState<WhatsappGatewayInput>({ instanceId: "", token: "", isActive: true });

  useEffect(() => {
    if (gw) setForm({ instanceId: gw.instanceId, token: gw.token, isActive: gw.isActive });
  }, [gw]);

  const handleSave = () => {
    upsert.mutate({ data: form }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWhatsappGatewayQueryKey() });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  };

  return (
    <Section>
      <SectionHeader title="UltraMsg — WhatsApp" subtitle="Send WhatsApp messages to guardians via UltraMsg API" icon={Smartphone} />
      <div className="px-6 py-2">
        <FieldRow label="Instance ID" hint="From your UltraMsg dashboard">
          <Input
            className="h-9 text-sm rounded-xl font-mono"
            placeholder="e.g. instance12345"
            value={form.instanceId}
            onChange={e => setForm(p => ({ ...p, instanceId: e.target.value }))}
          />
        </FieldRow>
        <FieldRow label="Token" hint="UltraMsg instance token">
          <div className="relative">
            <Input
              className="h-9 text-sm rounded-xl pr-10 font-mono"
              type={showToken ? "text" : "password"}
              placeholder="Your UltraMsg token"
              value={form.token}
              onChange={e => setForm(p => ({ ...p, token: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowToken(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </FieldRow>
        <FieldRow label="Status" hint="Enable or disable WhatsApp delivery">
          <div className="flex items-center gap-3">
            <Switch checked={form.isActive ?? true} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
            <span className="text-sm text-slate-600">{form.isActive ? "Active — WhatsApp messages will be sent" : "Inactive — messages will fall back to SMS"}</span>
          </div>
        </FieldRow>
      </div>
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Circle className={`h-2 w-2 fill-current ${gw?.isActive ? "text-emerald-500" : "text-slate-300"}`} />
          {gw ? (gw.isActive ? "Connected and active" : "Configured but inactive") : "Not configured"}
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={upsert.isPending || !form.instanceId || !form.token}
          className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-1.5"
        >
          <Save className="h-3.5 w-3.5" />
          {saved ? "Saved!" : upsert.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </Section>
  );
}

/* ─── SMS Config ────────────────────────────────────────────────────────── */
function SmsConfig() {
  const queryClient = useQueryClient();
  const { data: gateway } = useGetSmsGateway();
  const upsert = useUpsertSmsGateway();
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [form, setForm] = useState<SmsGatewayInput>({ provider: "", apiUrl: "", apiKey: "", senderId: "", isActive: true });

  useEffect(() => {
    if (gateway) setForm({ provider: gateway.provider, apiUrl: gateway.apiUrl, apiKey: gateway.apiKey, senderId: gateway.senderId, isActive: gateway.isActive });
  }, [gateway]);

  const handleSave = () => {
    upsert.mutate({ data: form }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSmsGatewayQueryKey() });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  };

  return (
    <Section>
      <SectionHeader title="SMS Gateway" subtitle="Fallback SMS delivery when WhatsApp is inactive" icon={MessageSquare} />
      <div className="px-6 py-2">
        <FieldRow label="Provider" hint="e.g. Twilio, Vonage, Termii">
          <Input className="h-9 text-sm rounded-xl" placeholder="Provider name" value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))} />
        </FieldRow>
        <FieldRow label="Sender ID" hint="Sender ID shown to recipients">
          <Input className="h-9 text-sm rounded-xl" placeholder="e.g. SCHOOL" value={form.senderId} onChange={e => setForm(p => ({ ...p, senderId: e.target.value }))} />
        </FieldRow>
        <FieldRow label="API URL" hint="SMS gateway endpoint">
          <Input className="h-9 text-sm rounded-xl font-mono" placeholder="https://api.sms-provider.com/send" value={form.apiUrl} onChange={e => setForm(p => ({ ...p, apiUrl: e.target.value }))} />
        </FieldRow>
        <FieldRow label="API Key" hint="Authentication token">
          <div className="relative">
            <Input
              className="h-9 text-sm rounded-xl pr-10 font-mono"
              type={showKey ? "text" : "password"}
              placeholder="Your API key"
              value={form.apiKey}
              onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))}
            />
            <button type="button" onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </FieldRow>
        <FieldRow label="Status">
          <div className="flex items-center gap-3">
            <Switch checked={form.isActive ?? true} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
            <span className="text-sm text-slate-600">{form.isActive ? "Active" : "Inactive"}</span>
          </div>
        </FieldRow>
      </div>
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Circle className={`h-2 w-2 fill-current ${gateway?.isActive ? "text-emerald-500" : "text-slate-300"}`} />
          {gateway ? (gateway.isActive ? "Connected and active" : "Configured but inactive") : "Not configured"}
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={upsert.isPending || !form.provider || !form.apiUrl}
          className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-1.5"
        >
          <Save className="h-3.5 w-3.5" />
          {saved ? "Saved!" : upsert.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </Section>
  );
}

/* ─── Logs ──────────────────────────────────────────────────────────────── */
function DeliveryLogs() {
  const { data: logs = [], isLoading } = useListSmsLogs({ limit: 100 });

  return (
    <Section>
      <SectionHeader title="Delivery Logs" subtitle="All notification attempts across WhatsApp and SMS" icon={Clock} />
      {isLoading ? (
        <div className="divide-y divide-slate-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-3.5 flex items-center gap-3 animate-pulse">
              <div className="h-6 w-6 rounded-full bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-100 rounded w-48" />
                <div className="h-2.5 bg-slate-100 rounded w-64" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="py-16 text-center">
          <MessageSquare className="h-10 w-10 mx-auto text-slate-200 mb-3" />
          <p className="text-sm text-slate-500 font-medium">No logs yet</p>
          <p className="text-xs text-slate-400 mt-1">Notifications sent after biometric punches will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {logs.map(log => (
            <div key={log.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
              <div className="shrink-0">
                {log.status === "sent"
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  : log.status === "failed"
                  ? <XCircle className="h-4 w-4 text-red-400" />
                  : <Clock className="h-4 w-4 text-amber-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-slate-800 truncate">{log.studentName ?? "Unknown"}</span>
                  {log.status === "sent"
                    ? <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px] px-1.5">Delivered</Badge>
                    : log.status === "failed"
                    ? <Badge className="bg-red-50 text-red-600 border-0 text-[10px] px-1.5">Failed</Badge>
                    : <Badge className="bg-amber-50 text-amber-700 border-0 text-[10px] px-1.5">Pending</Badge>
                  }
                </div>
                <p className="text-xs text-slate-500 truncate">{log.message}</p>
                {log.errorMessage && <p className="text-xs text-red-400 mt-0.5 truncate">{log.errorMessage}</p>}
                <p className="text-xs text-slate-400 mt-0.5">→ {log.guardianPhone}</p>
              </div>
              <span className="text-xs text-slate-400 shrink-0">{format(new Date(log.sentAt), "MMM d, h:mm a")}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function SmsPage() {
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integration</h1>
        <p className="text-sm text-slate-400 mt-0.5">Connect WhatsApp and SMS gateways for guardian notifications</p>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3.5 flex items-start gap-3 text-sm">
        <Plug className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
        <div className="text-indigo-700">
          <span className="font-semibold">Priority order:</span> WhatsApp (UltraMsg) is tried first when active. If inactive or it fails, the system falls back to SMS automatically.
        </div>
      </div>

      <Tabs defaultValue="whatsapp">
        <TabsList className="bg-slate-100 rounded-xl p-1 gap-1">
          <TabsTrigger value="whatsapp" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
            <Smartphone className="h-3.5 w-3.5" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="sms" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> SMS
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Logs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="whatsapp" className="mt-4"><WhatsappConfig /></TabsContent>
        <TabsContent value="sms" className="mt-4"><SmsConfig /></TabsContent>
        <TabsContent value="logs" className="mt-4"><DeliveryLogs /></TabsContent>
      </Tabs>
    </div>
  );
}

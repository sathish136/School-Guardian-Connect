import { useState, useEffect } from "react";
import {
  useGetSmsGateway, useUpsertSmsGateway, useListSmsLogs,
  useGetWhatsappGateway, useUpsertWhatsappGateway, useTestWhatsappGateway,
  getGetSmsGatewayQueryKey, getGetWhatsappGatewayQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, CheckCircle2, XCircle, Clock, Save, Smartphone, Eye, EyeOff, Info, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { SmsGatewayInput, WhatsappGatewayInput } from "@workspace/api-client-react";

const ACCENT = "#F59E0B";
const BORDER = "#E8E8EC";
const MUTED = "#8B8B99";
const HEAD = "#0A0A0B";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-6 items-start py-4" style={{ borderBottom: `1px solid #F4F4F5` }}>
      <div>
        <p className="text-[13px] font-medium" style={{ color: "#3F3F46" }}>{label}</p>
        {hint && <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>{hint}</p>}
      </div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

function Inp({ value, onChange, type = "text", placeholder, mono }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string; mono?: boolean;
}) {
  return (
    <input
      type={type}
      className="w-full h-9 px-3 rounded-md text-[13px] outline-none transition-colors"
      style={{
        border: `1px solid ${BORDER}`, background: "#fff", color: HEAD,
        fontFamily: mono ? "monospace" : undefined,
      }}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function SaveBtn({ onClick, disabled, saved, pending }: { onClick: () => void; disabled?: boolean; saved: boolean; pending: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || pending}
      className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium text-white transition-opacity"
      style={{ background: ACCENT, opacity: disabled || pending ? 0.5 : 1 }}
    >
      <Save style={{ width: 13, height: 13 }} />
      {saved ? "Saved" : pending ? "Saving…" : "Save"}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>{children}</div>;
}

function CardHead({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: React.ElementType }) {
  return (
    <div className="px-5 py-3.5 flex items-center gap-3" style={{ borderBottom: `1px solid ${BORDER}`, background: "#FAFAFA" }}>
      <Icon style={{ width: 15, height: 15, color: MUTED }} />
      <div>
        <p className="text-[13px] font-semibold" style={{ color: HEAD }}>{title}</p>
        <p className="text-[12px]" style={{ color: MUTED }}>{subtitle}</p>
      </div>
    </div>
  );
}

function CardFoot({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFAFA" }}>{children}</div>;
}

function StatusDot({ on }: { on: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px]" style={{ color: MUTED }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? "#16A34A" : "#D1D5DB" }} />
      {on ? "Active" : "Not active"}
    </span>
  );
}

/* ─── WhatsApp ─── */
function WhatsappTab() {
  const qc = useQueryClient();
  const { data: gw } = useGetWhatsappGateway();
  const save = useUpsertWhatsappGateway();
  const test = useTestWhatsappGateway();
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<WhatsappGatewayInput>({ instanceId: "", token: "", isActive: true });
  const [testPhone, setTestPhone] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  useEffect(() => { if (gw) setForm({ instanceId: gw.instanceId, token: gw.token, isActive: gw.isActive }); }, [gw]);

  const handleSave = () => save.mutate({ data: form }, {
    onSuccess: () => { qc.invalidateQueries({ queryKey: getGetWhatsappGatewayQueryKey() }); setSaved(true); setTimeout(() => setSaved(false), 2500); }
  });

  const handleTest = () => {
    setTestResult(null);
    test.mutate({ data: { phone: testPhone } }, {
      onSuccess: (res) => {
        setTestResult({ success: res.success, error: res.error ?? undefined });
      },
      onError: () => setTestResult({ success: false, error: "Request failed" }),
    });
  };

  return (
    <Card>
      <CardHead title="UltraMsg — WhatsApp" subtitle="Send WhatsApp messages to guardians via UltraMsg API" icon={Smartphone} />
      <div className="px-5">
        <Field label="Instance ID" hint="From your UltraMsg dashboard">
          <Inp mono value={form.instanceId} onChange={v => setForm(p => ({ ...p, instanceId: v }))} placeholder="instance12345" />
        </Field>
        <Field label="Token" hint="UltraMsg instance token">
          <div className="relative">
            <Inp mono type={show ? "text" : "password"} value={form.token} onChange={v => setForm(p => ({ ...p, token: v }))} placeholder="Your UltraMsg token" />
            <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }}>
              {show ? <EyeOff style={{ width: 13, height: 13 }} /> : <Eye style={{ width: 13, height: 13 }} />}
            </button>
          </div>
        </Field>
        <div className="py-4 flex items-center gap-3" style={{ borderBottom: `1px solid #F4F4F5` }}>
          <Switch checked={form.isActive ?? true} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
          <span className="text-[13px]" style={{ color: "#52525B" }}>{form.isActive ? "Active — WhatsApp enabled" : "Inactive — will fall back to SMS"}</span>
        </div>

        {/* Test section */}
        <div className="py-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider mb-3" style={{ color: MUTED }}>Test connection</p>
          <div className="flex items-center gap-2">
            <input
              type="tel"
              className="flex-1 h-9 px-3 rounded-md text-[13px] outline-none"
              style={{ border: `1px solid #E8E8EC`, background: "#fff", color: "#0A0A0B" }}
              placeholder="Phone number with country code (e.g. +1 555 000 0000)"
              value={testPhone}
              onChange={e => { setTestPhone(e.target.value); setTestResult(null); }}
            />
            <button
              onClick={handleTest}
              disabled={!testPhone || test.isPending}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[13px] font-medium transition-opacity"
              style={{
                background: "#F4F4F5", color: "#3F3F46", border: "1px solid #E8E8EC",
                opacity: !testPhone || test.isPending ? 0.5 : 1,
              }}
            >
              <Send style={{ width: 13, height: 13 }} />
              {test.isPending ? "Sending…" : "Send test"}
            </button>
          </div>
          {testResult && (
            <div
              className="mt-2.5 flex items-start gap-2 px-3 py-2.5 rounded-md text-[13px]"
              style={testResult.success
                ? { background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D" }
                : { background: "#FFF1F2", border: "1px solid #FECDD3", color: "#BE123C" }
              }
            >
              {testResult.success
                ? <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
                : <XCircle style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
              }
              <span>{testResult.success ? "Test message sent successfully! Check your WhatsApp." : testResult.error ?? "Failed to send"}</span>
            </div>
          )}
        </div>
      </div>
      <CardFoot>
        <StatusDot on={!!gw?.isActive} />
        <SaveBtn onClick={handleSave} disabled={!form.instanceId || !form.token} saved={saved} pending={save.isPending} />
      </CardFoot>
    </Card>
  );
}

/* ─── SMS ─── */
function SmsTab() {
  const qc = useQueryClient();
  const { data: gw } = useGetSmsGateway();
  const save = useUpsertSmsGateway();
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<SmsGatewayInput>({ provider: "", apiUrl: "", apiKey: "", senderId: "", isActive: true });
  useEffect(() => {
    if (gw) setForm({ provider: gw.provider, apiUrl: gw.apiUrl, apiKey: gw.apiKey, senderId: gw.senderId, isActive: gw.isActive });
  }, [gw]);

  const handleSave = () => save.mutate({ data: form }, {
    onSuccess: () => { qc.invalidateQueries({ queryKey: getGetSmsGatewayQueryKey() }); setSaved(true); setTimeout(() => setSaved(false), 2500); }
  });

  return (
    <Card>
      <CardHead title="SMS Gateway" subtitle="Fallback SMS delivery when WhatsApp is inactive" icon={MessageSquare} />
      <div className="px-5">
        <Field label="Provider" hint="e.g. Twilio, Vonage, Termii">
          <Inp value={form.provider} onChange={v => setForm(p => ({ ...p, provider: v }))} placeholder="Provider name" />
        </Field>
        <Field label="Sender ID" hint="Name shown to recipients">
          <Inp value={form.senderId} onChange={v => setForm(p => ({ ...p, senderId: v }))} placeholder="SCHOOL" />
        </Field>
        <Field label="API URL" hint="SMS gateway endpoint">
          <Inp mono value={form.apiUrl} onChange={v => setForm(p => ({ ...p, apiUrl: v }))} placeholder="https://api.provider.com/send" />
        </Field>
        <Field label="API key">
          <div className="relative">
            <Inp mono type={show ? "text" : "password"} value={form.apiKey} onChange={v => setForm(p => ({ ...p, apiKey: v }))} placeholder="Your API key" />
            <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }}>
              {show ? <EyeOff style={{ width: 13, height: 13 }} /> : <Eye style={{ width: 13, height: 13 }} />}
            </button>
          </div>
        </Field>
        <div className="py-4 flex items-center gap-3">
          <Switch checked={form.isActive ?? true} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
          <span className="text-[13px]" style={{ color: "#52525B" }}>{form.isActive ? "Active" : "Inactive"}</span>
        </div>
      </div>
      <CardFoot>
        <StatusDot on={!!gw?.isActive} />
        <SaveBtn onClick={handleSave} disabled={!form.provider || !form.apiUrl} saved={saved} pending={save.isPending} />
      </CardFoot>
    </Card>
  );
}

/* ─── Logs ─── */
function LogsTab() {
  const { data: logs = [], isLoading } = useListSmsLogs({ limit: 100 });
  return (
    <Card>
      <CardHead title="Delivery logs" subtitle="All notification attempts across WhatsApp and SMS" icon={Clock} />
      {isLoading ? (
        <div className="divide-y" style={{ borderColor: "#F4F4F5" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-5 py-3 flex gap-3 animate-pulse">
              <div className="h-5 w-5 rounded-full shrink-0" style={{ background: "#F4F4F5" }} />
              <div className="flex-1 space-y-2 pt-0.5">
                <div className="h-3 rounded w-40" style={{ background: "#F4F4F5" }} />
                <div className="h-2.5 rounded w-60" style={{ background: "#F4F4F5" }} />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-[13px] font-medium" style={{ color: "#52525B" }}>No logs yet</p>
          <p className="text-[12px] mt-1" style={{ color: MUTED }}>Notifications appear here after biometric punches</p>
        </div>
      ) : (
        <div>
          {logs.map((log, i) => (
            <div key={log.id} className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: i < logs.length - 1 ? `1px solid #F4F4F5` : "none" }}>
              {log.status === "sent"
                ? <CheckCircle2 style={{ width: 14, height: 14, color: "#16A34A", flexShrink: 0 }} />
                : log.status === "failed"
                ? <XCircle style={{ width: 14, height: 14, color: "#EF4444", flexShrink: 0 }} />
                : <Clock style={{ width: 14, height: 14, color: "#F59E0B", flexShrink: 0 }} />
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium truncate" style={{ color: HEAD }}>{log.studentName ?? "Unknown"}</span>
                  <span
                    className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                    style={log.status === "sent"
                      ? { background: "#F0FDF4", color: "#15803D" }
                      : log.status === "failed"
                      ? { background: "#FFF1F2", color: "#BE123C" }
                      : { background: "#FFFBEB", color: "#B45309" }
                    }
                  >
                    {log.status === "sent" ? "Delivered" : log.status === "failed" ? "Failed" : "Pending"}
                  </span>
                </div>
                <p className="text-[12px] truncate mt-0.5" style={{ color: MUTED }}>{log.message}</p>
                {log.errorMessage && <p className="text-[12px] truncate" style={{ color: "#EF4444" }}>{log.errorMessage}</p>}
                <p className="text-[12px]" style={{ color: "#A1A1AA" }}>→ {log.guardianPhone}</p>
              </div>
              <span className="text-[12px] shrink-0" style={{ color: MUTED }}>{format(new Date(log.sentAt), "MMM d, h:mm a")}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ─── Page ─── */
export default function SmsPage() {
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-[22px] font-semibold" style={{ color: HEAD }}>Integration</h1>
        <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>Connect WhatsApp and SMS gateways for guardian notifications</p>
      </div>

      <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg text-[13px]" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
        <Info style={{ width: 14, height: 14, color: ACCENT, flexShrink: 0, marginTop: 2 }} />
        <span style={{ color: "#3730A3" }}>
          <strong>Priority:</strong> WhatsApp (UltraMsg) is tried first when active. Falls back to SMS automatically if inactive or failed.
        </span>
      </div>

      <Tabs defaultValue="whatsapp">
        <TabsList className="h-9 bg-white gap-0 p-1 rounded-md" style={{ border: `1px solid ${BORDER}` }}>
          <TabsTrigger value="whatsapp" className="rounded text-[13px] gap-1.5 h-7 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none">
            <Smartphone style={{ width: 13, height: 13 }} /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="sms" className="rounded text-[13px] gap-1.5 h-7 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none">
            <MessageSquare style={{ width: 13, height: 13 }} /> SMS
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded text-[13px] gap-1.5 h-7 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none">
            <Clock style={{ width: 13, height: 13 }} /> Logs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="whatsapp" className="mt-4"><WhatsappTab /></TabsContent>
        <TabsContent value="sms" className="mt-4"><SmsTab /></TabsContent>
        <TabsContent value="logs" className="mt-4"><LogsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

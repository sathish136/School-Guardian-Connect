import { useState, useEffect } from "react";
import {
  useGetSmsGateway, useUpsertSmsGateway, useListSmsLogs, useTestSmsGateway,
  useGetWhatsappGateway, useUpsertWhatsappGateway, useTestWhatsappGateway,
  getGetSmsGatewayQueryKey, getGetWhatsappGatewayQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, CheckCircle2, XCircle, Clock, Save, Smartphone, Eye, EyeOff, Info, Send, FileText, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { SmsGatewayInput, WhatsappGatewayInput } from "@workspace/api-client-react";

const ACCENT = "#F59E0B";
const BORDER = "#E2E8F0";
const MUTED = "#64748B";
const HEAD = "#0F172A";

const DEFAULT_BOARD_TEMPLATE = "Dear {guardianName}, your child {studentName} has boarded Bus {busNumber} at {time}. They are on their way safely.";
const DEFAULT_ALIGHT_TEMPLATE = "Dear {guardianName}, your child {studentName} has alighted from Bus {busNumber} at {time}. They have arrived safely.";

function Inp({ value, onChange, type = "text", placeholder, mono }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string; mono?: boolean;
}) {
  return (
    <input
      type={type}
      className="w-full h-10 px-3.5 rounded-xl text-sm outline-none transition-all"
      style={{ border: `1px solid ${BORDER}`, background: "#fff", color: HEAD, fontFamily: mono ? "monospace" : undefined }}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={e => (e.target.style.borderColor = ACCENT)}
      onBlur={e => (e.target.style.borderColor = BORDER)}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
      style={{ border: `1px solid ${BORDER}`, background: "#fff", color: HEAD }}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={e => (e.target.style.borderColor = ACCENT)}
      onBlur={e => (e.target.style.borderColor = BORDER)}
    />
  );
}

function SectionCard({ title, subtitle, icon: Icon, children }: {
  title: string; subtitle: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
      <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#FEF3C7" }}>
          <Icon style={{ width: 16, height: 16, color: ACCENT }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: HEAD }}>{title}</p>
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-6 items-start py-4" style={{ borderBottom: `1px solid #F1F5F9` }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: HEAD }}>{label}</p>
        {hint && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{hint}</p>}
      </div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

function SaveBtn({ onClick, disabled, saved, pending }: { onClick: () => void; disabled?: boolean; saved: boolean; pending: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || pending}
      className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-bold text-white transition-opacity"
      style={{ background: ACCENT, opacity: disabled || pending ? 0.5 : 1, border: "none" }}
    >
      <Save style={{ width: 13, height: 13 }} />
      {saved ? "Saved ✓" : pending ? "Saving…" : "Save settings"}
    </button>
  );
}

function StatusChip({ on }: { on: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: on ? "#15803D" : MUTED }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? "#16A34A" : "#D1D5DB" }} />
      {on ? "Active" : "Not active"}
    </span>
  );
}

/* ─── Message Templates ─── */
function MessageTemplatesTab() {
  const STORAGE_KEY = "saferide_msg_templates";
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
  })();

  const [boardMsg, setBoardMsg] = useState<string>(saved.board ?? DEFAULT_BOARD_TEMPLATE);
  const [alightMsg, setAlightMsg] = useState<string>(saved.alight ?? DEFAULT_ALIGHT_TEMPLATE);
  const [savedOk, setSavedOk] = useState(false);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ board: boardMsg, alight: alightMsg }));
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2500);
  };

  const variables = ["{studentName}", "{guardianName}", "{busNumber}", "{time}", "{scanType}"];

  return (
    <div className="space-y-4">
      <SectionCard title="Message Templates" subtitle="Customize the text sent to guardians on board and alight events" icon={FileText}>
        <div className="px-6 py-5 space-y-5">
          {/* Variable reference */}
          <div className="flex flex-wrap gap-2">
            {variables.map(v => (
              <code key={v} className="text-xs font-mono px-2.5 py-1 rounded-lg" style={{ background: "#FEF3C7", color: "#92400E" }}>{v}</code>
            ))}
            <span className="text-xs self-center" style={{ color: MUTED }}>— available variables</span>
          </div>

          <FieldRow label="Board message" hint="Sent when student boards the bus">
            <Textarea
              value={boardMsg}
              onChange={setBoardMsg}
              placeholder={DEFAULT_BOARD_TEMPLATE}
              rows={4}
            />
            {/* Preview */}
            <div className="mt-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, color: MUTED }}>
              <span className="font-semibold text-[10px] uppercase tracking-wider">Preview: </span>
              {boardMsg
                .replace("{studentName}", "Arjun Sharma")
                .replace("{guardianName}", "Mr. Sharma")
                .replace("{busNumber}", "BUS-01")
                .replace("{time}", "7:30 AM")
                .replace("{scanType}", "boarded")}
            </div>
          </FieldRow>

          <FieldRow label="Alight message" hint="Sent when student alights from the bus">
            <Textarea
              value={alightMsg}
              onChange={setAlightMsg}
              placeholder={DEFAULT_ALIGHT_TEMPLATE}
              rows={4}
            />
            <div className="mt-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, color: MUTED }}>
              <span className="font-semibold text-[10px] uppercase tracking-wider">Preview: </span>
              {alightMsg
                .replace("{studentName}", "Arjun Sharma")
                .replace("{guardianName}", "Mr. Sharma")
                .replace("{busNumber}", "BUS-01")
                .replace("{time}", "2:15 PM")
                .replace("{scanType}", "alighted")}
            </div>
          </FieldRow>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 h-9 px-5 rounded-xl text-sm font-bold text-white"
              style={{ background: ACCENT, border: "none" }}
            >
              <Save style={{ width: 13, height: 13 }} />
              {savedOk ? "Saved ✓" : "Save templates"}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
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
      onSuccess: (res) => setTestResult({ success: res.success, error: res.error ?? undefined }),
      onError: () => setTestResult({ success: false, error: "Request failed" }),
    });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="UltraMsg — WhatsApp" subtitle="Send WhatsApp messages to guardians via UltraMsg API" icon={Smartphone}>
        <div className="px-6 py-2">
          <FieldRow label="Instance ID" hint="From your UltraMsg dashboard">
            <Inp mono value={form.instanceId} onChange={v => setForm(p => ({ ...p, instanceId: v }))} placeholder="instance12345" />
          </FieldRow>
          <FieldRow label="Token" hint="UltraMsg instance token">
            <div className="relative">
              <Inp mono type={show ? "text" : "password"} value={form.token} onChange={v => setForm(p => ({ ...p, token: v }))} placeholder="Your UltraMsg token" />
              <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }}>
                {show ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
              </button>
            </div>
          </FieldRow>
          <div className="py-4 flex items-center gap-3" style={{ borderBottom: `1px solid #F1F5F9` }}>
            <Switch checked={form.isActive ?? true} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
            <span className="text-sm" style={{ color: HEAD }}>{form.isActive ? "Active — WhatsApp enabled" : "Inactive — will fall back to SMS"}</span>
          </div>
          <div className="py-5">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: MUTED }}>Test connection</p>
            <div className="flex items-center gap-2">
              <input
                type="tel"
                className="flex-1 h-10 px-3.5 rounded-xl text-sm outline-none transition-all"
                style={{ border: `1px solid ${BORDER}`, background: "#fff", color: HEAD }}
                placeholder="Phone with country code (e.g. +91 98765 43210)"
                value={testPhone}
                onChange={e => { setTestPhone(e.target.value); setTestResult(null); }}
                onFocus={e => (e.target.style.borderColor = ACCENT)}
                onBlur={e => (e.target.style.borderColor = BORDER)}
              />
              <button
                onClick={handleTest}
                disabled={!testPhone || test.isPending}
                className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold transition-opacity"
                style={{ background: "#1E3A5F", color: "#fff", opacity: !testPhone || test.isPending ? 0.5 : 1, border: "none" }}
              >
                <Send style={{ width: 13, height: 13 }} />
                {test.isPending ? "Sending…" : "Send test"}
              </button>
            </div>
            {testResult && (
              <div
                className="mt-3 flex items-start gap-2 px-3.5 py-3 rounded-xl text-sm"
                style={testResult.success
                  ? { background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D" }
                  : { background: "#FFF1F2", border: "1px solid #FECDD3", color: "#BE123C" }
                }
              >
                {testResult.success
                  ? <CheckCircle2 style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                  : <XCircle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                }
                {testResult.success ? "Test message sent! Check your WhatsApp." : testResult.error ?? "Failed"}
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-3.5 flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
          <StatusChip on={!!gw?.isActive} />
          <SaveBtn onClick={handleSave} disabled={!form.instanceId || !form.token} saved={saved} pending={save.isPending} />
        </div>
      </SectionCard>
    </div>
  );
}

const HUTCH_DEFAULTS: SmsGatewayInput = {
  provider: "Hutch BSMS",
  apiUrl: "https://bsms.hutch.lk",
  apiKey: "pradeep888@gmail.com",
  senderId: "Live U",
  isActive: true,
};

const isHutch = (provider: string) => provider === "Hutch BSMS";

/* ─── SMS ─── */
function SmsTab() {
  const qc = useQueryClient();
  const { data: gw } = useGetSmsGateway();
  const save = useUpsertSmsGateway();
  const test = useTestSmsGateway();
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<SmsGatewayInput>(HUTCH_DEFAULTS);
  const [testPhone, setTestPhone] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  useEffect(() => {
    if (gw) setForm({ provider: gw.provider, apiUrl: gw.apiUrl, apiKey: gw.apiKey ?? "", senderId: gw.senderId, isActive: gw.isActive });
  }, [gw]);

  const handleSave = () => save.mutate({ data: form }, {
    onSuccess: () => { qc.invalidateQueries({ queryKey: getGetSmsGatewayQueryKey() }); setSaved(true); setTimeout(() => setSaved(false), 2500); }
  });

  const hutch = isHutch(form.provider);

  const handleTest = () => {
    setTestResult(null);
    test.mutate({
      data: {
        phone: testPhone,
        provider: form.provider,
        apiUrl: form.apiUrl,
        apiKey: form.apiKey,
        senderId: form.senderId,
      }
    }, {
      onSuccess: (res) => setTestResult({ success: res.success, error: res.error ?? undefined }),
      onError: () => setTestResult({ success: false, error: "Request failed" }),
    });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="SMS Gateway — Hutch BSMS" subtitle="Send SMS notifications to guardians via Hutch Business SMS" icon={MessageSquare}>
        <div className="px-6 py-2">
          {/* Quick-fill strip */}
          {!hutch && (
            <div className="py-3" style={{ borderBottom: `1px solid #F1F5F9` }}>
              <button
                onClick={() => setForm(HUTCH_DEFAULTS)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold"
                style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}
              >
                <Zap style={{ width: 11, height: 11 }} />
                Pre-fill Hutch BSMS settings
              </button>
            </div>
          )}

          <FieldRow label="Provider" hint="SMS service provider name">
            <Inp value={form.provider} onChange={v => setForm(p => ({ ...p, provider: v }))} placeholder="Hutch BSMS" />
          </FieldRow>
          <FieldRow label="Base URL" hint="Gateway base URL">
            <Inp mono value={form.apiUrl} onChange={v => setForm(p => ({ ...p, apiUrl: v }))} placeholder="https://bsms.hutch.lk" />
          </FieldRow>
          <FieldRow
            label={hutch ? "Username" : "API Key"}
            hint={hutch ? "Your Hutch BSMS account email" : "Authentication key"}
          >
            <div className="relative">
              <Inp mono type={show ? "text" : "password"} value={form.apiKey} onChange={v => setForm(p => ({ ...p, apiKey: v }))} placeholder={hutch ? "your@email.com" : "API key"} />
              <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }}>
                {show ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
              </button>
            </div>
            {hutch && (
              <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                Password is stored securely as an environment secret (<code className="font-mono text-[11px]">HUTCH_SMS_PASSWORD</code>).
              </p>
            )}
          </FieldRow>
          <FieldRow
            label={hutch ? "Mask (Sender ID)" : "Sender ID"}
            hint={hutch ? "Approved sender mask shown to recipients" : "Name shown to recipients"}
          >
            <Inp value={form.senderId} onChange={v => setForm(p => ({ ...p, senderId: v }))} placeholder={hutch ? "Live U" : "SCHOOL"} />
          </FieldRow>
          <div className="py-4 flex items-center gap-3" style={{ borderBottom: `1px solid #F1F5F9` }}>
            <Switch checked={form.isActive ?? true} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
            <span className="text-sm" style={{ color: HEAD }}>{form.isActive ? "Active" : "Inactive"}</span>
          </div>

          {/* Test section */}
          <div className="py-5">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: MUTED }}>Test connection</p>
            <div className="flex items-center gap-2">
              <input
                type="tel"
                className="flex-1 h-10 px-3.5 rounded-xl text-sm outline-none transition-all"
                style={{ border: `1px solid ${BORDER}`, background: "#fff", color: HEAD }}
                placeholder={hutch ? "Phone with country code (e.g. 94710331717)" : "Phone with country code"}
                value={testPhone}
                onChange={e => { setTestPhone(e.target.value); setTestResult(null); }}
                onFocus={e => (e.target.style.borderColor = ACCENT)}
                onBlur={e => (e.target.style.borderColor = BORDER)}
              />
              <button
                onClick={handleTest}
                disabled={!testPhone || test.isPending}
                className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold transition-opacity"
                style={{ background: "#1E3A5F", color: "#fff", opacity: !testPhone || test.isPending ? 0.5 : 1, border: "none" }}
              >
                <Send style={{ width: 13, height: 13 }} />
                {test.isPending ? "Sending…" : "Send test"}
              </button>
            </div>
            {testResult && (
              <div
                className="mt-3 flex items-start gap-2 px-3.5 py-3 rounded-xl text-sm"
                style={testResult.success
                  ? { background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D" }
                  : { background: "#FFF1F2", border: "1px solid #FECDD3", color: "#BE123C" }
                }
              >
                {testResult.success
                  ? <CheckCircle2 style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                  : <XCircle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                }
                {testResult.success ? "Test SMS sent! Check the recipient's phone." : testResult.error ?? "Failed"}
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-3.5 flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
          <StatusChip on={!!gw?.isActive} />
          <SaveBtn onClick={handleSave} disabled={!form.provider || !form.apiUrl} saved={saved} pending={save.isPending} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Logs ─── */
function LogsTab() {
  const { data: logs = [], isLoading } = useListSmsLogs({ limit: 200 });
  return (
    <div className="space-y-4">
      <SectionCard title="Delivery Logs" subtitle="All notification attempts across WhatsApp and SMS" icon={Clock}>
        {isLoading ? (
          <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-3 animate-pulse">
                <div className="h-5 w-5 rounded-full shrink-0" style={{ background: "#F1F5F9" }} />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="h-3 rounded-full w-40" style={{ background: "#F1F5F9" }} />
                  <div className="h-2.5 rounded-full w-60" style={{ background: "#F1F5F9" }} />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold" style={{ color: HEAD }}>No logs yet</p>
            <p className="text-xs mt-1" style={{ color: MUTED }}>Notifications appear here after biometric scans</p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => (
              <div key={log.id} className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: i < logs.length - 1 ? `1px solid #F1F5F9` : "none" }}>
                {log.status === "sent"
                  ? <CheckCircle2 style={{ width: 15, height: 15, color: "#16A34A", flexShrink: 0 }} />
                  : log.status === "failed"
                  ? <XCircle style={{ width: 15, height: 15, color: "#EF4444", flexShrink: 0 }} />
                  : <Clock style={{ width: 15, height: 15, color: ACCENT, flexShrink: 0 }} />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate" style={{ color: HEAD }}>{log.studentName ?? "Unknown"}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={log.status === "sent"
                        ? { background: "#DCFCE7", color: "#15803D" }
                        : log.status === "failed"
                        ? { background: "#FFF1F2", color: "#BE123C" }
                        : { background: "#FEF3C7", color: "#92400E" }
                      }
                    >
                      {log.status === "sent" ? "Delivered" : log.status === "failed" ? "Failed" : "Pending"}
                    </span>
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: MUTED }}>{log.message}</p>
                  {log.errorMessage && <p className="text-xs truncate" style={{ color: "#EF4444" }}>{log.errorMessage}</p>}
                  <p className="text-xs" style={{ color: "#94A3B8" }}>→ {log.guardianPhone}</p>
                </div>
                <span className="text-xs shrink-0 font-medium" style={{ color: MUTED }}>{format(new Date(log.sentAt), "MMM d, h:mm a")}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ─── Page ─── */
export default function SmsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[24px] font-bold" style={{ color: HEAD }}>Integration</h1>
        <p className="text-[13px] mt-0.5 font-medium" style={{ color: MUTED }}>Connect WhatsApp and SMS gateways for guardian notifications</p>
      </div>

      <div className="flex items-start gap-3 px-5 py-3.5 rounded-2xl" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
        <Info style={{ width: 15, height: 15, color: "#4338CA", flexShrink: 0, marginTop: 1 }} />
        <span className="text-sm" style={{ color: "#3730A3" }}>
          <strong>Priority:</strong> WhatsApp (UltraMsg) is tried first when active. Falls back to SMS automatically if inactive or failed.
        </span>
      </div>

      <Tabs defaultValue="templates">
        <TabsList className="h-10 bg-white gap-1 p-1 rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
          {[
            { value: "templates", label: "Message Templates", icon: FileText },
            { value: "whatsapp", label: "WhatsApp", icon: Smartphone },
            { value: "sms", label: "SMS", icon: MessageSquare },
            { value: "logs", label: "Delivery Logs", icon: Clock },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-lg text-sm font-semibold gap-1.5 px-4 data-[state=active]:shadow-none"
              style={{ height: 32 }}
            >
              <Icon style={{ width: 13, height: 13 }} /> {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="templates" className="mt-5"><MessageTemplatesTab /></TabsContent>
        <TabsContent value="whatsapp" className="mt-5"><WhatsappTab /></TabsContent>
        <TabsContent value="sms" className="mt-5"><SmsTab /></TabsContent>
        <TabsContent value="logs" className="mt-5"><LogsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

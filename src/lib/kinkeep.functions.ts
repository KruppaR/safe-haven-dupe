import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { triage } from "./triage/rules";

// ---------- Schemas ----------
const CreateElderInput = z.object({
  display_name: z.string().min(1).max(80),
  relationship: z.string().min(1).max(40),
  phone: z.string().max(40).optional().nullable(),
  consent_acknowledged: z.literal(true),
});

const ElderIdInput = z.object({ elder_id: z.string().uuid() });
const ToggleMonitorInput = z.object({
  elder_id: z.string().uuid(),
  kind: z.enum(["calls_sms", "financial", "identity"]),
  enabled: z.boolean(),
});
const ResolveAlertInput = z.object({ alert_id: z.string().uuid() });
const TriageInput = z.object({
  input_text: z.string().min(1).max(8000),
  elder_id: z.string().uuid().optional().nullable(),
});

// ---------- Seed helpers ----------
type SeedAlert = {
  severity: "info" | "watch" | "urgent";
  category: "scam_call" | "suspicious_transaction" | "identity" | "forwarded_message";
  title: string;
  detail: string;
  source_excerpt?: string;
  suggested_action?: string;
  minutes_ago: number;
};

const SEED_ALERTS: SeedAlert[] = [
  {
    severity: "info",
    category: "scam_call",
    title: "Blocked spam call from 'Auto Warranty'",
    detail: "Pattern matches a known robocall campaign. Call was silenced — no action needed.",
    source_excerpt: "+1 (888) 555-0142",
    suggested_action: "No action needed. We'll keep blocking these automatically.",
    minutes_ago: 90,
  },
  {
    severity: "watch",
    category: "suspicious_transaction",
    title: "$420 charge at unfamiliar merchant",
    detail: "First-time merchant 'NORTON-LIFELOCK-RENEW' charged $420.00 — higher than her usual antivirus renewal.",
    source_excerpt: "Visa ending 4412 · NORTON-LIFELOCK-RENEW",
    suggested_action: "Confirm with her before reporting. Real Norton renewals are usually $79–$149.",
    minutes_ago: 360,
  },
  {
    severity: "info",
    category: "forwarded_message",
    title: "Suspicious text forwarded to lifeline",
    detail: "She forwarded a USPS 'undelivered package' text. We classified it as a phishing attempt and replied to her with a safe answer.",
    source_excerpt: "USPS: Your package is on hold. Update address: usps-redelivery[.]top/x",
    suggested_action: "Already handled. Good moment to praise her for forwarding it.",
    minutes_ago: 1440,
  },
];

// ---------- Server functions ----------

export const listElders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("elders")
      .select("id, display_name, relationship, phone, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { elders: data ?? [] };
  });

export const getElder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ElderIdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: elder, error } = await context.supabase
      .from("elders")
      .select("*")
      .eq("id", data.elder_id)
      .single();
    if (error || !elder) throw new Error(error?.message ?? "Not found");

    const [{ data: monitors }, { data: alerts }] = await Promise.all([
      context.supabase.from("monitors").select("*").eq("elder_id", elder.id),
      context.supabase
        .from("alerts")
        .select("*")
        .eq("elder_id", elder.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return { elder, monitors: monitors ?? [], alerts: alerts ?? [] };
  });

export const createElder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CreateElderInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: elder, error } = await context.supabase
      .from("elders")
      .insert({
        caregiver_id: context.userId,
        display_name: data.display_name,
        relationship: data.relationship,
        phone: data.phone ?? null,
      })
      .select()
      .single();
    if (error || !elder) throw new Error(error?.message ?? "Failed to create");

    // Seed monitors
    await context.supabase.from("monitors").insert([
      { elder_id: elder.id, kind: "calls_sms", enabled: true, status: "active" },
      { elder_id: elder.id, kind: "financial", enabled: true, status: "setup_needed" },
      { elder_id: elder.id, kind: "identity", enabled: true, status: "active" },
    ]);

    // Seed believable alert history
    const now = Date.now();
    await context.supabase.from("alerts").insert(
      SEED_ALERTS.map((a) => ({
        elder_id: elder.id,
        severity: a.severity,
        category: a.category,
        title: a.title,
        detail: a.detail,
        source_excerpt: a.source_excerpt ?? null,
        suggested_action: a.suggested_action ?? null,
        created_at: new Date(now - a.minutes_ago * 60_000).toISOString(),
      })),
    );

    return { elder };
  });

export const toggleMonitor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ToggleMonitorInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("monitors")
      .update({ enabled: data.enabled, status: data.enabled ? "active" : "paused" })
      .eq("elder_id", data.elder_id)
      .eq("kind", data.kind);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("alerts")
      .select("*, elders!inner(id, display_name, caregiver_id)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { alerts: data ?? [] };
  });

export const resolveAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ResolveAlertInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("alerts")
      .update({ resolved_at: new Date().toISOString() })
      .eq("id", data.alert_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SCENARIOS = [
  {
    severity: "urgent" as const,
    category: "suspicious_transaction" as const,
    title: "Attempted $1,500 wire to a new payee",
    detail: "An outbound wire to 'EMERGENCY ASSISTANCE LLC' (added 8 minutes ago) was initiated from her checking account. This pattern matches grandparent-scam victimization.",
    source_excerpt: "Wire · $1,500.00 · EMERGENCY ASSISTANCE LLC (added today)",
    suggested_action: "Call her now. Ask if anyone — a grandchild, lawyer, or officer — told her to send money urgently.",
  },
  {
    severity: "urgent" as const,
    category: "scam_call" as const,
    title: "23-minute call from suspected scam number",
    detail: "Call from a spoofed 'Social Security Administration' number lasted 23 minutes. SSA numbers don't spoof outbound. Likely an active scam in progress.",
    source_excerpt: "(800) 772-1213 · 23m 14s",
    suggested_action: "Call her right now on her own line. Don't text — text can be monitored if her phone is compromised.",
  },
  {
    severity: "watch" as const,
    category: "suspicious_transaction" as const,
    title: "$500 in gift cards at CVS",
    detail: "Three $100 + two $100 Apple gift cards purchased at CVS on Elm St — first gift-card purchase in 18 months.",
    source_excerpt: "Visa ending 4412 · CVS #4421 · 5x APPLE GIFT $100",
    suggested_action: "Gift cards are the #1 scam payment rail. Ask gently what they're for before she scratches off the codes.",
  },
];

export const simulateScamAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ElderIdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: elder } = await context.supabase
      .from("elders")
      .select("id")
      .eq("id", data.elder_id)
      .single();
    if (!elder) throw new Error("Elder not found");

    const pick = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    const { data: alert, error } = await context.supabase
      .from("alerts")
      .insert({ elder_id: elder.id, ...pick })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { alert };
  });

export const runTriage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => TriageInput.parse(d))
  .handler(async ({ data, context }) => {
    const result = triage(data.input_text);
    const { data: row, error } = await context.supabase
      .from("triage_checks")
      .insert({
        caregiver_id: context.userId,
        elder_id: data.elder_id ?? null,
        input_text: data.input_text,
        verdict: result.verdict,
        confidence: result.confidence,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signals: result.signals as any,
        recommendation: result.recommendation,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { result, check_id: row.id };
  });

export const dashboardSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: elders }, { data: alerts }] = await Promise.all([
      context.supabase.from("elders").select("id, display_name, relationship"),
      context.supabase
        .from("alerts")
        .select("id, severity, category, title, created_at, resolved_at, elder_id")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    const open = (alerts ?? []).filter((a) => !a.resolved_at);
    const urgent = open.filter((a) => a.severity === "urgent").length;
    return {
      elders: elders ?? [],
      recent_alerts: alerts ?? [],
      open_count: open.length,
      urgent_count: urgent,
    };
  });

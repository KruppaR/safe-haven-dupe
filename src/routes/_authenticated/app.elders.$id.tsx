import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { getElder, toggleMonitor, simulateScamAttempt, resolveAlert } from "@/lib/kinkeep.functions";
import { connectMockBank, getElderFinancialData, simulateSuspiciousTransaction } from "@/lib/plaid.functions";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SeverityBadge } from "@/components/severity-badge";
import { PhoneOff, CreditCard, ShieldCheck, Sparkles, Check, ArrowLeft, Landmark, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const elderQuery = (id: string) =>
  queryOptions({
    queryKey: ["elder", id],
    queryFn: () => getElder({ data: { elder_id: id } }),
  });

const financialQuery = (id: string) =>
  queryOptions({
    queryKey: ["elder-financial", id],
    queryFn: () => getElderFinancialData({ data: { elder_id: id } }),
  });

export const Route = createFileRoute("/_authenticated/app/elders/$id")({
  loader: ({ params, context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(elderQuery(params.id)),
      context.queryClient.ensureQueryData(financialQuery(params.id)),
    ]),
  component: ElderPage,
});

const KIND_META = {
  calls_sms: { label: "Calls & texts", icon: PhoneOff, blurb: "Scam call blocking · phishing text detection" },
  financial: { label: "Money", icon: CreditCard, blurb: "Read-only bank watch · gift card & wire alerts" },
  identity: { label: "Identity", icon: ShieldCheck, blurb: "SSN & credit monitoring · one-tap lockdown" },
} as const;

function formatCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function ElderPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(elderQuery(id));
  const { elder, monitors, alerts } = data;
  const { data: financialData } = useSuspenseQuery(financialQuery(id));
  const queryClient = useQueryClient();

  const toggleFn = useServerFn(toggleMonitor);
  const simFn = useServerFn(simulateScamAttempt);
  const resolveFn = useServerFn(resolveAlert);
  const connectFn = useServerFn(connectMockBank);
  const simTxnFn = useServerFn(simulateSuspiciousTransaction);

  const toggleM = useMutation({
    mutationFn: toggleFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["elder", id] }),
  });
  const simM = useMutation({
    mutationFn: simFn,
    onSuccess: () => {
      toast.success("Simulated scam attempt triggered.", { description: "Check the alert feed below." });
      queryClient.invalidateQueries({ queryKey: ["elder", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
  const resolveM = useMutation({
    mutationFn: resolveFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["elder", id] }),
  });
  const connectM = useMutation({
    mutationFn: connectFn,
    onSuccess: () => {
      toast.success("Bank connected.", { description: "We're now monitoring transactions." });
      queryClient.invalidateQueries({ queryKey: ["elder-financial", id] });
      queryClient.invalidateQueries({ queryKey: ["elder", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
  const simTxnM = useMutation({
    mutationFn: simTxnFn,
    onSuccess: (result) => {
      if (result.alert) {
        toast.success("Suspicious transaction generated.", { description: result.alert.title });
      } else {
        toast.success("Transaction generated — no alert triggered.");
      }
      queryClient.invalidateQueries({ queryKey: ["elder-financial", id] });
      queryClient.invalidateQueries({ queryKey: ["elder", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const financialMonitor = monitors.find((m) => m.kind === "financial");
  const needsBankSetup = financialMonitor?.status === "setup_needed";

  return (
    <div className="space-y-10">
      <div>
        <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Overview
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {elder.relationship}
            </p>
            <h1 className="mt-1 font-display text-3xl tracking-tight text-foreground">
              {elder.display_name}
            </h1>
            {elder.phone && <p className="mt-1 text-sm text-muted-foreground">{elder.phone}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {financialData?.connected && (
              <Button
                variant="outline"
                onClick={() => simTxnM.mutate({ data: { elder_id: elder.id } })}
                disabled={simTxnM.isPending}
              >
                <AlertTriangle className="mr-2 h-4 w-4 text-watch" />
                Simulate suspicious transaction
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => simM.mutate({ data: { elder_id: elder.id } })}
              disabled={simM.isPending}
            >
              <Sparkles className="mr-2 h-4 w-4 text-gold" />
              Simulate a scam attempt
            </Button>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl text-foreground">Protection layers</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {(["calls_sms", "financial", "identity"] as const).map((kind) => {
            const m = monitors.find((mm) => mm.kind === kind);
            const meta = KIND_META[kind];
            const enabled = m?.enabled ?? false;
            const isFinancial = kind === "financial";
            return (
              <div key={kind} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
                    <meta.icon className="h-4 w-4" />
                  </span>
                  {isFinancial && needsBankSetup ? (
                    <ConnectBankDialog
                      elderId={elder.id}
                      onConnect={(institution) =>
                        connectM.mutate({ data: { elder_id: elder.id, institution_name: institution } })
                      }
                      isConnecting={connectM.isPending}
                    />
                  ) : (
                    <Switch
                      checked={enabled}
                      onCheckedChange={(v) =>
                        toggleM.mutate({ data: { elder_id: elder.id, kind, enabled: v } })
                      }
                    />
                  )}
                </div>
                <p className="mt-4 font-medium text-foreground">{meta.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{meta.blurb}</p>
                {isFinancial && financialData?.connected && financialData.accounts.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {financialData.accounts.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {a.name} ·•••{a.mask}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(a.current_balance ?? 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {m?.status === "active" ? "● Active" : m?.status === "setup_needed" ? "Setup needed" : "Paused"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl text-foreground">Alert history</h2>
        {alerts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No alerts yet for {elder.display_name}.
          </p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li key={a.id} className={`rounded-2xl border bg-card p-5 ${a.severity === "urgent" && !a.resolved_at ? "border-urgent/40" : "border-border"}`}>
                <div className="flex items-start gap-3">
                  <SeverityBadge severity={a.severity as any} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{a.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
                    {a.source_excerpt && (
                      <p className="mt-2 rounded-md bg-muted px-3 py-2 text-xs font-mono text-muted-foreground">
                        {a.source_excerpt}
                      </p>
                    )}
                    {a.suggested_action && (
                      <p className="mt-2 text-sm">
                        <span className="font-medium text-foreground">What to do: </span>
                        <span className="text-muted-foreground">{a.suggested_action}</span>
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                        {a.resolved_at ? " · resolved" : ""}
                      </p>
                      {!a.resolved_at && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resolveM.mutate({ data: { alert_id: a.id } })}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Mark resolved
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {financialData?.connected && (
        <section>
          <h2 className="mb-3 font-display text-xl text-foreground">Recent transactions</h2>
          {financialData.transactions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No transactions yet. The sync runs every 15 minutes.
            </p>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {financialData.transactions.map((t: any) => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{t.date}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{t.name}</p>
                        {t.merchant_name && t.merchant_name !== t.name && (
                          <p className="text-xs text-muted-foreground">{t.merchant_name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ConnectBankDialog({
  elderId,
  onConnect,
  isConnecting,
}: {
  elderId: string;
  onConnect: (institution: string) => void;
  isConnecting: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);

  const institutions = [
    { name: "Chase", id: "ins_1" },
    { name: "Bank of America", id: "ins_2" },
    { name: "Wells Fargo", id: "ins_3" },
    { name: "Citibank", id: "ins_4" },
    { name: "PNC", id: "ins_5" },
    { name: "U.S. Bank", id: "ins_6" },
  ];

  function handleConnect() {
    if (!selected) return;
    onConnect(selected);
    setOpen(false);
    setSelected(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Landmark className="mr-1.5 h-3.5 w-3.5" />
          Connect bank
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Connect a bank account</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Choose the institution for {elderId ? "this person" : "them"}. This is a demo connection — no real credentials needed.
        </p>
        <div className="grid gap-2">
          {institutions.map((inst) => (
            <button
              key={inst.id}
              onClick={() => setSelected(inst.name)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                selected === inst.name
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{inst.name}</span>
              {selected === inst.name && <Check className="ml-auto h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
        <Button onClick={handleConnect} disabled={!selected || isConnecting}>
          {isConnecting ? "Connecting…" : "Connect"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

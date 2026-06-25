import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAlerts, resolveAlert } from "@/lib/kinkeep.functions";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/severity-badge";
import { Check, Phone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const q = () => queryOptions({ queryKey: ["alerts"], queryFn: () => listAlerts() });

export const Route = createFileRoute("/_authenticated/app/alerts")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q()),
  component: Alerts,
});

function Alerts() {
  const { data } = useSuspenseQuery(q());
  const queryClient = useQueryClient();
  const resolveFn = useServerFn(resolveAlert);
  const m = useMutation({
    mutationFn: resolveFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const open = data.alerts.filter((a: any) => !a.resolved_at);
  const resolved = data.alerts.filter((a: any) => a.resolved_at);

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Alerts</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-foreground">
          Everything that needs you, in one place.
        </h1>
      </header>

      <Section title="Open" alerts={open} onResolve={(id) => m.mutate({ data: { alert_id: id } })} />
      <Section title="Resolved" alerts={resolved} muted />
    </div>
  );
}

function Section({ title, alerts, onResolve, muted }: { title: string; alerts: any[]; onResolve?: (id: string) => void; muted?: boolean }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-xl text-foreground">
        {title} <span className="text-sm font-normal text-muted-foreground">· {alerts.length}</span>
      </h2>
      {alerts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Nothing here.
        </p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li key={a.id} className={`rounded-2xl border bg-card p-5 ${a.severity === "urgent" && !a.resolved_at ? "border-urgent/40" : "border-border"} ${muted ? "opacity-70" : ""}`}>
              <div className="flex items-start gap-3">
                <SeverityBadge severity={a.severity} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="font-medium text-foreground">{a.title}</p>
                    {a.elders?.display_name && (
                      <Link to="/app/elders/$id" params={{ id: a.elders.id }} className="text-xs text-primary hover:underline">
                        {a.elders.display_name}
                      </Link>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
                  {a.suggested_action && (
                    <p className="mt-2 text-sm"><span className="font-medium text-foreground">What to do: </span><span className="text-muted-foreground">{a.suggested_action}</span></p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</p>
                    {onResolve && (
                      <div className="flex gap-2">
                        {a.severity === "urgent" && (
                          <Button size="sm" variant="outline">
                            <Phone className="mr-1 h-3.5 w-3.5" /> Call now
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => onResolve(a.id)}>
                          <Check className="mr-1 h-3.5 w-3.5" /> Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

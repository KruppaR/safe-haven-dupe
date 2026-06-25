import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { dashboardSummary } from "@/lib/kinkeep.functions";
import { Bell, Plus, ShieldCheck, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SeverityBadge } from "@/components/severity-badge";

const summaryQuery = () =>
  queryOptions({
    queryKey: ["dashboard-summary"],
    queryFn: () => dashboardSummary(),
  });

export const Route = createFileRoute("/_authenticated/app/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(summaryQuery()),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useSuspenseQuery(summaryQuery());
  const { elders, recent_alerts, open_count, urgent_count } = data;

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Overview
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-foreground">
          {urgent_count > 0
            ? "Something needs your attention."
            : open_count > 0
              ? "A few things to look at."
              : "Everything looks calm."}
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={ShieldCheck} label="Protected" value={String(elders.length)} hint="people on Kinkeep" />
        <Stat icon={Bell} label="Open alerts" value={String(open_count)} hint="across all elders" />
        <Stat icon={AlertTriangle} label="Urgent" value={String(urgent_count)} hint="needs you now" urgent={urgent_count > 0} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-foreground">Who you're protecting</h2>
          <Link to="/app/elders/new" className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> Add a person
          </Link>
        </div>
        {elders.length === 0 ? (
          <EmptyElders />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {elders.map((e) => (
              <Link
                key={e.id}
                to="/app/elders/$id"
                params={{ id: e.id }}
                className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-soft"
              >
                <div>
                  <p className="font-display text-lg text-foreground">{e.display_name}</p>
                  <p className="text-sm text-muted-foreground">{e.relationship}</p>
                </div>
                <span className="text-xs text-primary opacity-0 transition group-hover:opacity-100">View →</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-foreground">Recent activity</h2>
          <Link to="/app/alerts" className="text-sm text-primary hover:underline">All alerts →</Link>
        </div>
        {recent_alerts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
            Nothing yet. When something happens, it'll show up here.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {recent_alerts.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-start gap-3 p-4">
                <SeverityBadge severity={a.severity as any} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    {a.resolved_at ? " · resolved" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint, urgent }: { icon: typeof Bell; label: string; value: string; hint: string; urgent?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-card p-5 ${urgent ? "border-urgent/40" : "border-border"}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${urgent ? "text-urgent" : ""}`} />
        {label}
      </div>
      <p className={`mt-3 font-display text-3xl ${urgent ? "text-urgent" : "text-foreground"}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function EmptyElders() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <h3 className="font-display text-xl text-foreground">Start by adding the person you want to protect.</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        A parent, aunt, uncle, or grandparent. We'll walk you through the consent conversation.
      </p>
      <Link to="/app/elders/new" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        <Plus className="h-4 w-4" /> Add a person
      </Link>
    </div>
  );
}

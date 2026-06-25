import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Kinkeep Pricing — From $19/month" },
      { name: "description", content: "Solo at $19/mo. Family at $29/mo. 14-day trial, no card required to start." },
      { property: "og:title", content: "Kinkeep Pricing" },
      { property: "og:description", content: "Honest pricing for quiet protection. Solo $19/mo. Family $29/mo." },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-20">
        <h1 className="text-center font-display text-4xl tracking-tight text-foreground">
          Less than your streaming bundle.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          One price covers all three protection layers and the lifeline.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card name="Solo" price="$19" tagline="One person.">
            {["All three protection layers", "Suspicious-message triage line", "Real-person help when something fires"].map((f) => <li key={f}>{f}</li>)}
          </Card>
          <Card name="Family" highlight price="$29" tagline="Two people, up to 3 caregivers.">
            {["Everything in Solo, ×2 elders", "Shared alert feed across siblings", "Quarterly safety review", "Priority support"].map((f) => <li key={f}>{f}</li>)}
          </Card>
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Need this for a credit union, employer, or Medicare Advantage plan?{" "}
          <a className="text-primary underline-offset-4 hover:underline" href="mailto:partners@kinkeep.app">
            Talk to us about partnerships.
          </a>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({ name, price, tagline, children, highlight }: { name: string; price: string; tagline: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-8 ${highlight ? "border-primary bg-primary text-primary-foreground shadow-card" : "border-border bg-card shadow-soft"}`}>
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl">{name}</h2>
        <p className="text-3xl font-medium">{price}<span className={`text-sm ${highlight ? "opacity-80" : "text-muted-foreground"}`}>/mo</span></p>
      </div>
      <p className={`mt-2 text-sm ${highlight ? "opacity-90" : "text-muted-foreground"}`}>{tagline}</p>
      <ul className="mt-6 space-y-3 text-sm [&>li]:flex [&>li]:items-start [&>li]:gap-2 [&>li]:before:content-none">
        {Array.isArray(children) ? children.map((c, i) => (
          <li key={i}><CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${highlight ? "" : "text-primary"}`} />{c}</li>
        )) : children}
      </ul>
      <Link to="/auth" search={{ mode: "signup" }} className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition ${highlight ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90" : "bg-foreground text-background hover:bg-foreground/90"}`}>
        Start a 14-day trial
      </Link>
    </div>
  );
}

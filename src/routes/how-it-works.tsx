import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Kinkeep works — Quiet protection for elderly family members" },
      {
        name: "description",
        content:
          "A walkthrough of how Kinkeep protects an elder's calls, money, and identity — without asking them to learn anything new.",
      },
      { property: "og:title", content: "How Kinkeep works" },
      { property: "og:description", content: "Three quiet layers that protect your family member without changing how they live." },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="font-display text-4xl tracking-tight text-foreground">How Kinkeep works</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Five minutes of setup from you. A lifetime of less worry.
        </p>

        <Step n={1} title="You create your account.">
          A normal email signup — yours, not theirs. Takes a minute.
        </Step>
        <Step n={2} title="You add your family member with their consent.">
          We ask you to confirm you've talked to them. This isn't surveillance — it's a service
          the family agrees to together. We send you a one-page handout to walk them through it.
        </Step>
        <Step n={3} title="We turn on the three protection layers.">
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><span className="font-medium text-foreground">Calls &amp; texts</span> — known scam numbers get silenced; phishing texts get flagged before they're read.</li>
            <li><span className="font-medium text-foreground">Money</span> — a read-only connection to their bank watches for the patterns of elder fraud (gift cards, wires to new payees, crypto, unusual withdrawals).</li>
            <li><span className="font-medium text-foreground">Identity</span> — SSN, email, and account monitoring with one-tap lockdowns.</li>
          </ul>
        </Step>
        <Step n={4} title="They get one phone number.">
          The lifeline. They can forward a suspicious voicemail or text — before they reply — and
          we'll tell them in plain English whether it's safe. They don't have to remember anything
          else.
        </Step>
        <Step n={5} title="You get a calm dashboard. They notice fewer scam calls.">
          Most days, nothing happens. When something does, you get a notification with context and
          a clear next step. You make the call. The scammer loses.
        </Step>
      </main>
      <SiteFooter />
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 rounded-2xl border border-border bg-card p-8 shadow-soft">
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {n}
        </div>
        <div>
          <h2 className="font-display text-xl text-foreground">{title}</h2>
          <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </div>
      </div>
    </section>
  );
}

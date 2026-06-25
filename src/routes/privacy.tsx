import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & Dignity — Kinkeep" },
      { name: "description", content: "What Kinkeep watches, what it doesn't, and the principles that govern how we treat your family member's data." },
      { property: "og:title", content: "Privacy & Dignity — Kinkeep" },
      { property: "og:description", content: "We watch for harm, not for everything. Read our consent-first principles." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20 prose prose-neutral">
        <h1 className="font-display text-4xl tracking-tight text-foreground">Privacy &amp; dignity</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The hardest part of building Kinkeep isn't the detection. It's making sure this never
          feels like surveillance of a loved one. These principles guide every decision we make.
        </p>

        <Principle title="Consent comes first.">
          Adding a family member requires you to confirm you've talked to them. We provide language and a
          handout to make that conversation easy. No setup happens behind their back.
        </Principle>
        <Principle title="We watch for harm, not for everything.">
          We do not store call recordings, message contents, or transaction streams. We watch for
          specific patterns of victimization — and only show you flagged events, with context.
        </Principle>
        <Principle title="They can pause us anytime.">
          One number, one message: "pause." Everything stops. They are always in control.
        </Principle>
        <Principle title="We do not sell data. Ever.">
          Not to advertisers, data brokers, or anyone else. Our business model is the subscription
          you pay, and partnerships with banks and Medicare plans who pay us to protect their
          members.
        </Principle>
        <Principle title="Security you'd expect of a bank.">
          Bank connections are read-only and tokenized through Plaid. Identity data is encrypted
          at rest. We pass the same audits financial-services partners require.
        </Principle>

        <p className="mt-12 text-sm text-muted-foreground">
          Questions? Write to <a className="text-primary" href="mailto:privacy@kinkeep.app">privacy@kinkeep.app</a>.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function Principle({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-6 not-prose">
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}

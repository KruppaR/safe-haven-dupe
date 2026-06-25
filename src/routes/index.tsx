import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import {
  PhoneOff,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Quote,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kinkeep — Quietly protect the people who raised you" },
      {
        name: "description",
        content:
          "Kinkeep watches your elderly family member's calls, money, and identity for scam patterns — and alerts you, not them. You set it up. They just live their life.",
      },
      { property: "og:title", content: "Kinkeep — Quietly protect the people who raised you" },
      {
        property: "og:description",
        content:
          "Caregiver-operated scam protection for aging parents. Dignified by design.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <Thesis />
      <HowItWorks />
      <Quotes />
      <Pricing />
      <FAQ />
      <CTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-parchment to-background" />
      <div className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          For family caregivers
        </p>
        <h1 className="mt-6 font-display text-4xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
          Watch over the people<br />who watched over you.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Kinkeep quietly protects your elderly family member from the calls, texts, and transactions that
          target older adults. You set it up once. They notice fewer scam calls — and you sleep
          a little easier.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition hover:bg-primary/90"
          >
            Start your 14-day trial <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            See how it works
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No card to start. Cancel anytime.
        </p>
      </div>
    </section>
  );
}

function Thesis() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="rounded-2xl border border-border bg-card p-10 shadow-card">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">The core idea</p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground">
          The elder is the protected, not the user.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Most safety apps fail because they ask the most vulnerable person to operate the tool.
          We flip it. You — the worried family member — set Kinkeep up. Your family member does
          nothing different. They just notice fewer scam calls, and occasionally hear from you:
          <span className="text-foreground"> "Hey, don't pay that — it's a scam."</span>
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  const layers = [
    {
      icon: PhoneOff,
      title: "Calls & texts",
      body:
        "A silent screening layer flags or blocks known scam calls and phishing texts before they reach your family member. No app for them to learn.",
    },
    {
      icon: CreditCard,
      title: "Money",
      body:
        "A read-only connection to their bank watches for the patterns of elder fraud — sudden gift cards, wire transfers to new payees, crypto, unusual withdrawals. Alerts come to you.",
    },
    {
      icon: ShieldCheck,
      title: "Identity",
      body:
        "Continuous monitoring of their SSN, email, and accounts. Lockdowns and credit freezes are one tap away — handled on their behalf.",
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 text-center">
        <h2 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
          Three layers of quiet protection.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Each layer protects at a level that doesn't require your family member to change anything
          about how they live.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {layers.map((l) => (
          <div key={l.title} className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
              <l.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-xl text-foreground">{l.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 rounded-2xl border border-dashed border-primary/40 bg-secondary/40 p-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          The one thing we ask of them
        </p>
        <h3 className="mt-2 font-display text-2xl text-foreground">
          "Check this for me."
        </h3>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          A single phone number they can forward a suspicious text or voicemail to — before they
          act. Dead simple. Often the only interaction they'll ever have with Kinkeep.
        </p>
      </div>
    </section>
  );
}

function Quotes() {
  return (
    <section className="bg-parchment/60 py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-2xl border border-border bg-card p-10 shadow-soft">
          <Quote className="h-6 w-6 text-primary" />
          <p className="mt-4 font-display text-2xl leading-relaxed text-foreground">
            "They almost wired $4,000 to someone claiming to be their grandson. Kinkeep caught it
            and called me before the wire cleared. I don't know how to thank a piece of
            software, but here we are."
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            — Caregiver, Phoenix AZ · Beta user since March
          </p>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-5xl px-6 py-20">
      <div className="mb-12 text-center">
        <h2 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
          Simple, honest pricing.
        </h2>
        <p className="mt-3 text-muted-foreground">14 days free. No card required to start.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <PriceCard
          name="Solo"
          price="$19"
          tagline="Protect one person."
          features={[
            "Calls & texts screening",
            "Bank & card monitoring",
            "Identity & credit watch",
            "Suspicious-message triage line",
            "Real-person help when an alert fires",
          ]}
        />
        <PriceCard
          name="Family"
          highlight
          price="$29"
          tagline="Protect two people and loop in family."
          features={[
            "Everything in Solo, for two elders",
            "Up to 3 caregivers on one account",
            "Shared alert feed across siblings",
            "Quarterly safety review with a specialist",
          ]}
        />
      </div>
    </section>
  );
}

function PriceCard({
  name,
  price,
  tagline,
  features,
  highlight,
}: {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-8 ${
        highlight
          ? "border-primary bg-primary text-primary-foreground shadow-card"
          : "border-border bg-card shadow-soft"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-2xl">{name}</h3>
        <p className="text-3xl font-medium">
          {price}
          <span className={`text-sm ${highlight ? "opacity-80" : "text-muted-foreground"}`}>/mo</span>
        </p>
      </div>
      <p className={`mt-2 text-sm ${highlight ? "opacity-90" : "text-muted-foreground"}`}>
        {tagline}
      </p>
      <ul className="mt-6 space-y-3 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${highlight ? "" : "text-primary"}`} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/auth"
        search={{ mode: "signup" }}
        className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition ${
          highlight
            ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            : "bg-foreground text-background hover:bg-foreground/90"
        }`}
      >
        Start protecting
      </Link>
    </div>
  );
}

function FAQ() {
  const items = [
    {
      q: "Will they know I'm doing this?",
      a: "Yes — and they should. Kinkeep is built around consent. The setup asks you to confirm you've talked to them. This isn't surveillance; it's a thoughtful service the family agrees to together.",
    },
    {
      q: "What do they actually have to do?",
      a: "Almost nothing. Optionally, they can forward a suspicious text or voicemail to a single Kinkeep number before they reply. That's it.",
    },
    {
      q: "Do you read all their messages or transactions?",
      a: "No. We watch for specific patterns of victimization — gift-card spikes, wires to new payees, known scam-call fingerprints. You only see flagged events, not their daily life.",
    },
    {
      q: "What about false alarms?",
      a: "Distinguishing a real scam from \"Grandma actually wanted to send her grandson money\" is hard — and it's exactly what we obsess over. You'll see context with every alert, and a one-tap dismiss.",
    },
  ];
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-center font-display text-3xl tracking-tight text-foreground md:text-4xl">
        Honest answers.
      </h2>
      <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
        {items.map((it) => (
          <details key={it.q} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-left">
              <span className="font-medium text-foreground">{it.q}</span>
              <span className="text-muted-foreground transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20 text-center">
      <h2 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
        You can't be there every minute. We can.
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
        Set Kinkeep up in five minutes. We'll quietly watch over them in the background.
      </p>
      <div className="mt-8">
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition hover:bg-primary/90"
        >
          Start your 14-day trial <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

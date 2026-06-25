import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/lifeline")({
  component: Lifeline,
});

function Lifeline() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Lifeline</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-foreground">
          The one thing we ask of them.
        </h1>
        <p className="mt-2 text-muted-foreground">
          A single number to forward anything suspicious — before they reply, click, or pay.
          Print the card below and put it on their fridge.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
        <div className="grid gap-6 sm:grid-cols-2">
          <Channel icon={Phone} label="Forward by call or text" value="(855) KIN-KEEP" sub="(855) 546-5337" />
          <Channel icon={Mail} label="Or forward by email" value="check@kinkeep.app" sub="Forward any suspicious email here" />
        </div>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-parchment p-8 print:border-none print:bg-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">For your fridge</p>
        <h2 className="mt-3 font-display text-3xl text-foreground">
          Got a strange text, call, or email?
        </h2>
        <p className="mt-3 text-lg text-foreground">
          Before you reply, click, or pay anything — <span className="font-medium">forward it to Kinkeep</span>.
          We'll text you back in plain English and tell you if it's safe.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-background p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Text or forward to</p>
            <p className="mt-1 font-display text-2xl text-foreground">(855) 546-5337</p>
          </div>
          <div className="rounded-xl bg-background p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Or email</p>
            <p className="mt-1 font-display text-2xl text-foreground">check@kinkeep.app</p>
          </div>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          If it turns out to be a scam, we'll let your family know too — so they can give you a
          call.
        </p>
        <div className="mt-6 flex justify-end print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print this card
          </Button>
        </div>
      </div>
    </div>
  );
}

function Channel({ icon: Icon, label, value, sub }: { icon: typeof Phone; label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-2 font-display text-2xl text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

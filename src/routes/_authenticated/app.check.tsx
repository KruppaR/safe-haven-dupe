import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { runTriage } from "@/lib/kinkeep.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/check")({
  component: Check,
});

function Check() {
  const triageFn = useServerFn(runTriage);
  const [text, setText] = useState("");
  const m = useMutation({ mutationFn: triageFn });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Triage</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-foreground">
          Check a suspicious message.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Paste a text, email, or voicemail transcript they received. We'll tell you what
          we see, and give you a script for the conversation.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          m.mutate({ data: { input_text: text } });
        }}
        className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
      >
        <div>
          <Label htmlFor="msg">The message</Label>
          <Textarea
            id="msg"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Example:\n"This is the IRS. You owe $2,400 in back taxes. To avoid arrest, purchase $500 in Apple gift cards and call us back immediately."`}
            className="font-mono text-sm"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => { setText(""); m.reset(); }}>Clear</Button>
          <Button type="submit" disabled={m.isPending || !text.trim()}>
            {m.isPending ? "Analyzing..." : "Analyze"}
          </Button>
        </div>
      </form>

      {m.data && <Result result={m.data.result} />}
    </div>
  );
}

function Result({ result }: { result: { verdict: "safe" | "suspicious" | "scam"; confidence: number; signals: any[]; recommendation: string } }) {
  const cfg = {
    safe: { Icon: ShieldCheck, label: "Looks safe", tone: "border-primary/40 bg-secondary/40 text-foreground", accent: "text-primary" },
    suspicious: { Icon: AlertTriangle, label: "Suspicious — be careful", tone: "border-gold/50 bg-gold/15 text-foreground", accent: "text-gold-foreground" },
    scam: { Icon: ShieldAlert, label: "This is almost certainly a scam", tone: "border-urgent/40 bg-urgent/10 text-foreground", accent: "text-urgent" },
  }[result.verdict];

  return (
    <div className={`rounded-2xl border p-6 ${cfg.tone}`}>
      <div className="flex items-center gap-3">
        <cfg.Icon className={`h-6 w-6 ${cfg.accent}`} />
        <div>
          <p className={`font-display text-xl ${cfg.accent}`}>{cfg.label}</p>
          <p className="text-xs text-muted-foreground">Confidence {result.confidence}/100</p>
        </div>
      </div>

      {result.signals.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">What we saw</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {result.signals.map((s) => (
              <li key={s.id} className="rounded-full bg-background px-3 py-1 text-xs">
                {s.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Talk to them like this</p>
        <p className="mt-2 leading-relaxed text-foreground">{result.recommendation}</p>
      </div>
    </div>
  );
}

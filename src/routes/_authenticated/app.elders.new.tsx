import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { createElder } from "@/lib/kinkeep.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/app/elders/new")({
  component: NewElder,
});

function NewElder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createElderFn = useServerFn(createElder);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Mother");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);

  const m = useMutation({
    mutationFn: createElderFn,
    onSuccess: ({ elder }) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success(`${elder.display_name} is now protected.`);
      navigate({ to: "/app/elders/$id", params: { id: elder.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create"),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Add a person</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-foreground">
        Who would you like to protect?
      </h1>
      <p className="mt-2 text-muted-foreground">
        We'll set up the three protection layers automatically once you finish this short form.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!consent) {
            toast.error("Please confirm they have agreed to this.");
            return;
          }
          m.mutate({ data: { display_name: name, relationship, phone: phone || null, consent_acknowledged: true } });
        }}
        className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-8 shadow-soft"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Their name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Eleanor" />
          </div>
          <div>
            <Label htmlFor="rel">Your relationship</Label>
            <select
              id="rel"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {["Mother", "Father", "Grandmother", "Grandfather", "Aunt", "Uncle", "Other"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="phone">Their phone (optional)</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
          <p className="mt-1 text-xs text-muted-foreground">
            We use this only to associate alerts with the right person.
          </p>
        </div>

        <div className="rounded-xl border border-primary/30 bg-secondary/40 p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} className="mt-0.5" />
            <span className="text-sm text-foreground">
              <span className="font-medium">I've talked to them, and they've agreed.</span>
              <span className="block mt-1 text-muted-foreground">
                Kinkeep only works when it's a service the family agrees to together. We'll
                email you a short handout to share with them.
              </span>
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/app" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={m.isPending}>
            {m.isPending ? "Setting up..." : "Start protecting"}
          </Button>
        </div>
      </form>
    </div>
  );
}

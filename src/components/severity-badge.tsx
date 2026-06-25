type Severity = "info" | "watch" | "urgent";

const styles: Record<Severity, string> = {
  info: "bg-secondary text-secondary-foreground",
  watch: "bg-gold/30 text-gold-foreground",
  urgent: "bg-urgent/15 text-urgent",
};

const labels: Record<Severity, string> = {
  info: "Info",
  watch: "Watching",
  urgent: "Urgent",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`mt-0.5 inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[10px] font-medium uppercase tracking-wider ${styles[severity]}`}>
      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${severity === "urgent" ? "bg-urgent" : severity === "watch" ? "bg-gold" : "bg-primary"}`} />
      {labels[severity]}
    </span>
  );
}

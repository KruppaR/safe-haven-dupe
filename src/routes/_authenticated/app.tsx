import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Home, ShieldCheck, Phone, Search, LogOut, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppShell,
});

function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out.");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-parchment/50 p-6 md:block">
          <Link to="/app" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-display text-xl tracking-tight">Kinkeep</span>
          </Link>
          <nav className="mt-10 flex flex-col gap-1 text-sm">
            <NavItem to="/app" icon={Home} label="Overview" exact />
            <NavItem to="/app/alerts" icon={Bell} label="Alerts" />
            <NavItem to="/app/check" icon={Search} label="Check a message" />
            <NavItem to="/app/lifeline" icon={Phone} label="Lifeline" />
          </nav>
          <div className="mt-10">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Protected
            </p>
            <Link
              to="/app/elders/new"
              className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <Users className="h-4 w-4" /> Add a person
            </Link>
          </div>
          <button
            onClick={signOut}
            className="absolute bottom-6 left-6 right-6 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </aside>
        <main className="flex-1 px-6 py-8 md:px-10 md:py-12">
          <div className="mb-6 flex items-center justify-between md:hidden">
            <Link to="/app" className="font-display text-lg">Kinkeep</Link>
            <button onClick={signOut} className="text-sm text-muted-foreground">Sign out</button>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, exact }: { to: "/app" | "/app/alerts" | "/app/check" | "/app/lifeline"; icon: typeof Home; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-secondary text-foreground" }}
      activeOptions={{ exact }}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

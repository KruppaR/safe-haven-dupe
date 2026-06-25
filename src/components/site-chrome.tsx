import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-xl tracking-tight">Kinkeep</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/how-it-works" className="transition hover:text-foreground">How it works</Link>
          <Link to="/pricing" className="transition hover:text-foreground">Pricing</Link>
          <Link to="/privacy" className="transition hover:text-foreground">Privacy</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="hidden text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition hover:bg-primary/90"
          >
            Start protecting
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-parchment/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 text-sm md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-display text-lg">Kinkeep</span>
          </div>
          <p className="mt-3 max-w-xs text-muted-foreground">
            Quiet protection for the people who raised you.
          </p>
        </div>
        <FooterCol title="Product">
          <Link to="/how-it-works">How it works</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/auth" search={{ mode: "signup" }}>Start a trial</Link>
        </FooterCol>
        <FooterCol title="Company">
          <Link to="/privacy">Privacy &amp; dignity</Link>
          <a href="mailto:hello@kinkeep.app">Contact</a>
        </FooterCol>
        <FooterCol title="For partners">
          <a href="mailto:partners@kinkeep.app">Banks &amp; credit unions</a>
          <a href="mailto:partners@kinkeep.app">Medicare Advantage</a>
        </FooterCol>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Kinkeep, Inc. Made with care.
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">{title}</h4>
      <ul className="mt-3 flex flex-col gap-2 text-muted-foreground [&_a]:transition hover:[&_a]:text-foreground">
        {Array.isArray(children) ? children.map((c, i) => <li key={i}>{c}</li>) : <li>{children}</li>}
      </ul>
    </div>
  );
}

function Logo() {
  return (
    <span
      aria-hidden
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10z" opacity=".25" />
        <path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10z" />
        <circle cx="12" cy="11" r="2" fill="currentColor" />
      </svg>
    </span>
  );
}

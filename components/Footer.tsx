import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold text-foreground">Quick Cart</span>
            <span className="text-sm text-muted-foreground">Plan, track, and checkout smarter.</span>
          </div>

          <nav aria-label="Footer Navigation" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Changelog</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
          </nav>

          <div className="text-sm text-muted-foreground">© {year} Quick Cart. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}



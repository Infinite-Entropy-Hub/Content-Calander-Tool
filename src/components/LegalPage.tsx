import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

type Section = { title: string; content: React.ReactNode };

export function LegalPage({ title, description, sections }: { title: string; description: string; sections: Section[] }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.09),transparent_35%)]" />
      <div className="relative mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
        <header className="mb-12 border-b border-border/60 pb-8">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to Content Calendar
          </Link>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
              <Sparkles className="size-5 text-white" />
            </span>
            <span className="text-lg font-bold">Content Calendar</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{description}</p>
          <p className="mt-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Last updated: July 1, 2026</p>
        </header>

        <article className="space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-xl font-semibold tracking-tight">{section.title}</h2>
              <div className="space-y-3 text-sm leading-7 text-muted-foreground [&_a]:text-indigo-400 [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc">
                {section.content}
              </div>
            </section>
          ))}
        </article>

        <footer className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/60 pt-6 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/data-deletion" className="hover:text-foreground">Data Deletion</Link>
        </footer>
      </div>
    </main>
  );
}

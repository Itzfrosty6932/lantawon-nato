import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText, ArrowLeft, Sparkles, ShieldCheck, Wrench, Film, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "System Updates | Lantawon Lang",
  description:
    "Every improvement, fix, and feature shipped to Lantawon Lang — your cinema discovery platform.",
};

const CATEGORY_ICON = {
  feature: Sparkles,
  fix: Wrench,
  improvement: TrendingUp,
  security: ShieldCheck,
  content: Film,
} as const;

const CATEGORY_STYLE = {
  feature: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  fix: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  improvement: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  security: "bg-red-500/15 text-red-400 border-red-500/30",
  content: "bg-amber-500/15 text-amber-400 border-amber-500/30",
} as const;

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  body_md: string;
  category: keyof typeof CATEGORY_ICON;
  severity: string;
  published_at: string;
}

export default async function ChangelogPage() {
  // RLS guarantees only published rows are visible to anonymous/authenticated
  // readers ("Anyone can view published changelog entries").
  const supabase = await createClient();
  const { data } = await supabase
    .from("system_changelog")
    .select("id, version, title, body_md, category, severity, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(50);

  const entries = (data || []) as unknown as ChangelogEntry[];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E50914]/10 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-4">
          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Bumalik sa Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center">
              <ScrollText className="h-6 w-6 text-[#E50914]" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tight">
                System Updates
              </h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                Lahat ng bagong feature, fix, at improvement sa Lantawon Lang.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
        {entries.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">
            <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-bold text-zinc-300">Wala pang updates</p>
            <p className="text-xs mt-1">Bumalik kaagad para sa mga bagong feature!</p>
          </div>
        ) : (
          <ol className="relative space-y-8 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-800">
            {entries.map((entry) => {
              const Icon = CATEGORY_ICON[entry.category] ?? Sparkles;
              return (
                <li key={entry.id} className="relative pl-8">
                  {/* Timeline node */}
                  <span className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-[#E50914] bg-black" />

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                        v{entry.version}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase ${CATEGORY_STYLE[entry.category]}`}
                      >
                        <Icon className="h-3 w-3" />
                        {entry.category}
                      </span>
                      {entry.severity !== "minor" && (
                        <span
                          className={`text-[10px] font-mono font-bold uppercase ${
                            entry.severity === "critical" ? "text-red-400" : "text-amber-400"
                          }`}
                        >
                          {entry.severity}
                        </span>
                      )}
                      <time
                        dateTime={entry.published_at}
                        className="text-[11px] font-mono text-zinc-500 ml-auto"
                      >
                        {new Date(entry.published_at).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </div>

                    <h2 className="text-lg font-bold font-heading">{entry.title}</h2>

                    <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap rounded-xl bg-zinc-950 border border-zinc-900 p-4">
                      {renderBody(entry.body_md)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

/**
 * Minimal markdown rendering for changelog bodies: headings (#), bullets
 * (- / *), bold (**), and plain paragraphs. No external parser — keeps the
 * page server-rendered and dependency-free.
 */
function renderBody(md: string): React.ReactNode[] {
  const blocks = md.split(/\n{2,}/);
  return blocks.map((block, bi) => {
    const lines = block.split("\n");
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      return (
        <ul key={bi} className="list-disc pl-5 space-y-1 my-2">
          {lines.map((line, li) => (
            <li key={li}>{inline(line.replace(/^\s*[-*]\s+/, ""))}</li>
          ))}
        </ul>
      );
    }
    const heading = block.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      return (
        <h3 key={bi} className="font-bold text-white mt-3 mb-1">
          {inline(heading[2])}
        </h3>
      );
    }
    return (
      <p key={bi} className="my-1">
        {inline(block)}
      </p>
    );
  });
}

function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="text-white font-bold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

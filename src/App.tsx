import { useState } from "react";
import PersonDetails from "./components/PersonDetails";
import PersonSearch from "./components/PersonSearch";
import RelationshipInspector from "./components/RelationshipInspector";

const panelClass =
  "rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-black/40 backdrop-blur";

export default function App() {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  return (
    <div className="relative isolate min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-48 top-0 h-80 w-80 rounded-full bg-indigo-600/40 blur-[160px]" />
        <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-[180px]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 lg:px-6 lg:py-16">
        <header className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
            alpha build
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Roglo Admin Portal
            </h1>
            <p className="max-w-3xl text-base leading-relaxed text-slate-300">
              Explore les personnes exposées par l'API GraphQL, vérifie leur
              confidentialité et simule les liens de parenté. Tout est prêt pour
              que Lovable puisse construire un aperçu sans erreur.
            </p>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[360px,1fr]">
          <section className={panelClass}>
            <PersonSearch
              selectedPersonId={selectedPersonId}
              onSelect={setSelectedPersonId}
            />
          </section>

          <section className="flex flex-col gap-6">
            <div className={panelClass}>
              <PersonDetails personId={selectedPersonId} />
            </div>
            <div className="rounded-3xl border border-indigo-500/30 bg-indigo-500/10 p-6 shadow-2xl shadow-indigo-900/30 backdrop-blur">
              <RelationshipInspector basePersonId={selectedPersonId} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

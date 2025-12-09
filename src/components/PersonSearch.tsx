import { useMemo, useState } from "react";
import { graphqlRequest } from "../lib/graphqlClient";
import type { PersonSummary } from "../types/graphql";

const SEARCH_PERSONS_QUERY = `#graphql
  query SearchPersons($surname: String!, $firstName: String!) {
    searchPersons(surname: $surname, firstName: $firstName) {
      id
      firstName
      surname
      public
    }
  }
`;

interface SearchResponse {
  searchPersons: PersonSummary[];
}

interface PersonSearchProps {
  onSelect: (id: string) => void;
  selectedPersonId: string | null;
}

const inputClass =
  "rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-base text-white placeholder:text-slate-400 shadow-inner shadow-black/10 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50";

export default function PersonSearch({
  onSelect,
  selectedPersonId,
}: PersonSearchProps) {
  const [surname, setSurname] = useState("Roglo");
  const [firstName, setFirstName] = useState("");
  const [results, setResults] = useState<PersonSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const canSearch = useMemo(
    () => surname.trim().length >= 2 || firstName.trim().length >= 2,
    [surname, firstName],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSearch) {
      setError("Renseigne au moins 2 lettres dans un champ");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setError(null);

    try {
      const data = await graphqlRequest<SearchResponse>({
        query: SEARCH_PERSONS_QUERY,
        variables: { surname: surname.trim(), firstName: firstName.trim() },
      });
      setResults(data.searchPersons);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.35em] text-indigo-200">
          GraphQL
        </p>
        <h2 className="text-2xl font-semibold text-white">
          Recherche de personnes
        </h2>
        <p className="text-sm text-slate-400">
          Tape un couple nom / prénom pour interroger `searchPersons` et
          inspecter les profils.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-200">
          Nom
          <input
            type="text"
            value={surname}
            onChange={(event) => setSurname(event.target.value)}
            placeholder="Ex: Dupont"
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-200">
          Prénom
          <input
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Ex: Marie"
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={!canSearch || loading}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-500 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Recherche…" : "Chercher"}
        </button>
      </form>

      {error && (
        <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <p className="text-sm text-slate-400">
          Aucun résultat avec ces critères.
        </p>
      )}

      <ul className="space-y-2">
        {results.map((person) => (
          <li key={person.id}>
            <button
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${person.id === selectedPersonId ? "border-indigo-400 bg-indigo-500/10 text-white" : "border-white/5 bg-white/5 text-slate-200"}`}
              onClick={() => onSelect(person.id)}
            >
              <span className="flex-1">
                {person.firstName} {person.surname}
              </span>
              <span
                className={`ml-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${person.public ? "bg-emerald-500/15 text-emerald-100" : "bg-amber-500/15 text-amber-100"}`}
              >
                {person.public ? "Profil public" : "Profil privé"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

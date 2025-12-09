import { useState } from "react";
import { graphqlRequest } from "../lib/graphqlClient";
import type { RelationshipPayload } from "../types/graphql";

const RELATIONSHIP_QUERY = `#graphql
  query Relationship($person1: ID!, $person2: ID!) {
    calculateRelationship(person1Id: $person1, person2Id: $person2) {
      person1
      person2
      degree
      description
    }
  }
`;

interface RelationshipResponse {
  calculateRelationship: RelationshipPayload | null;
}

interface RelationshipInspectorProps {
  basePersonId: string | null;
}

const inputClass =
  "rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-base text-white placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/40";

export default function RelationshipInspector({
  basePersonId,
}: RelationshipInspectorProps) {
  const [targetId, setTargetId] = useState("");
  const [result, setResult] = useState<RelationshipPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!basePersonId) {
      setError("Sélectionne d'abord une personne");
      return;
    }
    if (!targetId.trim()) {
      setError("Renseigne un second ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await graphqlRequest<RelationshipResponse>({
        query: RELATIONSHIP_QUERY,
        variables: { person1: basePersonId, person2: targetId.trim() },
      });
      setResult(data.calculateRelationship);
      if (!data.calculateRelationship) {
        setError("Aucun lien trouvé");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">
          Graph Explorer
        </p>
        <h3 className="text-2xl font-semibold text-white">
          Calculer un lien de parenté
        </h3>
        <p className="text-sm text-indigo-100/80">
          Utilise `calculateRelationship` pour mesurer la distance entre deux
          identifiants.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm font-semibold text-indigo-100">
          ID de référence
          <input type="text" value={basePersonId ?? ""} readOnly className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-indigo-100">
          ID à comparer
          <input
            type="text"
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            placeholder="UUID"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={loading || !basePersonId}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-white/15 px-4 py-2.5 font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Calcul…" : "Comparer"}
        </button>
      </form>

      {result && !error && (
        <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm text-white">
          <p className="text-lg font-semibold text-white">{result.description}</p>
          <p className="text-indigo-100/80">Degré&nbsp;: {result.degree}</p>
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-rose-500/40 bg-rose-500/20 px-3 py-2 text-sm text-rose-50">
          {error}
        </p>
      )}
    </div>
  );
}

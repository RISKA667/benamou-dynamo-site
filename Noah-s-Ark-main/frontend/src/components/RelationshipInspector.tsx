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
    <section className="card">
      <h3>Calculer un lien de parenté</h3>
      <form className="relationship-form" onSubmit={handleSubmit}>
        <label>
          ID de référence
          <input type="text" value={basePersonId ?? ""} readOnly />
        </label>
        <label>
          ID à comparer
          <input
            type="text"
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            placeholder="UUID"
          />
        </label>
        <button type="submit" disabled={loading || !basePersonId}>
          {loading ? "Calcul…" : "Comparer"}
        </button>
      </form>

      {result && !error && (
        <div className="relationship-result">
          <p className="highlight">{result.description}</p>
          <p className="muted">Degré : {result.degree}</p>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  );
}

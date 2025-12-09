import { useCallback, useEffect, useMemo, useState } from "react";
import { graphqlRequest } from "../lib/graphqlClient";
import type {
  AncestorSummary,
  PersonDetails as PersonDetailsType,
} from "../types/graphql";

const PERSON_INSIGHTS_QUERY = `#graphql
  query PersonInsights($id: ID!, $ancestorGenerations: Int!) {
    person(id: $id) {
      id
      firstName
      surname
      surnamePrefix
      nicknames
      notes
      public
      sex
    }
    ancestors(personId: $id, generations: $ancestorGenerations) {
      id
      firstName
      surname
    }
    consanguinity(personId: $id)
  }
`;

const TOGGLE_PRIVACY_MUTATION = `#graphql
  mutation TogglePrivacy($id: ID!, $public: Boolean!) {
    setPersonPrivacy(id: $id, public: $public) {
      id
      public
    }
  }
`;

interface PersonInsightsResponse {
  person: PersonDetailsType | null;
  ancestors: AncestorSummary[];
  consanguinity: number;
}

interface TogglePrivacyResponse {
  setPersonPrivacy: {
    id: string;
    public: boolean;
  };
}

interface PersonDetailsProps {
  personId: string | null;
}

const DEFAULT_GENERATIONS = 4;

export default function PersonDetails({ personId }: PersonDetailsProps) {
  const [generations, setGenerations] = useState(DEFAULT_GENERATIONS);
  const [person, setPerson] = useState<PersonDetailsType | null>(null);
  const [ancestors, setAncestors] = useState<AncestorSummary[]>([]);
  const [consanguinity, setConsanguinity] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

  const formattedConsanguinity = useMemo(() => {
    if (consanguinity == null) {
      return "N/A";
    }
    return `${(consanguinity * 100).toFixed(2)} %`;
  }, [consanguinity]);

  const fetchDetails = useCallback(async () => {
    if (!personId) {
      setPerson(null);
      setAncestors([]);
      setConsanguinity(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await graphqlRequest<PersonInsightsResponse>({
        query: PERSON_INSIGHTS_QUERY,
        variables: { id: personId, ancestorGenerations: generations },
      });
      setPerson(data.person);
      setAncestors(data.ancestors);
      setConsanguinity(data.consanguinity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [personId, generations]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  useEffect(() => {
    if (!personId) {
      setGenerations(DEFAULT_GENERATIONS);
    }
  }, [personId]);

  const handleTogglePrivacy = async () => {
    if (!personId || !person) {
      return;
    }
    setUpdatingPrivacy(true);
    setError(null);
    try {
      const data = await graphqlRequest<TogglePrivacyResponse>({
        query: TOGGLE_PRIVACY_MUTATION,
        variables: { id: personId, public: !person.public },
      });
      setPerson({ ...person, public: data.setPersonPrivacy.public });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de modifier la confidentialité");
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  if (!personId) {
    return <p className="muted">Sélectionne une personne pour voir les détails.</p>;
  }

  if (loading && !person) {
    return <p>Chargement du profil…</p>;
  }

  if (error && !person) {
    return <p className="error">{error}</p>;
  }

  if (!person) {
    return <p className="muted">Personne introuvable.</p>;
  }

  return (
    <div className="person-details">
      <div className="header">
        <div>
          <h2>
            {person.firstName} {person.surname}
          </h2>
          <p className="muted">ID : {person.id}</p>
          {person.surnamePrefix && (
            <p className="chip">Préfixe : {person.surnamePrefix}</p>
          )}
        </div>
        <button
          onClick={handleTogglePrivacy}
          disabled={updatingPrivacy}
          className={person.public ? "btn-danger" : "btn-primary"}
        >
          {updatingPrivacy
            ? "Mise à jour…"
            : person.public
              ? "Rendre privé"
              : "Rendre public"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="card">
        <h3>Bio</h3>
        <dl>
          <dt>Sexe</dt>
          <dd>{translateSex(person.sex)}</dd>
          <dt>Surnoms</dt>
          <dd>
            {person.nicknames.length > 0
              ? person.nicknames.join(", ")
              : "—"}
          </dd>
          <dt>Notes</dt>
          <dd>{person.notes ?? "Aucune note"}</dd>
          <dt>Confidentialité</dt>
          <dd>{person.public ? "Profil public" : "Profil privé"}</dd>
        </dl>
      </section>

      <section className="card">
        <div className="section-header">
          <h3>Ascendance</h3>
          <label className="inline">
            Générations
            <input
              type="number"
              min={1}
              max={12}
              value={generations}
              onChange={(event) =>
                setGenerations(Number(event.target.value) || DEFAULT_GENERATIONS)
              }
            />
          </label>
          <button onClick={() => void fetchDetails()} disabled={loading}>
            Rafraîchir
          </button>
        </div>
        {ancestors.length === 0 ? (
          <p className="muted">Aucun ancêtre trouvé.</p>
        ) : (
          <ul className="ancestor-list">
            {ancestors.map((ancestor) => (
              <li key={ancestor.id}>
                {ancestor.firstName} {ancestor.surname}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3>Consanguinité estimée</h3>
        <p className="highlight">{formattedConsanguinity}</p>
        <p className="muted">
          Valeur calculée côté serveur sur la base du graphe Neo4j.
        </p>
      </section>
    </div>
  );
}

function translateSex(sex: PersonDetailsType["sex"]) {
  switch (sex) {
    case "Male":
      return "Homme";
    case "Female":
      return "Femme";
    default:
      return "Inconnu";
  }
}

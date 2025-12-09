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

const infoCardClass =
  "rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-black/20";

const inputClass =
  "w-24 rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-2 text-sm text-white outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/40";

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
      setError(
        err instanceof Error ? err.message : "Impossible de modifier la confidentialité",
      );
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  if (!personId) {
    return (
      <p className="text-sm text-slate-400">
        Sélectionne une personne pour voir les détails.
      </p>
    );
  }

  if (loading && !person) {
    return <p className="text-sm text-slate-300">Chargement du profil…</p>;
  }

  if (error && !person) {
    return (
      <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
        {error}
      </p>
    );
  }

  if (!person) {
    return <p className="text-sm text-slate-400">Personne introuvable.</p>;
  }

  const privacyButtonClass = person.public
    ? "inline-flex items-center rounded-2xl border border-rose-500/40 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-100 shadow-lg shadow-rose-900/30 transition hover:-translate-y-0.5 disabled:opacity-50"
    : "inline-flex items-center rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-lg shadow-emerald-900/30 transition hover:-translate-y-0.5 disabled:opacity-50";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-white">
            {person.firstName} {person.surname}
          </h2>
          <p className="text-sm text-slate-400">ID&nbsp;: {person.id}</p>
          {person.surnamePrefix && (
            <span className="inline-flex w-fit items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
              Préfixe&nbsp;: {person.surnamePrefix}
            </span>
          )}
        </div>
        <button
          onClick={handleTogglePrivacy}
          disabled={updatingPrivacy}
          className={privacyButtonClass}
        >
          {updatingPrivacy
            ? "Mise à jour…"
            : person.public
              ? "Rendre privé"
              : "Rendre public"}
        </button>
      </div>

      {error && (
        <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      )}

      <section className={infoCardClass}>
        <h3 className="mb-4 text-lg font-semibold text-white">Bio</h3>
        <dl className="grid grid-cols-1 gap-4 text-sm text-slate-200 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Sexe</dt>
            <dd className="text-base">{translateSex(person.sex)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Surnoms</dt>
            <dd className="text-base">
              {person.nicknames.length > 0 ? person.nicknames.join(", ") : "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-slate-400">Notes</dt>
            <dd className="text-base">{person.notes ?? "Aucune note"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Confidentialité
            </dt>
            <dd className="text-base">
              {person.public ? "Profil public" : "Profil privé"}
            </dd>
          </div>
        </dl>
      </section>

      <section className={infoCardClass}>
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <h3 className="text-lg font-semibold text-white">Ascendance</h3>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            Générations
            <input
              type="number"
              min={1}
              max={12}
              value={generations}
              onChange={(event) =>
                setGenerations(Number(event.target.value) || DEFAULT_GENERATIONS)
              }
              className={inputClass}
            />
          </label>
          <button
            onClick={() => void fetchDetails()}
            disabled={loading}
            className="inline-flex items-center rounded-2xl border border-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            Rafraîchir
          </button>
        </div>
        {ancestors.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun ancêtre trouvé.</p>
        ) : (
          <ul className="divide-y divide-white/5 text-sm text-slate-200">
            {ancestors.map((ancestor) => (
              <li key={ancestor.id} className="py-1.5">
                {ancestor.firstName} {ancestor.surname}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 text-center shadow-inner shadow-indigo-900/30">
        <h3 className="text-lg font-semibold text-white">Consanguinité estimée</h3>
        <p className="mt-2 text-4xl font-semibold text-indigo-100">
          {formattedConsanguinity}
        </p>
        <p className="text-sm text-indigo-100/70">
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

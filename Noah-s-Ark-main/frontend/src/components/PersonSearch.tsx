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
    <div>
      <h2>Recherche de personnes</h2>
      <form className="search-form" onSubmit={handleSubmit}>
        <label>
          Nom
          <input
            type="text"
            value={surname}
            onChange={(event) => setSurname(event.target.value)}
            placeholder="Ex: Dupont"
            autoComplete="off"
          />
        </label>
        <label>
          Prénom
          <input
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Ex: Marie"
            autoComplete="off"
          />
        </label>
        <button type="submit" disabled={!canSearch || loading}>
          {loading ? "Recherche…" : "Chercher"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {!loading && hasSearched && results.length === 0 && (
        <p className="muted">Aucun résultat avec ces critères.</p>
      )}

      <ul className="result-list">
        {results.map((person) => (
          <li key={person.id}>
            <button
              className={
                person.id === selectedPersonId
                  ? "result selected"
                  : "result"
              }
              onClick={() => onSelect(person.id)}
            >
              <span>
                {person.firstName} {person.surname}
              </span>
              <span className={person.public ? "tag public" : "tag private"}>
                {person.public ? "Profil public" : "Profil privé"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

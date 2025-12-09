import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { graphqlRequest } from "../lib/graphqlClient";
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
export default function PersonSearch({ onSelect, selectedPersonId, }) {
    const [surname, setSurname] = useState("Roglo");
    const [firstName, setFirstName] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const canSearch = useMemo(() => surname.trim().length >= 2 || firstName.trim().length >= 2, [surname, firstName]);
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!canSearch) {
            setError("Renseigne au moins 2 lettres dans un champ");
            return;
        }
        setLoading(true);
        setHasSearched(true);
        setError(null);
        try {
            const data = await graphqlRequest({
                query: SEARCH_PERSONS_QUERY,
                variables: { surname: surname.trim(), firstName: firstName.trim() },
            });
            setResults(data.searchPersons);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { children: [_jsx("h2", { children: "Recherche de personnes" }), _jsxs("form", { className: "search-form", onSubmit: handleSubmit, children: [_jsxs("label", { children: ["Nom", _jsx("input", { type: "text", value: surname, onChange: (event) => setSurname(event.target.value), placeholder: "Ex: Dupont", autoComplete: "off" })] }), _jsxs("label", { children: ["Pr\u00E9nom", _jsx("input", { type: "text", value: firstName, onChange: (event) => setFirstName(event.target.value), placeholder: "Ex: Marie", autoComplete: "off" })] }), _jsx("button", { type: "submit", disabled: !canSearch || loading, children: loading ? "Recherche…" : "Chercher" })] }), error && _jsx("p", { className: "error", children: error }), !loading && hasSearched && results.length === 0 && (_jsx("p", { className: "muted", children: "Aucun r\u00E9sultat avec ces crit\u00E8res." })), _jsx("ul", { className: "result-list", children: results.map((person) => (_jsx("li", { children: _jsxs("button", { className: person.id === selectedPersonId
                            ? "result selected"
                            : "result", onClick: () => onSelect(person.id), children: [_jsxs("span", { children: [person.firstName, " ", person.surname] }), _jsx("span", { className: person.public ? "tag public" : "tag private", children: person.public ? "Profil public" : "Profil privé" })] }) }, person.id))) })] }));
}

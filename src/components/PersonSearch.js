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
const inputClass = "rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-base text-white placeholder:text-slate-400 shadow-inner shadow-black/10 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50";
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.35em] text-indigo-200", children: "GraphQL" }), _jsx("h2", { className: "text-2xl font-semibold text-white", children: "Recherche de personnes" }), _jsx("p", { className: "text-sm text-slate-400", children: "Tape un couple nom / pr\u00E9nom pour interroger `searchPersons` et inspecter les profils." })] }), _jsxs("form", { className: "space-y-4", onSubmit: handleSubmit, children: [_jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-semibold text-slate-200", children: ["Nom", _jsx("input", { type: "text", value: surname, onChange: (event) => setSurname(event.target.value), placeholder: "Ex: Dupont", autoComplete: "off", className: inputClass })] }), _jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-semibold text-slate-200", children: ["Pr\u00E9nom", _jsx("input", { type: "text", value: firstName, onChange: (event) => setFirstName(event.target.value), placeholder: "Ex: Marie", autoComplete: "off", className: inputClass })] }), _jsx("button", { type: "submit", disabled: !canSearch || loading, className: "inline-flex w-full items-center justify-center rounded-2xl bg-indigo-500 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50", children: loading ? "Recherche…" : "Chercher" })] }), error && (_jsx("p", { className: "rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100", children: error })), !loading && hasSearched && results.length === 0 && (_jsx("p", { className: "text-sm text-slate-400", children: "Aucun r\u00E9sultat avec ces crit\u00E8res." })), _jsx("ul", { className: "space-y-2", children: results.map((person) => (_jsx("li", { children: _jsxs("button", { className: `flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${person.id === selectedPersonId ? "border-indigo-400 bg-indigo-500/10 text-white" : "border-white/5 bg-white/5 text-slate-200"}`, onClick: () => onSelect(person.id), children: [_jsxs("span", { className: "flex-1", children: [person.firstName, " ", person.surname] }), _jsx("span", { className: `ml-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${person.public ? "bg-emerald-500/15 text-emerald-100" : "bg-amber-500/15 text-amber-100"}`, children: person.public ? "Profil public" : "Profil privé" })] }) }, person.id))) })] }));
}

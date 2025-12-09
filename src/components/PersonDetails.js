import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { graphqlRequest } from "../lib/graphqlClient";
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
const DEFAULT_GENERATIONS = 4;
const infoCardClass = "rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-black/20";
const inputClass = "w-24 rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-2 text-sm text-white outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/40";
export default function PersonDetails({ personId }) {
    const [generations, setGenerations] = useState(DEFAULT_GENERATIONS);
    const [person, setPerson] = useState(null);
    const [ancestors, setAncestors] = useState([]);
    const [consanguinity, setConsanguinity] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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
            const data = await graphqlRequest({
                query: PERSON_INSIGHTS_QUERY,
                variables: { id: personId, ancestorGenerations: generations },
            });
            setPerson(data.person);
            setAncestors(data.ancestors);
            setConsanguinity(data.consanguinity);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
        }
        finally {
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
            const data = await graphqlRequest({
                query: TOGGLE_PRIVACY_MUTATION,
                variables: { id: personId, public: !person.public },
            });
            setPerson({ ...person, public: data.setPersonPrivacy.public });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de modifier la confidentialité");
        }
        finally {
            setUpdatingPrivacy(false);
        }
    };
    if (!personId) {
        return (_jsx("p", { className: "text-sm text-slate-400", children: "S\u00E9lectionne une personne pour voir les d\u00E9tails." }));
    }
    if (loading && !person) {
        return _jsx("p", { className: "text-sm text-slate-300", children: "Chargement du profil\u2026" });
    }
    if (error && !person) {
        return (_jsx("p", { className: "rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100", children: error }));
    }
    if (!person) {
        return _jsx("p", { className: "text-sm text-slate-400", children: "Personne introuvable." });
    }
    const privacyButtonClass = person.public
        ? "inline-flex items-center rounded-2xl border border-rose-500/40 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-100 shadow-lg shadow-rose-900/30 transition hover:-translate-y-0.5 disabled:opacity-50"
        : "inline-flex items-center rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-lg shadow-emerald-900/30 transition hover:-translate-y-0.5 disabled:opacity-50";
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("h2", { className: "text-2xl font-semibold text-white", children: [person.firstName, " ", person.surname] }), _jsxs("p", { className: "text-sm text-slate-400", children: ["ID\u00A0: ", person.id] }), person.surnamePrefix && (_jsxs("span", { className: "inline-flex w-fit items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100", children: ["Pr\u00E9fixe\u00A0: ", person.surnamePrefix] }))] }), _jsx("button", { onClick: handleTogglePrivacy, disabled: updatingPrivacy, className: privacyButtonClass, children: updatingPrivacy
                            ? "Mise à jour…"
                            : person.public
                                ? "Rendre privé"
                                : "Rendre public" })] }), error && (_jsx("p", { className: "rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100", children: error })), _jsxs("section", { className: infoCardClass, children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-white", children: "Bio" }), _jsxs("dl", { className: "grid grid-cols-1 gap-4 text-sm text-slate-200 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Sexe" }), _jsx("dd", { className: "text-base", children: translateSex(person.sex) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Surnoms" }), _jsx("dd", { className: "text-base", children: person.nicknames.length > 0 ? person.nicknames.join(", ") : "—" })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("dt", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Notes" }), _jsx("dd", { className: "text-base", children: person.notes ?? "Aucune note" })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Confidentialit\u00E9" }), _jsx("dd", { className: "text-base", children: person.public ? "Profil public" : "Profil privé" })] })] })] }), _jsxs("section", { className: infoCardClass, children: [_jsxs("div", { className: "mb-4 flex flex-wrap items-center gap-4", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Ascendance" }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-slate-200", children: ["G\u00E9n\u00E9rations", _jsx("input", { type: "number", min: 1, max: 12, value: generations, onChange: (event) => setGenerations(Number(event.target.value) || DEFAULT_GENERATIONS), className: inputClass })] }), _jsx("button", { onClick: () => void fetchDetails(), disabled: loading, className: "inline-flex items-center rounded-2xl border border-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50", children: "Rafra\u00EEchir" })] }), ancestors.length === 0 ? (_jsx("p", { className: "text-sm text-slate-400", children: "Aucun anc\u00EAtre trouv\u00E9." })) : (_jsx("ul", { className: "divide-y divide-white/5 text-sm text-slate-200", children: ancestors.map((ancestor) => (_jsxs("li", { className: "py-1.5", children: [ancestor.firstName, " ", ancestor.surname] }, ancestor.id))) }))] }), _jsxs("section", { className: "rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 text-center shadow-inner shadow-indigo-900/30", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Consanguinit\u00E9 estim\u00E9e" }), _jsx("p", { className: "mt-2 text-4xl font-semibold text-indigo-100", children: formattedConsanguinity }), _jsx("p", { className: "text-sm text-indigo-100/70", children: "Valeur calcul\u00E9e c\u00F4t\u00E9 serveur sur la base du graphe Neo4j." })] })] }));
}
function translateSex(sex) {
    switch (sex) {
        case "Male":
            return "Homme";
        case "Female":
            return "Femme";
        default:
            return "Inconnu";
    }
}

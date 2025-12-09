import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { graphqlRequest } from "../lib/graphqlClient";
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
const inputClass = "rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-base text-white placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/40";
export default function RelationshipInspector({ basePersonId, }) {
    const [targetId, setTargetId] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (event) => {
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
            const data = await graphqlRequest({
                query: RELATIONSHIP_QUERY,
                variables: { person1: basePersonId, person2: targetId.trim() },
            });
            setResult(data.calculateRelationship);
            if (!data.calculateRelationship) {
                setError("Aucun lien trouvé");
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.4em] text-indigo-200", children: "Graph Explorer" }), _jsx("h3", { className: "text-2xl font-semibold text-white", children: "Calculer un lien de parent\u00E9" }), _jsx("p", { className: "text-sm text-indigo-100/80", children: "Utilise `calculateRelationship` pour mesurer la distance entre deux identifiants." })] }), _jsxs("form", { className: "space-y-4", onSubmit: handleSubmit, children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-semibold text-indigo-100", children: ["ID de r\u00E9f\u00E9rence", _jsx("input", { type: "text", value: basePersonId ?? "", readOnly: true, className: inputClass })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-semibold text-indigo-100", children: ["ID \u00E0 comparer", _jsx("input", { type: "text", value: targetId, onChange: (event) => setTargetId(event.target.value), placeholder: "UUID", className: inputClass })] }), _jsx("button", { type: "submit", disabled: loading || !basePersonId, className: "inline-flex w-full items-center justify-center rounded-2xl bg-white/15 px-4 py-2.5 font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50", children: loading ? "Calcul…" : "Comparer" })] }), result && !error && (_jsxs("div", { className: "rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm text-white", children: [_jsx("p", { className: "text-lg font-semibold text-white", children: result.description }), _jsxs("p", { className: "text-indigo-100/80", children: ["Degr\u00E9\u00A0: ", result.degree] })] })), error && (_jsx("p", { className: "rounded-2xl border border-rose-500/40 bg-rose-500/20 px-3 py-2 text-sm text-rose-50", children: error }))] }));
}

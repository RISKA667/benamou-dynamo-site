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
    return (_jsxs("section", { className: "card", children: [_jsx("h3", { children: "Calculer un lien de parent\u00E9" }), _jsxs("form", { className: "relationship-form", onSubmit: handleSubmit, children: [_jsxs("label", { children: ["ID de r\u00E9f\u00E9rence", _jsx("input", { type: "text", value: basePersonId ?? "", readOnly: true })] }), _jsxs("label", { children: ["ID \u00E0 comparer", _jsx("input", { type: "text", value: targetId, onChange: (event) => setTargetId(event.target.value), placeholder: "UUID" })] }), _jsx("button", { type: "submit", disabled: loading || !basePersonId, children: loading ? "Calcul…" : "Comparer" })] }), result && !error && (_jsxs("div", { className: "relationship-result", children: [_jsx("p", { className: "highlight", children: result.description }), _jsxs("p", { className: "muted", children: ["Degr\u00E9\u00A0: ", result.degree] })] })), error && _jsx("p", { className: "error", children: error })] }));
}

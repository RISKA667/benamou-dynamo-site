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
        return _jsx("p", { className: "muted", children: "S\u00E9lectionne une personne pour voir les d\u00E9tails." });
    }
    if (loading && !person) {
        return _jsx("p", { children: "Chargement du profil\u2026" });
    }
    if (error && !person) {
        return _jsx("p", { className: "error", children: error });
    }
    if (!person) {
        return _jsx("p", { className: "muted", children: "Personne introuvable." });
    }
    return (_jsxs("div", { className: "person-details", children: [_jsxs("div", { className: "header", children: [_jsxs("div", { children: [_jsxs("h2", { children: [person.firstName, " ", person.surname] }), _jsxs("p", { className: "muted", children: ["ID\u00A0: ", person.id] }), person.surnamePrefix && (_jsxs("p", { className: "chip", children: ["Pr\u00E9fixe\u00A0: ", person.surnamePrefix] }))] }), _jsx("button", { onClick: handleTogglePrivacy, disabled: updatingPrivacy, className: person.public ? "btn-danger" : "btn-primary", children: updatingPrivacy
                            ? "Mise à jour…"
                            : person.public
                                ? "Rendre privé"
                                : "Rendre public" })] }), error && _jsx("p", { className: "error", children: error }), _jsxs("section", { className: "card", children: [_jsx("h3", { children: "Bio" }), _jsxs("dl", { children: [_jsx("dt", { children: "Sexe" }), _jsx("dd", { children: translateSex(person.sex) }), _jsx("dt", { children: "Surnoms" }), _jsx("dd", { children: person.nicknames.length > 0
                                    ? person.nicknames.join(", ")
                                    : "—" }), _jsx("dt", { children: "Notes" }), _jsx("dd", { children: person.notes ?? "Aucune note" }), _jsx("dt", { children: "Confidentialit\u00E9" }), _jsx("dd", { children: person.public ? "Profil public" : "Profil privé" })] })] }), _jsxs("section", { className: "card", children: [_jsxs("div", { className: "section-header", children: [_jsx("h3", { children: "Ascendance" }), _jsxs("label", { className: "inline", children: ["G\u00E9n\u00E9rations", _jsx("input", { type: "number", min: 1, max: 12, value: generations, onChange: (event) => setGenerations(Number(event.target.value) || DEFAULT_GENERATIONS) })] }), _jsx("button", { onClick: () => void fetchDetails(), disabled: loading, children: "Rafra\u00EEchir" })] }), ancestors.length === 0 ? (_jsx("p", { className: "muted", children: "Aucun anc\u00EAtre trouv\u00E9." })) : (_jsx("ul", { className: "ancestor-list", children: ancestors.map((ancestor) => (_jsxs("li", { children: [ancestor.firstName, " ", ancestor.surname] }, ancestor.id))) }))] }), _jsxs("section", { className: "card", children: [_jsx("h3", { children: "Consanguinit\u00E9 estim\u00E9e" }), _jsx("p", { className: "highlight", children: formattedConsanguinity }), _jsx("p", { className: "muted", children: "Valeur calcul\u00E9e c\u00F4t\u00E9 serveur sur la base du graphe Neo4j." })] })] }));
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

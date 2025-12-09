import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import PersonDetails from "./components/PersonDetails";
import PersonSearch from "./components/PersonSearch";
import RelationshipInspector from "./components/RelationshipInspector";
export default function App() {
    const [selectedPersonId, setSelectedPersonId] = useState(null);
    return (_jsxs("div", { className: "app-shell", children: [_jsx("header", { children: _jsxs("div", { children: [_jsx("p", { className: "beta", children: "alpha" }), _jsx("h1", { children: "Roglo Admin Portal" }), _jsx("p", { className: "muted", children: "Explore les personnes expos\u00E9es par l'API GraphQL et pilote les changements de confidentialit\u00E9." })] }) }), _jsxs("main", { className: "panels", children: [_jsx("section", { className: "panel", children: _jsx(PersonSearch, { selectedPersonId: selectedPersonId, onSelect: setSelectedPersonId }) }), _jsxs("section", { className: "panel", children: [_jsx(PersonDetails, { personId: selectedPersonId }), _jsx(RelationshipInspector, { basePersonId: selectedPersonId })] })] })] }));
}

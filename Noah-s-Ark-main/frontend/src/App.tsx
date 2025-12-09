import { useState } from "react";
import PersonDetails from "./components/PersonDetails";
import PersonSearch from "./components/PersonSearch";
import RelationshipInspector from "./components/RelationshipInspector";

export default function App() {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  return (
    <div className="app-shell">
      <header>
        <div>
          <p className="beta">alpha</p>
          <h1>Roglo Admin Portal</h1>
          <p className="muted">
            Explore les personnes exposées par l'API GraphQL et pilote les
            changements de confidentialité.
          </p>
        </div>
      </header>
      <main className="panels">
        <section className="panel">
          <PersonSearch
            selectedPersonId={selectedPersonId}
            onSelect={setSelectedPersonId}
          />
        </section>
        <section className="panel">
          <PersonDetails personId={selectedPersonId} />
          <RelationshipInspector basePersonId={selectedPersonId} />
        </section>
      </main>
    </div>
  );
}

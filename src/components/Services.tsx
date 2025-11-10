import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const Services = () => {
  const services = [
    {
      id: "croissance",
      title: "De 100K à 1M€ : le plan qui marche",
      category: "STRATÉGIE DE CROISSANCE",
      description:
        "Vous stagnez ? Vos concurrents explosent ? On analyse votre business en profondeur et on vous donne LA stratégie pour multiplier votre CA.",
      included: [
        "Audit complet (marché, concurrence, forces/faiblesses)",
        "Plan de croissance 12-24 mois",
        "Roadmap d'exécution concrète",
        "Suivi mensuel sur 6 mois",
      ],
      price: "À partir de 5 000€",
    },
    {
      id: "optimisation",
      title: "Arrêtez de perdre de l'argent",
      category: "OPTIMISATION FINANCIÈRE",
      description:
        "Vos marges fondent ? Vos coûts explosent ? On identifie où part votre argent et on colmate les fuites. Résultat garanti ou remboursé.",
      included: [
        "Analyse de rentabilité approfondie",
        "Optimisation des coûts (15-40% d'économies en moyenne)",
        "Restructuration financière si nécessaire",
        "Outils de pilotage sur-mesure",
      ],
      price: "À partir de 3 500€",
    },
    {
      id: "levee",
      title: "On trouve l'argent, vous le faites fructifier",
      category: "LEVÉE DE FONDS & FINANCEMENT",
      description:
        "Vous avez un projet ambitieux mais pas le cash ? On construit votre dossier béton et on vous connecte aux bons investisseurs.",
      included: [
        "Business plan & pitch deck pro",
        "Valorisation & prévisionnel financier",
        "Mise en relation investisseurs/banques",
        "Négociation & closing deal",
      ],
      price: "Success fee (% levée) + honoraires fixes",
    },
    {
      id: "sparring",
      title: "Votre sparring-partner stratégique",
      category: "CONSEIL AU DIRIGEANT",
      description:
        "Vous êtes seul face aux décisions ? On devient votre bras droit stratégique. Disponible quand vous en avez besoin. Pas un consultant qui disparaît après son PowerPoint.",
      included: [
        "Accompagnement personnalisé illimité",
        "Disponibilité 7j/7 (vraiment)",
        "Résolution de crises en temps réel",
        "Network & introductions stratégiques",
      ],
      price: "Forfait mensuel à partir de 2 500€",
    },
  ];

  return (
    <section id="services" className="py-20 md:py-32 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4">
            Vous avez un business ?
          </h2>
          <p className="text-2xl md:text-3xl text-primary font-semibold">
            On a la solution.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {services.map((service, index) => (
              <AccordionItem
                key={service.id}
                value={service.id}
                className="border-2 border-border rounded-lg bg-card overflow-hidden hover:border-primary transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <AccordionTrigger className="px-6 py-6 hover:no-underline group">
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-primary mb-2">
                      {service.category}
                    </p>
                    <h3 className="text-xl md:text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-6 pt-4">
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {service.description}
                    </p>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        Inclus :
                      </h4>
                      <ul className="space-y-2">
                        {service.included.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
                      <p className="text-lg font-semibold text-foreground">
                        Prix : <span className="text-primary">{service.price}</span>
                      </p>
                      <Button
                        onClick={() => {
                          const element = document.getElementById("contact");
                          element?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Réserver ce service
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default Services;

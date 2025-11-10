import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Vous êtes chers ?",
      answer:
        "Chers par rapport à quoi ? Un stagiaire qui perd 6 mois ? Un cabinet qui facture 50K€ pour un PDF ? On est plus chers qu'un freelance Upwork, moins chers qu'un Big Four, et BEAUCOUP plus efficaces. Et surtout : nos honoraires sont liés à vos résultats. Si vous ne gagnez pas, on ajuste.",
    },
    {
      question: "Vous travaillez avec quelle taille d'entreprise ?",
      answer:
        "De la startup à la PME de 50M€. Si vous avez de l'ambition et un business viable, on peut vous aider. Point.",
    },
    {
      question: "Combien de temps ça prend ?",
      answer:
        "Diagnostic : 48h. Plan d'action : 1 semaine. Premiers résultats : 30-60 jours (selon secteur). On ne traîne pas. Le temps c'est de l'argent, surtout le vôtre.",
    },
    {
      question: "Vous êtes vraiment basés à Cannes ?",
      answer:
        "Oui. Bureau sur la Croisette. Mais on travaille partout : Paris, Lyon, Monaco, Côte d'Azur entière. Et même en remote si votre business le nécessite.",
    },
    {
      question: "Quelle est votre garantie ?",
      answer:
        "Simple : si après 3 mois vous ne voyez pas d'amélioration mesurable, on continue gratis jusqu'à ce que ça marche. Ou on vous rembourse. On ne peut pas être plus clair.",
    },
    {
      question: "Pourquoi 'Benamou' ? C'est une référence à Serge ?",
      answer:
        "Oui. Serge Benamou c'est l'archétype du hustler français : énergie, audace, débrouillardise. Sauf qu'on, on livre vraiment. Sans les embrouilles. 😉",
    },
    {
      question: "Vous prenez tous les clients ?",
      answer:
        "Non. On ne travaille qu'avec des gens sérieux qui veulent vraiment réussir. Si vous cherchez quelqu'un pour valider vos mauvaises décisions, allez voir ailleurs.",
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4">
            Vous hésitez encore ? Normal.
          </h2>
          <p className="text-xl text-primary font-semibold">Voici les réponses.</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border-2 border-border rounded-lg bg-card px-6 hover:border-primary transition-colors duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <AccordionTrigger className="py-6 text-left hover:no-underline">
                  <span className="text-lg font-semibold text-foreground pr-4">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;

import { Zap, TrendingUp, Diamond } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const WhyBenamou = () => {
  const reasons = [
    {
      icon: Zap,
      title: "Du concret en 48h",
      description:
        "Pas de rapport de 300 pages que personne ne lit. Vous avez un problème ? On vous donne la solution. Cette semaine. Pas dans 6 mois.",
    },
    {
      icon: TrendingUp,
      title: "On parie sur vos résultats",
      description:
        "Notre rémunération est liée à votre croissance. Si vous ne gagnez pas d'argent, on n'est pas contents. Simple, non ?",
    },
    {
      icon: Diamond,
      title: "Zéro bullshit",
      description:
        "On vous dit la vérité, même si ça fait mal. Parce qu'un bon conseil qui dérange vaut mieux qu'un mensonge qui rassure.",
    },
  ];

  return (
    <section id="why-benamou" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4">
            On n'est pas comme les autres cabinets.
          </h2>
          <p className="text-2xl md:text-3xl text-primary font-semibold">
            Et tant mieux pour vous.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <Card
                key={index}
                className="hover-lift border-2 hover:border-primary transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-foreground">
                    {reason.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {reason.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyBenamou;

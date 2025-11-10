import { Search, MessageSquare, Target, Rocket, BarChart } from "lucide-react";

const Method = () => {
  const steps = [
    {
      number: "1",
      icon: Search,
      title: "DIAGNOSTIC EXPRESS",
      description:
        "On analyse votre business en profondeur. 48h max pour comprendre où vous en êtes.",
    },
    {
      number: "2",
      icon: MessageSquare,
      title: "VÉRITÉ SANS FILTRE",
      description:
        "On vous dit ce qui marche, ce qui déconne, et pourquoi vous n'êtes pas où vous devriez être.",
    },
    {
      number: "3",
      icon: Target,
      title: "PLAN D'ACTION",
      description:
        "Stratégie concrète avec deadlines réelles. Pas de \"on verra\", que des actions mesurables.",
    },
    {
      number: "4",
      icon: Rocket,
      title: "EXÉCUTION ACCOMPAGNÉE",
      description:
        "On ne vous laisse pas seul. On est là, à chaque étape, pour que ça avance. Vraiment.",
    },
    {
      number: "5",
      icon: BarChart,
      title: "RÉSULTATS MESURÉS",
      description:
        "On track les KPIs. Si ça ne bouge pas, on ajuste. On ne lâche rien tant que vous n'avez pas vos résultats.",
    },
  ];

  return (
    <section id="method" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4">
            Notre méthode : simple, efficace, éprouvée
          </h2>
          <p className="text-xl text-muted-foreground">
            (Pas de blabla, que du concret)
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Desktop: Horizontal Timeline */}
          <div className="hidden md:block relative">
            {/* Connection Line */}
            <div className="absolute top-16 left-0 right-0 h-1 bg-primary/20" />

            <div className="grid grid-cols-5 gap-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className="relative animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Number Circle */}
                    <div className="relative z-10 w-32 h-32 mx-auto rounded-full bg-primary flex items-center justify-center mb-6 shadow-[var(--shadow-gold)]">
                      <span className="text-5xl font-display font-bold text-primary-foreground">
                        {step.number}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-center space-y-2">
                      <h3 className="font-bold text-sm text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile: Vertical Timeline */}
          <div className="md:hidden space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="flex gap-4 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Number Circle */}
                  <div className="flex-shrink-0 w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-[var(--shadow-gold)]">
                    <span className="text-3xl font-display font-bold text-primary-foreground">
                      {step.number}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-bold text-foreground">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Method;

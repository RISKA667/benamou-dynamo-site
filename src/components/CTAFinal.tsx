import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const CTAFinal = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-accent to-secondary" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-10" />

      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-12 animate-fade-in">
          {/* Headline */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-background">
            Alors, on fait quoi ?
          </h2>

          {/* Options */}
          <div className="space-y-6 text-background/90 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
            <p>Vous avez deux options :</p>

            <div className="space-y-4 text-left bg-background/10 backdrop-blur-sm rounded-lg p-6 md:p-8">
              <p>
                <strong className="text-background">Option 1 :</strong> Vous
                fermez cette page et vous restez où vous êtes.
                <br />
                Dans 6 mois, vous aurez les mêmes problèmes. Peut-être pires.
              </p>

              <div className="h-px bg-background/20 my-4" />

              <p>
                <strong className="text-primary">Option 2 :</strong> Vous prenez
                rendez-vous. On se parle 30 minutes.
                <br />
                Sans engagement. Je vous dis si je peux vous aider.
                <br />
                Si oui, on démarre. Si non, je vous oriente vers quelqu'un qui
                peut.
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button
              variant="hero"
              size="xl"
              onClick={scrollToContact}
              className="animate-pulse-gold w-full sm:w-auto"
            >
              RÉSERVER MA CONSULTATION GRATUITE
            </Button>
            <Button
              variant="hero-outline"
              size="xl"
              asChild
              className="w-full sm:w-auto bg-background/10 backdrop-blur-sm border-background text-background hover:bg-background hover:text-secondary"
            >
              <a href="tel:+33493999999" className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Appeler : +33 4 93 99 99 99
              </a>
            </Button>
          </div>

          {/* Urgency */}
          <p className="text-sm md:text-base text-background/70 max-w-xl mx-auto">
            <strong className="text-primary">Places limitées :</strong> On ne
            prend que 3 nouveaux clients par mois.
            <br />
            Premier arrivé, premier servi.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTAFinal;

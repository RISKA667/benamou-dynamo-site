import { Button } from "@/components/ui/button";
import { MapPin, ChevronDown } from "lucide-react";
import heroImage from "@/assets/hero-cannes.jpg";
import sergeProfile from "@/assets/serge-profile.jpg";

const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Cannes - Côte d'Azur"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/95 via-secondary/85 to-accent/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
          {/* Serge Profile Image */}
          <div className="flex justify-center mb-8">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary shadow-[var(--shadow-gold)] hover:scale-105 transition-transform duration-300">
              <img
                src={sergeProfile}
                alt="Serge Benamou - Fondateur"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-primary font-medium text-sm">Basé à Cannes</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-background leading-tight">
            Assieds-toi, on va parler{" "}
            <span className="text-gradient-gold">business.</span>
          </h1>

          {/* Subtitle */}
          <div className="space-y-2">
            <p className="text-2xl md:text-3xl text-background/90 font-semibold">
              Benamou Conseil
            </p>
            <p className="text-xl md:text-2xl text-primary font-medium">
              Stratégie · Croissance · Résultats
            </p>
            <p className="text-lg text-background/80">
              Cabinet de conseil en gestion d'affaires — Cannes
            </p>
          </div>

          {/* Pitch */}
          <div className="max-w-3xl mx-auto space-y-4 pt-6">
            <p className="text-xl md:text-2xl text-background font-medium leading-relaxed">
              Vous voulez développer votre entreprise ? Exploser votre CA ?
              <br />
              <span className="text-primary">
                Ou rester à regarder vos concurrents vous dépasser ?
              </span>
            </p>
            <p className="text-lg md:text-xl text-background/90 leading-relaxed">
              Chez Benamou Conseil, on ne fait pas de PowerPoint de 200 pages.
              <br />
              On fait du <strong className="text-primary">CONCRET</strong>. Du{" "}
              <strong className="text-primary">RAPIDE</strong>. Du{" "}
              <strong className="text-primary">qui-marche-vraiment</strong>.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button
              variant="hero"
              onClick={() => scrollToSection("contact")}
              className="animate-pulse-gold w-full sm:w-auto"
            >
              RÉSERVER UNE CONSULTATION
            </Button>
            <Button
              variant="hero-outline"
              onClick={() => scrollToSection("services")}
              className="w-full sm:w-auto"
            >
              Découvrir nos services
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 pt-12 text-background/80">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">15+</p>
              <p className="text-sm">ans d'expérience</p>
            </div>
            <div className="h-12 w-px bg-background/30" />
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">200+</p>
              <p className="text-sm">entreprises accompagnées</p>
            </div>
            <div className="h-12 w-px bg-background/30" />
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">4.9/5</p>
              <p className="text-sm">satisfaction client</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={() => scrollToSection("why-benamou")}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce"
        aria-label="Scroll to next section"
      >
        <ChevronDown className="w-8 h-8 text-primary" />
      </button>
    </section>
  );
};

export default Hero;

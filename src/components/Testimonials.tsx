import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      quote:
        "En 6 mois, on est passés de 50K à 400K de CA. Benamou ne m'a pas vendu du rêve, il m'a donné la roadmap exacte. Et il a été là chaque semaine.",
      author: "Marc D.",
      role: "Fondateur Bellevue Cosmetics",
      rating: 5,
    },
    {
      quote:
        "J'allais fermer mon restaurant. Les marges étaient catastrophiques. Benamou a tout restructuré. Aujourd'hui je suis rentable et je dors la nuit.",
      author: "Sophie L.",
      role: "Propriétaire La Voile d'Or, Cannes",
      rating: 5,
    },
    {
      quote:
        "Levée de fonds de 2M€ en 4 mois. Le business plan qu'ils ont construit était tellement solide que les investisseurs se battaient. Merci les gars.",
      author: "Thomas R.",
      role: "CEO TechFlow",
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="py-20 md:py-32 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4">
            Des clients qui gagnent de l'argent
          </h2>
          <p className="text-xl text-muted-foreground">(et qui le disent)</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="hover-lift border-2 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-8 space-y-6">
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-primary text-primary"
                    />
                  ))}
                </div>

                {/* Quote Icon */}
                <Quote className="w-10 h-10 text-primary/20" />

                {/* Quote Text */}
                <blockquote className="text-foreground leading-relaxed italic">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="pt-4 border-t">
                  <p className="font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 mt-16 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary">Google Reviews</p>
            <p className="text-3xl font-display font-bold text-foreground">
              4.9/5
            </p>
          </div>
          <div className="h-16 w-px bg-border" />
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary">Entreprises</p>
            <p className="text-3xl font-display font-bold text-foreground">
              200+
            </p>
          </div>
          <div className="h-16 w-px bg-border" />
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary">Expertise</p>
            <p className="text-3xl font-display font-bold text-foreground">
              15 ans
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

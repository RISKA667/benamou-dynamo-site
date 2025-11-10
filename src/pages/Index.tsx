import Hero from "@/components/Hero";
import WhyBenamou from "@/components/WhyBenamou";
import Services from "@/components/Services";
import Method from "@/components/Method";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import CTAFinal from "@/components/CTAFinal";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <WhyBenamou />
      <Services />
      <Method />
      <Testimonials />
      <FAQ />
      <CTAFinal />
      <ContactForm />
      <Footer />
    </div>
  );
};

export default Index;

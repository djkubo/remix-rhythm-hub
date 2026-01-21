import { motion } from "framer-motion";
import { Check, ArrowRight, Shield, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const FinalCTA = () => {
  const benefits = [
    { icon: Zap, text: "Descarga masiva vía FTP (hasta 1TB/mes)" },
    { icon: Check, text: "Archivos Clean, listos para mezclar" },
    { icon: Shield, text: "Cancela cuando quieras, sin preguntas" },
    { icon: Clock, text: "Updates semanales con lo más nuevo" },
  ];

  return (
    <section className="relative py-24 md:py-32 bg-background-carbon">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <div className="glow-border relative overflow-hidden bg-gradient-to-b from-card-elevated to-card p-10 md:p-14">
            {/* Background accent */}
            <div className="absolute inset-0 hero-gradient opacity-50" />
            
            <div className="relative z-10 text-center">
              {/* Heading */}
              <h2 className="font-display text-display-sm md:text-display-md font-extrabold">
                ¿LISTO PARA DEJAR DE BUSCAR{" "}
                <span className="text-gradient-red">EN 5 POOLS?</span>
              </h2>

              <p className="mx-auto mt-6 max-w-xl text-muted-foreground font-sans text-lg">
                Una sola suscripción. Todo el contenido que necesitas. Desde <span className="text-foreground font-bold">$35/mes</span>.
              </p>

              {/* Benefits grid */}
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.text}
                    className="flex items-center gap-4 rounded-xl bg-secondary/40 border border-border/50 p-4 text-left transition-smooth hover:border-primary/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                      <benefit.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="font-sans text-sm font-medium text-foreground/90">{benefit.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="mt-12">
                <Button
                  asChild
                  size="lg"
                  className="btn-primary-glow animate-pulse-glow group h-16 w-full max-w-md px-10 text-lg font-bold sm:w-auto"
                >
                  <a href="https://videoremixespacks.com/plan">
                    QUIERO MI ACCESO AHORA
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>

              <p className="mt-8 font-bebas text-sm tracking-widest text-muted-foreground">
                FTP / AIR EXPLORER • 320KBPS / 1080P • SOPORTE INCLUIDO
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
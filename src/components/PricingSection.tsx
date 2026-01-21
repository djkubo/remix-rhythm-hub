import { motion } from "framer-motion";
import { Check, ArrowRight, Zap, Crown, Shield, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

const PricingSection = () => {
  const plans = [
    {
      name: "MENSUAL PRO",
      price: "$35",
      period: "USD / mes",
      badge: null,
      features: [
        "1TB Descargas mensuales",
        "Acceso FTP completo",
        "Updates Semanales",
      ],
      highlighted: false,
      cta: "Elegir Plan Mensual",
    },
    {
      name: "ANUAL ELITE",
      price: "$195",
      period: "USD / año",
      badge: "🔥 MEJOR VALOR (Ahorras 2 meses)",
      features: [
        "2TB Descargas (Doble Velocidad)",
        "Acceso FTP Prioritario",
        "Soporte VIP por WhatsApp",
      ],
      highlighted: true,
      cta: "Quiero el Plan ELITE",
    },
  ];

  return (
    <section id="pricing" className="relative py-20 md:py-28 bg-background overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 hero-gradient opacity-30" />
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: "40px 40px"
        }}
      />

      <div className="container relative z-10 mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-3xl font-bold md:text-4xl lg:text-5xl xl:text-6xl">
            PLANES SIMPLES.{" "}
            <span className="text-gradient-red">VALOR REAL.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-sans text-lg text-muted-foreground">
            El tiempo es tu activo más caro. Deja de perderlo buscando música en 5 lugares diferentes.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:items-center">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`group relative rounded-3xl transition-all duration-500 ${
                plan.highlighted
                  ? "md:scale-105 md:-my-4"
                  : ""
              }`}
            >
              {/* Card */}
              <div
                className={`relative h-full overflow-hidden rounded-3xl p-8 md:p-10 ${
                  plan.highlighted
                    ? "border-2 border-primary bg-gradient-to-br from-primary/20 via-card/80 to-card/60 shadow-[0_0_60px_rgba(175,28,28,0.3)]"
                    : "border border-white/10 bg-card/40 backdrop-blur-md"
                }`}
              >
                {/* Glow effect for highlighted */}
                {plan.highlighted && (
                  <div className="absolute -inset-px -z-10 rounded-3xl bg-gradient-to-br from-primary/40 via-orange-500/20 to-transparent blur-xl" />
                )}

                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-px left-0 right-0 flex justify-center">
                    <span className="inline-flex items-center gap-2 rounded-b-xl bg-gradient-to-r from-primary via-red-500 to-orange-500 px-6 py-2 text-sm font-bold text-white shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className={`text-center ${plan.badge ? "mt-6" : ""}`}>
                  <h3 className="font-display text-xl font-bold text-muted-foreground">
                    Plan {plan.name}
                  </h3>
                  <div className="mt-6 flex items-baseline justify-center gap-2">
                    <span
                      className={`font-display text-5xl font-black md:text-6xl lg:text-7xl ${
                        plan.highlighted
                          ? "bg-gradient-to-r from-primary via-red-500 to-orange-500 bg-clip-text text-transparent"
                          : "text-foreground"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span className="font-sans text-base text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  {plan.highlighted && (
                    <p className="mt-2 text-sm text-green-400 font-medium">
                      Equivale a solo $16.25/mes
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="my-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Features */}
                <ul className="mb-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          plan.highlighted
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </div>
                      <span className="font-sans text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  asChild
                  size="lg"
                  className={`w-full h-14 text-base font-bold transition-all duration-300 hover:scale-[1.02] ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-primary via-red-600 to-orange-500 shadow-lg shadow-primary/30 hover:shadow-primary/50"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  <a href="https://videoremixespacks.com/plan">
                    {plan.highlighted && <Zap className="mr-2 h-5 w-5" />}
                    {plan.cta}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Guarantee Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-card/50 px-6 py-4 backdrop-blur-sm">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-sans text-foreground">
              <strong className="text-primary">Prueba de Fuego:</strong> 7 Días Gratis (100GB).
              Entra, mira y descarga. Si no te gusta, cancelas.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;

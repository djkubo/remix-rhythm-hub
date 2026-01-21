import { motion } from "framer-motion";
import { CloudLightning, FolderCheck, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: CloudLightning,
    title: "Descarga Masiva FTP",
    description: "Conecta tu Air Explorer o FileZilla. Baja 500GB mientras duermes. Olvídate del clic por clic.",
  },
  {
    icon: FolderCheck,
    title: "Organización Semanal",
    description: "Todo etiquetado perfectamente. Cero carpetas basura. Cero logos molestos.",
  },
  {
    icon: ShieldCheck,
    title: "Calidad Garantizada",
    description: "Audio y Video de alta calidad. Si no sirve para tocar, no lo subimos.",
  },
];

const PremiumFeaturesSection = () => {
  return (
    <section className="relative py-20 md:py-28 bg-background overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 hero-gradient opacity-40" />
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: "40px 40px"
        }}
      />

      <div className="container relative z-10 mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Tecnología Premium
          </span>
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl lg:text-5xl">
            Características{" "}
            <span className="text-gradient-red">de Élite</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Herramientas diseñadas para DJs profesionales que valoran su tiempo.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group relative"
            >
              {/* Glassmorphism Card */}
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-8 backdrop-blur-xl transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_40px_rgba(175,28,28,0.15)]">
                {/* Glow effect on hover */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                
                {/* Icon Container */}
                <div className="relative mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-sm">
                    <feature.icon className="h-8 w-8 text-primary" strokeWidth={1.5} />
                  </div>
                  {/* Floating glow behind icon */}
                  <div className="absolute -inset-2 -z-10 rounded-2xl bg-primary/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-60" />
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className="mb-3 font-display text-xl font-bold text-foreground md:text-2xl">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Corner accent */}
                <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all duration-500 group-hover:bg-primary/20" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumFeaturesSection;

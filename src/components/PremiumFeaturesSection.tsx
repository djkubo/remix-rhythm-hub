import { motion } from "framer-motion";
import { CloudLightning, FolderCheck, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: CloudLightning,
    title: "Descarga Masiva FTP",
    description: "Conecta Air Explorer o FileZilla. Baja todo de golpe mientras duermes.",
  },
  {
    icon: FolderCheck,
    title: "Organización Perfecta",
    description: "Todo etiquetado por género, BPM y año. Cero carpetas basura.",
  },
  {
    icon: ShieldCheck,
    title: "Calidad Garantizada",
    description: "MP3 320kbps + Video 1080p. Si no sirve para tocar, no lo subimos.",
  },
];

const PremiumFeaturesSection = () => {
  return (
    <section className="relative py-24 md:py-32 bg-background-carbon overflow-hidden">
      <div className="absolute inset-0 hero-gradient opacity-30" />

      <div className="container relative z-10 mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="badge-primary mb-6">
            Tecnología Premium
          </span>
          <h2 className="font-display text-display-sm md:text-display-md font-extrabold">
            Herramientas{" "}
            <span className="text-gradient-red">Profesionales</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Diseñadas para DJs que valoran su tiempo.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-3 md:gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group"
            >
              <div className="glass-card-hover h-full p-8">
                {/* Icon */}
                <div className="relative mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 group-hover:bg-primary/25 transition-smooth">
                    <feature.icon className="h-8 w-8 text-primary" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Content */}
                <h3 className="mb-3 font-display text-xl font-bold tracking-wide md:text-2xl">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumFeaturesSection;
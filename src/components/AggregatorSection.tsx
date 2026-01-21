import { motion } from "framer-motion";
import { DollarSign, Trash2, Tag, Gift } from "lucide-react";

const AggregatorSection = () => {
  const features = [
    {
      icon: DollarSign,
      title: "Pagamos los Pools",
      description: "Nosotros nos suscribimos a múltiples fuentes. Tú pagas solo una."
    },
    {
      icon: Trash2,
      title: "Filtramos la Basura",
      description: "Solo los éxitos. Cero relleno. Cero versiones inútiles."
    },
    {
      icon: Tag,
      title: "Corregimos los Tags",
      description: "Metadata perfecta: Artista, Título, BPM, Género."
    },
    {
      icon: Gift,
      title: "Entrega Limpia",
      description: "Sin logos, sin marcas de agua. Archivos profesionales."
    }
  ];

  return (
    <section className="relative py-24 md:py-32 bg-background-carbon">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-5xl"
        >
          <div className="glow-border bg-gradient-to-b from-card-elevated to-card p-8 md:p-14">
            {/* Header */}
            <div className="text-center mb-14">
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="badge-primary mb-6"
              >
                MODELO AGREGADOR
              </motion.span>
              
              <h2 className="font-display text-display-sm md:text-display-md font-extrabold">
                NOSOTROS PAGAMOS LOS POOLS{" "}
                <span className="text-gradient-red">POR TI.</span>
              </h2>
              
              <p className="mt-6 max-w-2xl mx-auto font-sans text-lg text-muted-foreground">
                No pagues 5 membresías. Paga solo una. Nosotros hacemos el trabajo sucio 
                y te lo entregamos en bandeja de plata.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group flex flex-col items-center text-center p-6 rounded-2xl bg-secondary/40 border border-border/50 transition-smooth hover:border-primary/30 hover:bg-secondary/60"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 group-hover:bg-primary/25 transition-smooth">
                    <feature.icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-lg font-bold tracking-wide">{feature.title}</h3>
                  <p className="mt-2 font-sans text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AggregatorSection;
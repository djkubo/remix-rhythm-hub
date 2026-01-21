import { motion } from "framer-motion";
import { FolderCheck, MonitorPlay, HeadphonesIcon } from "lucide-react";

const TrustBar = () => {
  const rules = [
    {
      icon: FolderCheck,
      title: "Organización Suprema",
      description: "Por género, BPM y año."
    },
    {
      icon: MonitorPlay,
      title: "Calidad Profesional",
      description: "MP3 320kbps + Video 1080p."
    },
    {
      icon: HeadphonesIcon,
      title: "Archivos Clean",
      description: "Sin logos. Sin marcas."
    }
  ];

  return (
    <section className="relative py-16 md:py-20 bg-background section-divider">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h3 className="font-bebas text-xl md:text-2xl tracking-widest text-muted-foreground">
            NUESTRAS REGLAS DE ORO
          </h3>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-3 max-w-4xl mx-auto">
          {rules.map((rule, index) => (
            <motion.div
              key={rule.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-center gap-4 p-5 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/50 transition-smooth hover:border-primary/30 hover:bg-card/60"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <rule.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="font-display text-base font-bold tracking-wide text-foreground">{rule.title}</h4>
                <p className="font-sans text-sm text-muted-foreground">{rule.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
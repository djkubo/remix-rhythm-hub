import { motion } from "framer-motion";
import { Music, Mic2, PartyPopper, Disc, Radio } from "lucide-react";

const DJTodoterrenoSection = () => {
  const genres = [
    { icon: Music, name: "Cumbia Wepa" },
    { icon: Disc, name: "Afro House" },
    { icon: Mic2, name: "Karaoke HD" },
    { icon: PartyPopper, name: "Reggaeton Old School" },
    { icon: Radio, name: "Bachata Sensual" },
  ];

  return (
    <section className="relative py-24 md:py-32 bg-background-carbon">
      <div className="container mx-auto">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-display-sm md:text-display-md font-extrabold">
              PARA EL DJ QUE{" "}
              <span className="text-gradient-red">TOCA DE TODO.</span>
            </h2>
          </motion.div>

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-8 md:p-12"
          >
            <div className="text-center">
              <p className="font-sans text-xl md:text-2xl text-muted-foreground leading-relaxed">
                ¿Te piden <span className="text-foreground font-semibold">Cumbia Wepa</span>, luego{" "}
                <span className="text-foreground font-semibold">Afro House</span> y cierras con{" "}
                <span className="text-foreground font-semibold">Karaoke</span>?
              </p>
              
              <p className="mt-6 font-display text-2xl md:text-3xl font-bold text-primary">
                Lo tenemos cubierto.
              </p>
              
              <p className="mt-4 font-sans text-lg text-muted-foreground">
                Desde Cumbia Lagunera hasta Reggaeton Old School.{" "}
                <span className="text-foreground font-bold">Nunca más digas "no la tengo".</span>
              </p>
            </div>

            {/* Genre Pills */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {genres.map((genre, index) => (
                <motion.div
                  key={genre.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.08 }}
                  className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-5 py-3 transition-smooth hover:bg-primary/20 hover:scale-105"
                >
                  <genre.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  <span className="font-sans font-medium text-foreground">{genre.name}</span>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: "60+", label: "Géneros" },
                { value: "50K+", label: "Archivos" },
                { value: "1080p", label: "Video HD" },
                { value: "320k", label: "Audio MP3" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="font-display text-3xl md:text-4xl font-extrabold text-primary">
                    {stat.value}
                  </div>
                  <div className="mt-1 font-bebas text-sm tracking-widest text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DJTodoterrenoSection;
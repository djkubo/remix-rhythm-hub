import { motion } from "framer-motion";
import { FolderCheck, MonitorPlay, HeadphonesIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TrustBar = () => {
  const { t } = useLanguage();

  const rules = [
    {
      icon: FolderCheck,
      title: t("trustbar.rule1.title"),
      description: t("trustbar.rule1.desc"),
    },
    {
      icon: MonitorPlay,
      title: t("trustbar.rule2.title"),
      description: t("trustbar.rule2.desc"),
    },
    {
      icon: HeadphonesIcon,
      title: t("trustbar.rule3.title"),
      description: t("trustbar.rule3.desc"),
    },
  ];

  return (
    <section className="relative py-16 md:py-20 bg-background">
      {/* Subtle top border for light mode */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h3 className="font-bebas text-xl md:text-2xl tracking-widest text-zinc-400">
            {t("trustbar.title")}
          </h3>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-3 max-w-4xl mx-auto">
          {rules.map((rule, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-center gap-4 p-5 rounded-2xl bg-[#111111] border border-[#5E5E5E] transition-all duration-300 hover:border-primary/30 hover:shadow-md dark:hover:shadow-glow dark:bg-[#111111]/60"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/15">
                <rule.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="font-bebas text-base font-bold tracking-wide text-[#EFEFEF]">
                  {rule.title}
                </h4>
                <p className="font-sans text-sm text-zinc-400">{rule.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;

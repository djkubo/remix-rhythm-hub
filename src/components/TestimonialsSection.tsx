import { motion } from "framer-motion";
import { CheckCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface WhatsAppChatProps {
  name: string;
  text: string;
  time: string;
  groupName: string;
  emoji: string;
  delay: number;
}

const WhatsAppChat = ({ name, text, time, groupName, emoji, delay }: WhatsAppChatProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="w-full"
  >
    {/* WhatsApp Header */}
    <div className="flex items-center gap-2.5 rounded-t-xl border border-[#5E5E5E] bg-[#111111] px-3 py-2.5">
      {/* Avatar */}
      <div className="relative">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#5E5E5E] bg-[#070707]">
          <span className="text-base">{emoji}</span>
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#111111] bg-[#AA0202]" />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold text-sm truncate">
          {groupName}
        </h3>
        <p className="text-[11px] text-[#5E5E5E]">
          en línea
        </p>
      </div>
    </div>

    {/* Chat Background */}
    <div className="relative min-h-[120px] bg-[#070707] px-3 py-4">
      
      {/* Message bubble */}
      <div className="relative z-10 flex justify-start">
        <div className="relative max-w-[90%]">
          {/* Bubble tail */}
          <div className="absolute -left-2 top-0 w-3 h-3 overflow-hidden">
            <div className="absolute left-1.5 top-0 h-3 w-3 origin-bottom-left rotate-45 transform bg-[#111111]" />
          </div>
          
          {/* Bubble */}
          <div className="relative rounded-lg rounded-tl-none border border-[#5E5E5E] bg-[#111111] px-3 py-2 shadow-sm">
            <p className="mb-1 text-xs font-semibold text-[#AA0202]">
              {name}
            </p>
            <p className="pr-12 text-sm leading-relaxed text-[#EFEFEF]">
              {text}
            </p>
            <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
              <span className="text-[10px] text-[#5E5E5E]">
                {time}
              </span>
              <CheckCheck className="h-3.5 w-3.5 text-[#5E5E5E]" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Input Bar */}
    <div className="flex items-center gap-2 rounded-b-xl border border-[#5E5E5E] bg-[#111111] px-2.5 py-2">
      <div className="flex-1 rounded-full border border-[#5E5E5E] bg-[#070707] px-3 py-1.5">
        <span className="text-xs text-[#5E5E5E]">
          Mensaje...
        </span>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#AA0202] transition-colors hover:bg-[#8A0101]">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
        </svg>
      </div>
    </div>
  </motion.div>
);

const TestimonialsSection = () => {
  const { t } = useLanguage();

  const testimonials = [
    {
      name: t("testimonialCard1.name"),
      text: t("testimonialCard1.text"),
      time: "14:32",
      groupName: "Club DJs MX 🇲🇽",
      emoji: "🎵",
    },
    {
      name: t("testimonialCard2.name"),
      text: t("testimonialCard2.text"),
      time: "18:45",
      groupName: "DJs Latinos 🔥",
      emoji: "🎧",
    },
    {
      name: t("testimonialCard3.name"),
      text: t("testimonialCard3.text"),
      time: "21:15",
      groupName: "Pool Hunters 💎",
      emoji: "🎤",
    },
  ];

  return (
    <section className="relative bg-[#070707] py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <h2 className="mb-3 font-display text-4xl font-bold md:text-5xl lg:text-6xl text-foreground">
            {t("testimonialCard.title")}
          </h2>
          <p className="font-sans text-lg text-muted-foreground">
            {t("testimonialCard.subtitle")}
          </p>
        </motion.div>

        {/* Grid de 3 chats de WhatsApp */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <WhatsAppChat
              key={index}
              name={testimonial.name}
              text={testimonial.text}
              time={testimonial.time}
              groupName={testimonial.groupName}
              emoji={testimonial.emoji}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

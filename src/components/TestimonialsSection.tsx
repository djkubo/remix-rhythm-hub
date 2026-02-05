import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface WhatsAppMessageProps {
  name: string;
  text: string;
  time: string;
  delay: number;
  isLast?: boolean;
}

const WhatsAppMessage = ({ name, text, time, delay, isLast }: WhatsAppMessageProps) => (
  <motion.div
    initial={{ opacity: 0, y: 15, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    viewport={{ once: true }}
    className="flex justify-start"
  >
    <div className="relative max-w-[85%] md:max-w-[70%]">
      {/* WhatsApp bubble tail */}
      <div className="absolute -left-2 top-0 w-4 h-4 overflow-hidden">
        <div className="absolute top-0 left-2 w-4 h-4 bg-[#DCF8C6] dark:bg-[#025C4C] rotate-45 transform origin-bottom-left" />
      </div>
      
      {/* Message bubble */}
      <div className="relative bg-[#DCF8C6] dark:bg-[#025C4C] rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
        {/* Sender name */}
        <p className="text-xs font-semibold text-[#25D366] dark:text-[#34B7F1] mb-1">
          {name}
        </p>
        
        {/* Message text */}
        <p className="text-sm text-[#111B21] dark:text-[#E9EDEF] leading-relaxed pr-14">
          {text}
        </p>
        
        {/* Time and checkmarks */}
        <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
          <span className="text-[10px] text-[#667781] dark:text-[#8696A0]">
            {time}
          </span>
          <CheckCheck className="h-4 w-4 text-[#53BDEB]" strokeWidth={2} />
        </div>
      </div>
    </div>
  </motion.div>
);

const TestimonialsSection = () => {
  const { t } = useLanguage();

  const messages = [
    {
      name: t("testimonialCard1.name"),
      text: t("testimonialCard1.text"),
      time: "18:42",
    },
    {
      name: t("testimonialCard2.name"),
      text: t("testimonialCard2.text"),
      time: "18:45",
    },
    {
      name: t("testimonialCard3.name"),
      text: t("testimonialCard3.text"),
      time: "18:47",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 bg-muted/30 dark:bg-background-carbon">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="mb-3 font-display text-4xl font-bold md:text-5xl lg:text-6xl text-foreground">
            {t("testimonialCard.title")}
          </h2>
          <p className="font-sans text-lg text-muted-foreground">
            {t("testimonialCard.subtitle")}
          </p>
        </motion.div>

        {/* WhatsApp Chat Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto max-w-lg"
        >
          {/* WhatsApp Header */}
          <div className="bg-[#008069] dark:bg-[#1F2C33] rounded-t-2xl px-4 py-3 flex items-center gap-3">
            {/* Group avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#DFE5E7] dark:bg-[#6B7C85] flex items-center justify-center overflow-hidden">
                <span className="text-lg">🎧</span>
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#25D366] rounded-full border-2 border-[#008069] dark:border-[#1F2C33]" />
            </div>
            
            {/* Group info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">
                DJs Satisfechos
              </h3>
              <p className="text-[#B5D1CD] dark:text-[#8696A0] text-xs truncate">
                +1,500 miembros activos
              </p>
            </div>
          </div>

          {/* Chat Background with pattern */}
          <div 
            className="relative px-3 py-4 space-y-3 min-h-[280px]"
            style={{
              backgroundColor: '#ECE5DD',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c5baaf' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {/* Dark mode overlay */}
            <div className="dark:absolute dark:inset-0 dark:bg-[#0B141A] dark:opacity-100 pointer-events-none" 
              style={{ display: 'none' }}
            />
            <div className="hidden dark:block absolute inset-0 bg-[#0B141A]" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.8'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            
            {/* Messages */}
            <div className="relative z-10 space-y-3">
              {messages.map((message, index) => (
                <WhatsAppMessage
                  key={index}
                  name={message.name}
                  text={message.text}
                  time={message.time}
                  delay={index * 0.15}
                  isLast={index === messages.length - 1}
                />
              ))}
            </div>
          </div>

          {/* WhatsApp Input Bar */}
          <div className="bg-[#F0F2F5] dark:bg-[#1F2C33] rounded-b-2xl px-3 py-2 flex items-center gap-2">
            <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-full px-4 py-2 flex items-center">
              <span className="text-sm text-[#667781] dark:text-[#8696A0]">
                Escribe un mensaje...
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#008069] dark:bg-[#00A884] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

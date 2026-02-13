import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FaqItem = {
  id: string;
  q: string;
  a: string;
};

const FAQS: FaqItem[] = [
  {
    q: "¿Cómo hago para descargar?",
    a: "Se acabaron los links lentos de Google Drive. Te damos acceso directo a nuestros servidores premium vía FTP (recomendamos Air Explorer). Seleccionas carpetas enteras de 50GB y se descargan de golpe.",
    id: "faq-1",
  },
  {
    q: "¿Por qué piden tarjeta para la prueba gratis?",
    a: "Es un filtro de calidad para evitar abusos a nuestros servidores. Si en 7 días no ves el valor, cancelas con un clic en tu panel y no se te cobra un solo centavo. Tienes 100GB para ponernos a prueba.",
    id: "faq-2",
  },
];

export default function FaqSection() {
  return (
    <section className="bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Preguntas Frecuentes</h2>
        <p className="mt-3 text-center text-zinc-400">Todo claro, sin letras pequeñas.</p>

        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {FAQS.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4"
            >
              <AccordionTrigger className="py-4 text-left text-zinc-100 hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-zinc-400">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

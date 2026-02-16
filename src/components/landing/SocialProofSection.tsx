import WhatsAppProof, { type WhatsAppProofMessage } from "@/components/WhatsAppProof";

const MESSAGES: WhatsAppProofMessage[] = [
  { id: "m1", text: "Ya lo compré bro, ya hasta me llegó. Saludos!" },
  { id: "m2", text: "Muchas gracias, ya las descargué todas. Muy buena música." },
  { id: "m3", text: "Si el material es bueno, vale la pena. Excelente Gustavo." },
];

export default function SocialProofSection() {
  return (
    <section className="bg-[#070707] px-4 pb-12 pt-10 md:pb-16 md:pt-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-bebas text-4xl uppercase text-[#EFEFEF] md:text-5xl">
          DJs reales. Resultados reales.
        </h2>
        <p className="mb-10 mt-3 text-center font-sans text-muted-foreground">
          Cero inventos. Mensajes reales de DJs que ya descargan y mezclan nuestra música.
        </p>

        <WhatsAppProof messages={MESSAGES} />
      </div>
    </section>
  );
}

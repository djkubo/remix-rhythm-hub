import { CreditCard, HardDriveDownload, Server } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <section className="bg-zinc-950 px-4 pb-12 pt-6 md:pb-16 md:pt-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-white md:text-3xl">
          ¿CÓMO FUNCIONA?
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-[#25D366]">
              <CreditCard />
            </div>
            <p className="mt-4 text-base font-semibold text-white">La Prueba de Fuego</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              7 días gratis y 100GB de descarga. Requiere tarjeta por seguridad, pero si no te
              convence, cancelas con un clic. No pagas nada hoy.
            </p>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-[#25D366]">
              <Server />
            </div>
            <p className="mt-4 text-base font-semibold text-white">Conecta tu Gestor FTP</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Usa Air Explorer o FileZilla. Te damos un video tutorial de 2 minutos y soporte
              'Anti-Estrés' para conectarte al instante.
            </p>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-[#25D366]">
              <HardDriveDownload />
            </div>
            <p className="mt-4 text-base font-semibold text-white">Descarga Mientras Duermes</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Olvídate del clic-por-canción. Selecciona las carpetas del mes, dale descargar,
              vete a dormir y despierta con tu biblioteca lista.
            </p>
          </article>
        </div>

        <div className="mt-6 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-center text-sm font-semibold text-white md:text-base">
          💎 Filosofía VRP: Calidad sobre cantidad. Sin logos visuales, intros limpios y etiquetas
          perfectas.
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ExitIntentPopup from "@/components/ExitIntentPopup";

export default function TestPopup() {
  const [showInstructions, setShowInstructions] = useState(true);

  const clearSessionStorage = () => {
    sessionStorage.removeItem("exit-popup-dismissed");
    sessionStorage.removeItem("user-has-interacted");
    window.location.reload();
  };

  const checkSessionStorage = () => {
    const dismissed = sessionStorage.getItem("exit-popup-dismissed");
    const interacted = sessionStorage.getItem("user-has-interacted");
    
    alert(`Estado del SessionStorage:
    
✅ Modal cerrado: ${dismissed ? "Sí" : "No"}
✅ Usuario interactuó: ${interacted ? "Sí (REMOVIDO - ya no afecta)" : "No"}

El modal debería aparecer en:
• 45 segundos desde que cargó la página
• Cuando muevas el cursor hacia arriba (exit intent)
    `);
  };

  return (
    <div className="min-h-screen bg-[#070707] p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">🧪 Test de Exit Intent Popup</h1>
        
        {showInstructions && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">📋 Instrucciones:</h2>
            <ol className="list-decimal list-inside space-y-2 mb-4">
              <li className="font-medium">Abre la consola del navegador (F12 o Cmd+Option+I)</li>
              <li>Verás mensajes con emoji 🎯 cuando el modal se active</li>
              <li className="text-primary font-bold">El modal aparecerá en 45 segundos automáticamente</li>
              <li>O mueve el cursor hacia ARRIBA (como si cerraras la pestaña)</li>
              <li>Si no aparece, usa los botones de abajo para debuggear</li>
            </ol>
            <Button onClick={() => setShowInstructions(false)} variant="outline">
              Entendido, ocultar instrucciones
            </Button>
          </div>
        )}

        <div className="space-y-4 bg-[#111111] p-6 rounded-lg border">
          <h2 className="text-2xl font-bold mb-4">🛠️ Herramientas de Debug</h2>
          
          <div className="grid gap-4">
            <Button 
              onClick={clearSessionStorage}
              className="w-full"
              size="lg"
            >
              🔄 Resetear Modal (Recarga la página)
            </Button>
            
            <Button 
              onClick={checkSessionStorage}
              variant="outline"
              className="w-full"
              size="lg"
            >
              🔍 Ver Estado del Modal
            </Button>
          </div>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-bold mb-2">📊 Cambios Realizados:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✅</span>
                <span><strong>Eliminado:</strong> Restricción de "user-has-interacted"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✅</span>
                <span><strong>Agregado:</strong> Timer de 45 segundos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✅</span>
                <span><strong>Mejorado:</strong> Logs en consola para debug</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">❌</span>
                <span><strong>Removido:</strong> Bloqueo por clicks en botones</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">❌</span>
                <span><strong>Removido:</strong> Bloqueo por scroll del 70%</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <h3 className="font-bold mb-2 text-yellow-700 dark:text-yellow-400">⚠️ Nota Importante:</h3>
            <p className="text-sm">
              El modal solo aparece UNA VEZ por sesión. Si ya apareció y lo cerraste, 
              debes usar el botón "Resetear Modal" para verlo de nuevo.
            </p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-[#111111] border rounded-lg">
          <h2 className="text-xl font-bold mb-4">🎯 Cómo Probar el Exit Intent</h2>
          <div className="space-y-3 text-sm">
            <p><strong>Método 1 (Timer):</strong> Espera 45 segundos en esta página</p>
            <p><strong>Método 2 (Mouse Leave):</strong> Mueve el cursor rápidamente hacia la parte superior de la ventana (hacia la barra de tabs)</p>
            <p><strong>En móvil:</strong> El timer de 45 segundos es la forma principal</p>
          </div>
        </div>
      </div>

      {/* El popup en acción */}
      <ExitIntentPopup />
    </div>
  );
}

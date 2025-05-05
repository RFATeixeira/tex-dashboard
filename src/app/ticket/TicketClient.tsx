"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth"; // Importando o Firebase Auth
import { auth } from "@/lib/firebaseConfig"; // Ajuste o caminho conforme necessário
import Sidebar from "../components/Sidebar";
import Presentation from "../components/Presentation";

export default function TicketPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Estado de carregamento
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Se não estiver autenticado, redireciona para a página de login
        router.push("/login");
      } else {
        setLoading(false); // Se estiver autenticado, pode mostrar o conteúdo da página
      }
    });

    // Limpar o listener ao desmontar o componente
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-700">
        Carregando...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        onLogout={function (): void {
          throw new Error("Function not implemented.");
        }}
      />
      <main className="flex-1 p-6 md:p-8 text-gray-700">
        <Presentation pageDescription="Entre em contato conosco!" />

        <h1 className="text-2xl font-bold mb-6">Boletos</h1>

        {message && <p className="mb-4 text-green-500">{message}</p>}
      </main>
    </div>
  );
}

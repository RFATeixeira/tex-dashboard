"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth"; // Importando o Firebase Auth
import { auth } from "@/lib/firebaseConfig"; // Ajuste o caminho conforme necessário
import Sidebar from "../components/Sidebar";
import Presentation from "../components/Presentation";

export default function SupportPage() {
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

        <h1 className="text-2xl font-bold mb-6">Suporte</h1>

        {message && <p className="mb-4 text-green-500">{message}</p>}

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Entre em contato</h2>
          <p className="text-gray-600">
            Se você precisar de ajuda ou tiver alguma dúvida, entre em contato
            conosco através dos seguintes canais:
          </p>
          <ul className="list-disc pl-6 mt-4 text-gray-700">
            <li>
              Email:{" "}
              <a
                href="mailto:rcsteixeira@hotmail.com"
                className="text-purple-600 hover:underline"
              >
                rcsteixeira@hotmail.com
              </a>
            </li>
            <li>
              Instagram:{" "}
              <a
                href="https://www.instagram.com/rfateixeira"
                className="text-purple-600 hover:underline"
                target="_blank"
              >
                @rfateixeira
              </a>
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Nosso Suporte</h2>
          <p className="text-gray-600">
            Estamos à disposição para ajudá-lo com qualquer dúvida ou problema
            que você possa ter. Não hesite em nos enviar uma mensagem!
          </p>
        </div>

        {/* Caso queira incluir algum formulário de contato, você pode adicionar aqui */}
      </main>
    </div>
  );
}

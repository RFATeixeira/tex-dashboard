"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function HomePage() {
  const router = useRouter();

  // Redireciona se já estiver logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 relative flex flex-col">
      <header className="absolute top-4 right-4">
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-[#8B5CF6] hover:bg-[#9E6EFE] text-white rounded-lg transition duration-200 ease-in-out cursor-pointer p-3"
        >
          Faça o Login
        </button>
      </header>

      <main className="m-auto w-full pt-20 sm:pt-8 py-8 px-8 md:px-20 xl:px-40 bg-white rounded-2xl">
        <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-center text-[#272727]">
          Bem-vindo ao
          <p className="font-bold text-[#8B5CF6]">
            <span>T</span>
            <span className="text-[#272727]">ex </span>
            <span>F</span>
            <span className="text-[#272727]">inance </span>
            <span>D</span>
            <span className="text-[#272727]">ashboard</span>
          </p>
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Monitore suas métricas, acompanhe tarefas e visualize insights em
          tempo real.
        </p>

        {/* Prints da página */}
        <section className="mb-12">
          <h3 className="text-xl sm:text-2xl font-semibold text-[#272727] text-center mb-4">
            Destaques do Dashboard
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-200 rounded-lg overflow-hidden shadow-2xl">
              <img
                src="Transaction.png"
                alt="Print 1"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="bg-gray-200 rounded-lg overflow-hidden shadow-2xl">
              <img
                src="Dashboard.png"
                alt="Print 2"
                className="object-cover w-full h-full"
              />
            </div>
            <div className=" bg-gray-200 rounded-lg overflow-hidden shadow-2xl">
              <img
                src="Wallet.png"
                alt="Print 3"
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </section>

        {/* Descrição bacana */}
        <section className="mb-12">
          <h3 className="text-xl sm:text-2xl font-semibold text-[#272727] text-center mb-4">
            Como o Tex pode te ajudar?
          </h3>
          <p className="text-center text-gray-600 max-w-2xl mx-auto">
            O TeX Finance Dashboard oferece uma visão clara e completa de suas
            finanças. Com a nossa plataforma, você pode gerenciar seu saldo,
            acompanhar ganhos e gastos, além de organizar suas tarefas de
            maneira intuitiva e eficaz. Comece hoje e tome o controle de sua
            vida financeira!
          </p>
        </section>

        {/* Imagens de pessoas cuidando das finanças */}
        <section className="mb-12">
          <h3 className="text-xl sm:text-2xl font-semibold text-[#272727] text-center mb-4">
            Pessoas que confiam no Tex
          </h3>
          <div className="flex justify-around">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-full overflow-hidden">
              <img
                src="AnaClara.png"
                alt="Pessoa 1"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-full overflow-hidden">
              <img
                src="CauaneCarmanini.png"
                alt="Pessoa 2"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-full overflow-hidden">
              <img
                src="CiceroTeixeira.png"
                alt="Pessoa 3"
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </section>

        {/* Feedbacks fictícios */}
        <section className="mb-12">
          <h3 className="text-xl sm:text-2xl font-semibold text-[#272727] text-center mb-4">
            O que nossos usuários estão dizendo
          </h3>
          <div className="space-y-4">
            <blockquote className="text-center text-gray-600 italic">
              "Com o Tex Finance Dashboard, finalmente consegui controlar minhas
              finanças de forma simples e rápida!"
            </blockquote>
            <blockquote className="text-center text-gray-600 italic">
              "Eu adoro a interface limpa e a possibilidade de ver tudo em um só
              lugar. Recomendo para todos!"
            </blockquote>
            <blockquote className="text-center text-gray-600 italic">
              "O melhor painel de finanças que já usei. Facilidade de uso e
              muitos insights para melhorar meu controle."
            </blockquote>
          </div>
        </section>
      </main>
    </div>
  );
}

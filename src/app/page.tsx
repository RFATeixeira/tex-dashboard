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
    <div className="min-h-screen bg-gray-50 relative flex p-6">
      <header className="absolute top-4 right-4">
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white  rounded-lg transition duration-200 ease-in-out cursor-pointer p-3"
        >
          Faça o Login
        </button>
      </header>

      <main className="m-auto w-full max-w-4xl p-8 bg-white shadow-lg rounded-2xl">
        <h1 className="text-4xl font-bold mb-6 text-center text-[#272727]">
          Bem-vindo ao
          <h2 className="font-bold text-purple-600">
            <span>T</span>
            <span className="text-[#272727]">ex </span>
            <span>F</span>
            <span className="text-[#272727]">inance </span>
            <span>D</span>
            <span className="text-[#272727]">ashboard</span>
          </h2>
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Monitore suas métricas, acompanhe tarefas e visualize insights em
          tempo real.
        </p>
        <div className="grid grid-cols-3 gap-6">
          <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-32 bg-gray-200 rounded-lg animate-pulse col-span-2" />
          <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { loginUser } from "@/lib/auth";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Se já estiver logado, manda pro dashboard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    try {
      await loginUser(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <h2 className=" fixed top-14 text-2xl font-bold text-purple-600 mb-8 text-center">
        <div>
          <span>T</span>
          <span className="text-[#272727]">ex</span>
        </div>
        <div>
          <span>D</span>
          <span className="text-[#272727]">ashboard</span>
        </div>
      </h2>
      <div className="bg-white shadow-lg rounded-lg p-8 w-full sm:w-[90%] md:w-[60%] lg:w-[40%] xl:w-[30%]">
        <h1 className="text-3xl font-semibold text-center text-purple-600 mb-6">
          Login
        </h1>

        <input
          type="email"
          placeholder="E-mail"
          className="text-gray-600 border border-gray-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          className="text-gray-600 border border-gray-300 p-3 rounded-lg w-full mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition duration-200 ease-in-out cursor-pointer"
          disabled={!email || !password}
        >
          Entrar
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-purple-600 hover:underline">
              Registre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

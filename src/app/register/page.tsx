"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      return setError("Preencha todos os campos.");
    }

    if (password !== confirmPassword) {
      return setError("As senhas não coincidem.");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, { displayName: name });

      // Salvar nome no Firestore (opcional)
      const db = getFirestore();
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        createdAt: new Date(),
      });

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
          Registro
        </h1>

        <input
          type="text"
          placeholder="Nome"
          className="text-gray-600 border border-gray-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          className="text-gray-600 border border-gray-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Repetir senha"
          className="text-gray-600 border border-gray-300 p-3 rounded-lg w-full mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <button
          onClick={handleRegister}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition duration-200 ease-in-out cursor-pointer"
        >
          Registrar
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-purple-600 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [lastSeenNotifications, setLastSeenNotifications] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

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

      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Criar documento no Firestore com segurança
      const db = getFirestore();
      const userRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userRef, {
        name,
        email,
        profileImage: userCredential.user.photoURL || "",
        createdAt: serverTimestamp(),
        lastSeenNotifications,
      });

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Este e-mail já está em uso.");
          break;
        case "auth/invalid-email":
          setError("E-mail inválido.");
          break;
        case "auth/weak-password":
          setError("A senha deve ter pelo menos 6 caracteres.");
          break;
        default:
          setError("Erro ao criar conta. Tente novamente.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="fixed flex flex-col items-center justify-center top-0">
        <img
          className="w-40 h-40"
          src="../../../TexFinanceDashboard_Logo_no_bg.png"
          alt="Tex Finance Dashboard Logo"
        />
        <p className="text-gray-600 font-medium text-2xl text-center -mt-4 leading-5">
          <span className="text-[#8B5CF6] font-semibold">T</span>ex{" "}
          <span className="text-[#8B5CF6] font-semibold">F</span>
          inance <span className="text-[#8B5CF6] font-semibold">D</span>
          ashboard
        </p>
      </div>

      <form
        onSubmit={handleRegister}
        className="bg-white shadow-lg rounded-lg p-8 w-full sm:w-[90%] md:w-[60%] lg:w-[40%] xl:w-[30%]"
      >
        <p className="text-3xl font-semibold text-center text-[#8B5CF6] mb-6">
          Cadastro
        </p>

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
          type="submit"
          className="w-full bg-[#8B5CF6] hover:bg-[#9E6EFE] text-white py-3 rounded-lg transition duration-200 ease-in-out cursor-pointer"
        >
          Cadastrar
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-[#8B5CF6] hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

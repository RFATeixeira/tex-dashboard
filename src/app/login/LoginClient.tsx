"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { loginUser, loginWithGoogle } from "@/lib/auth";
import Link from "next/link";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { FaGoogle } from "react-icons/fa"; // Ícone do Google

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await loginUser(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      switch (err.code) {
        case "auth/user-not-found":
          setError("Usuário não encontrado.");
          break;
        case "auth/wrong-password":
          setError("Senha incorreta.");
          break;
        case "auth/invalid-email":
          setError("E-mail inválido.");
          break;
        case "auth/too-many-requests":
          setError("Muitas tentativas. Tente novamente mais tarde.");
          break;
        default:
          setError("Erro ao fazer login. Tente novamente.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const userCredential = await loginWithGoogle(); // deve retornar o user
      const user = userCredential.user;

      const db = getFirestore();
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Cria o doc com a imagem do Google
        await setDoc(userRef, {
          displayName: user.displayName || "",
          email: user.email,
          profileImage: user.photoURL || "",
          createdAt: new Date(),
        });
      } else {
        const userData = userSnap.data();
        if (!userData.profileImage) {
          // Atualiza somente se a imagem personalizada não estiver definida
          await setDoc(userRef, {
            ...userData,
            profileImage: user.photoURL || "",
          });
        }
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError("Erro ao fazer login com o Google.");
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
        onSubmit={handleLogin}
        className="bg-white shadow-lg rounded-lg p-8 w-full sm:w-[90%] md:w-[60%] lg:w-[40%] xl:w-[30%]"
      >
        <h1 className="text-3xl font-semibold text-center text-[#8B5CF6] mb-6">
          Login
        </h1>

        <input
          type="email"
          placeholder="E-mail"
          className="text-gray-600 border border-gray-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          className="text-gray-600 border border-gray-300 p-3 rounded-lg w-full mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <button
          type="submit"
          className="w-full bg-[#8B5CF6] hover:bg-[#9E6EFE] text-white py-3 rounded-lg transition duration-200 ease-in-out cursor-pointer"
          disabled={!email || !password}
        >
          Entrar
        </button>
        <div className="mt-4 text-center">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-[#8B5CF6] hover:bg-[#9E6EFE] text-white py-3 rounded-lg transition duration-200 ease-in-out cursor-pointer flex items-center justify-center"
          >
            <FaGoogle className="mr-2" />
            Entrar com Google
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-[#8B5CF6] hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

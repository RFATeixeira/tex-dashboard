"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import {
  onAuthStateChanged,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
  deleteUser,
  User,
} from "firebase/auth";
import { getFirestore, doc, updateDoc, deleteDoc } from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import Presentation from "../components/Presentation";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setEmail(u.email || "");
        setName(u.displayName || "");
      } else {
        router.replace("/login");
      }

      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const validateImageUrl = (url: string): boolean =>
    /\.(jpeg|jpg|png|gif)$/i.test(url);

  const handleProfileImageUpdate = async () => {
    if (!profileImageUrl || !validateImageUrl(profileImageUrl)) {
      setImageError(
        "Por favor, insira uma URL válida de imagem (png, jpeg, jpg)."
      );
      return;
    }

    if (!user) return;

    try {
      const db = getFirestore();
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { profileImage: profileImageUrl });
      setMessage("Imagem de perfil atualizada com sucesso!");
      setImageError(null);
    } catch {
      setMessage("Erro ao atualizar a imagem.");
    }
  };

  const handleEmailChange = async () => {
    if (!email || !user) return;
    try {
      await updateEmail(user, email);
      setMessage("E-mail atualizado com sucesso!");
    } catch {
      setMessage("Erro ao atualizar o e-mail.");
    }
  };

  const handlePasswordChange = async () => {
    if (!password || !user) return;
    try {
      await updatePassword(user, password);
      setMessage("Senha atualizada com sucesso!");
    } catch {
      setMessage("Erro ao atualizar a senha.");
    }
  };

  const handleNameChange = async () => {
    if (!name || !user) return;
    try {
      await updateProfile(user, { displayName: name });
      const db = getFirestore();
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { name });
      setMessage("Nome atualizado com sucesso!");
    } catch {
      setMessage("Erro ao atualizar o nome.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !password) return;

    try {
      const authInstance = getAuth();
      await signInWithEmailAndPassword(authInstance, user.email!, password);
      const db = getFirestore();
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      setMessage("Conta deletada com sucesso!");
      router.push("/login");
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        setMessage(
          "Você precisa fazer login novamente para excluir sua conta."
        );
      } else {
        setMessage("Erro ao deletar a conta. Tente novamente.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-700">
        Carregando...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 md:p-8 text-gray-700">
        <Presentation pageDescription="Altere os dados caso necessário." />
        <h1 className="text-2xl font-bold mb-6">Configurações</h1>

        {message && <p className="mb-4 text-green-500">{message}</p>}

        {/* Atualização de imagem */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Imagem de Perfil</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Cole a URL da sua imagem de perfil"
              value={profileImageUrl}
              onChange={(e) => setProfileImageUrl(e.target.value)}
              className="h-14 border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleProfileImageUpdate}
              className="h-14 md:w-80 sm:w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6"
            >
              Atualizar Imagem
            </button>
          </div>
          {imageError && (
            <p className="text-red-500 text-sm mt-2">{imageError}</p>
          )}
        </div>

        {/* Atualização de nome */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Nome</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleNameChange}
              className="h-14 md:w-80 sm:w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6"
            >
              Atualizar Nome
            </button>
          </div>
        </div>

        {/* Atualização de e-mail */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">E-mail</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleEmailChange}
              className="h-14 md:w-80 sm:w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6"
            >
              Atualizar E-mail
            </button>
          </div>
        </div>

        {/* Atualização de senha */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Senha</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handlePasswordChange}
              className="h-14 md:w-80 sm:w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6"
            >
              Atualizar Senha
            </button>
          </div>
        </div>

        {/* Botão de deletar conta */}
        <div className="fixed bottom-8 right-8">
          {/*<button
            onClick={() => setShowModal(true)}
            className="w-[16rem] h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Deletar Conta
          </button>*/}
        </div>
      </main>

      {/* Modal de confirmação */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-20 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Tem certeza que deseja apagar a conta?
            </h2>
            <div className="flex gap-4">
              <button
                onClick={handleDeleteAccount}
                className="w-1/2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
              >
                Sim
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="w-1/2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg"
              >
                Não
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

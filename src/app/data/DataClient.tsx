"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import Presentation from "../components/Presentation";

type EntryType =
  | "ganhos"
  | "gastos"
  | "gastosCredito"
  | "ganhosValeAlim"
  | "gastosValeAlim";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState({
    name: "",
    value: "",
    date: "",
    type: "ganhos" as EntryType, // Garantindo que seja um EntryType válido
    parcelas: 1, // Usado apenas para "Gasto Crédito"
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<EntryType | null>(null);
  const [today, setToday] = useState<string>(""); // Definindo o estado para 'today'
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else router.replace("/login");
      setLoading(false);
    });

    // Calcular a data de hoje
    const currentDateInBrazil = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
    );
    const todayDate = currentDateInBrazil.toISOString().split("T")[0]; // 'YYYY-MM-DD'

    setToday(todayDate); // Atualizando o estado de 'today'

    setEntries((prev) => ({
      ...prev,
      date: todayDate, // Usando a data de hoje no estado inicial
    }));

    return () => unsubscribeAuth();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleChange = (
    field: "name" | "value" | "date" | "type" | "parcelas",
    value: string | number
  ) => {
    setEntries((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) {
      setError("Usuário não autenticado.");
      return;
    }

    const { name, value, date, type, parcelas } = entries;
    if (!name || value === "" || !date || !type) {
      setError("Preencha todos os campos.");
      return;
    }

    setSaving(type);
    setError(null);

    try {
      const db = getFirestore();
      const dataCollection = collection(db, `${type}Data`);
      const dateObj = new Date(date);
      const timestamp = Timestamp.fromDate(dateObj);

      // Criando um timestamp para o momento atual (data de criação)
      const createdAtTimestamp = Timestamp.now();

      if (type === "gastosCredito" && parcelas > 1) {
        const parcelGroupId = crypto.randomUUID(); // ou use sua própria lógica, como `${user.uid}-${Date.now()}`
        const baseDate = new Date(date);

        for (let i = 0; i < parcelas; i++) {
          const parcelDate = new Date(baseDate);
          parcelDate.setMonth(baseDate.getMonth() + i);

          await addDoc(dataCollection, {
            name,
            value: Number(value) / parcelas,
            date: Timestamp.fromDate(parcelDate),
            userId: user.uid,
            parcelas,
            tipo: "gastoCredito",
            createdAt: createdAtTimestamp,
            isParcel: true,
            parcelNumber: i + 1,
            totalParcelas: parcelas,
            parcelGroupId, // <-- identificador único para o grupo
          });
        }
      } else {
        // Adicionando Gasto ou Ganho simples
        await addDoc(dataCollection, {
          name,
          value: Number(value),
          date: timestamp,
          userId: user.uid,
          createdAt: createdAtTimestamp, // Adicionando a data de criação
          isParcel: false, // Indicando que não é uma parcela
        });
      }

      // Limpar campos após salvar
      setEntries({
        name: "",
        value: "",
        date: today, // Usando 'today' atualizado aqui
        type: "ganhos", // Resetando o tipo para "ganhos" após salvar
        parcelas: 1,
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setError("Erro ao salvar os dados.");
    } finally {
      setSaving(null);
    }
  };

  const renderForm = () => (
    <div className="bg-white shadow-md rounded-2xl p-6 w-full sm:w-[90%] md:w-[80%] lg:w-[100%] xl:w-[100%] mb-8">
      <h2 className="text-xl font-semibold mb-4 text-center">
        {entries.type === "ganhos" && "Adicionar Ganho"}
        {entries.type === "gastos" && "Adicionar Gasto"}
        {entries.type === "gastosCredito" && "Adicionar Gasto Crédito"}
        {entries.type === "ganhosValeAlim" &&
          "Adicionar Ganho Vale Alimentação"}
        {entries.type === "gastosValeAlim" &&
          "Adicionar Gasto Vale Alimentação"}
      </h2>

      <label className="block mb-2 text-gray-700">Nome</label>
      <input
        type="text"
        className="w-full border border-gray-300 rounded p-2 mb-4 outline-none focus:border-purple-600"
        value={entries.name}
        onChange={(e) => handleChange("name", e.target.value)}
      />

      <label className="block mb-2 text-gray-700">Valor (R$)</label>
      <input
        type="number"
        className="w-full border border-gray-300 rounded p-2 mb-4 outline-none focus:border-purple-600"
        value={entries.value}
        onChange={(e) => handleChange("value", e.target.value)}
      />

      <label className="block mb-2 text-gray-700">Data</label>
      <input
        type="date"
        className="w-full border border-gray-300 rounded p-2 mb-4 outline-none focus:border-purple-600"
        value={entries.date}
        onChange={(e) => handleChange("date", e.target.value)}
      />

      <label className="block mb-2 text-gray-700">Tipo de Entrada</label>
      <select
        value={entries.type}
        onChange={(e) => handleChange("type", e.target.value as EntryType)}
        className="w-full border border-gray-300 rounded p-2 mb-4 outline-none focus:border-purple-600"
      >
        <option value="ganhos">Ganho</option>
        <option value="gastos">Gasto</option>
        <option value="gastosCredito">Gasto Crédito</option>
        <option value="ganhosValeAlim">Ganho Vale Alimentação</option>
        <option value="gastosValeAlim">Gasto Vale Alimentação</option>
      </select>

      {entries.type === "gastosCredito" && (
        <>
          <label className="block mb-2 text-gray-700">Parcelas</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded p-2 mb-4 outline-none focus:border-purple-600"
            value={entries.parcelas}
            onChange={(e) => handleChange("parcelas", parseInt(e.target.value))}
            min={1}
          />
        </>
      )}

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving === entries.type}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg disabled:opacity-50"
      >
        {saving === entries.type ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-700">
        Carregando...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 p-8 text-gray-700">
        <Presentation pageDescription="Registre seus ganhos e gastos." />
        <h1 className="text-2xl font-bold mb-6">Inserir Dados</h1>

        <div className="flex flex-wrap gap-6 items-center justify-center">
          {renderForm()}
        </div>
      </main>
    </div>
  );
}

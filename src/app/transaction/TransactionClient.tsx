"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import Presentation from "../components/Presentation";

export default function TransactionClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ganhos, setGanhos] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [saldo, setSaldo] = useState(0);
  const [totalGanhos, setTotalGanhos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [sortOption, setSortOption] = useState("mes-desc");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const db = getFirestore();

        const ganhosQuery = query(
          collection(db, "ganhosData"),
          where("userId", "==", u.uid)
        );
        const gastosQuery = query(
          collection(db, "gastosData"),
          where("userId", "==", u.uid)
        );
        const gastosCreditoQuery = query(
          collection(db, "gastosCreditoData"),
          where("userId", "==", u.uid)
        );

        const [ganhosSnapshot, gastosSnapshot, gastosCreditoSnapshot] =
          await Promise.all([
            getDocs(ganhosQuery),
            getDocs(gastosQuery),
            getDocs(gastosCreditoQuery),
          ]);

          const ganhosData = ganhosSnapshot.docs.map((doc) => doc.data());

          const gastosData = gastosSnapshot.docs.map((doc) => {
            const data = doc.data() as any; // ou defina um tipo específico se tiver
            return { ...data, tipo: "débito" };
          });
          
          const gastosCreditoData = gastosCreditoSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              tipo: "crédito", // Sobrescreve sempre, mesmo que `data.tipo` exista
            };
          });          

          console.log("Gastos débito:", gastosData);
          console.log("Gastos crédito:", gastosCreditoData);

        const allGastosData = [...gastosData, ...gastosCreditoData];

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const isSameMonthYear = (date: any) => {
          let d =
            typeof date === "string"
              ? new Date(date.split("-").reverse().join("-"))
              : date?.toDate();
          return (
            d?.getMonth() === currentMonth && d?.getFullYear() === currentYear
          );
        };

        const ganhosDoMes = ganhosData.filter((item) =>
          isSameMonthYear(item.date)
        );
        const gastosDoMes = allGastosData.filter((item) =>
          isSameMonthYear(item.date)
        );

        const totalGanhos = ganhosDoMes.reduce(
          (acc, curr) => acc + curr.value,
          0
        );
        const totalGastos = gastosDoMes.reduce(
          (acc, curr) => acc + curr.value,
          0
        );

        setSaldo(totalGanhos - totalGastos);
        setTotalGanhos(totalGanhos);
        setTotalGastos(totalGastos);

        setGanhos(ganhosData);
        setGastos(allGastosData);
      } else {
        router.replace("/login");
      }

      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [router]);

  const sortByDateOption = (
    data: any[],
    option: string
  ): Record<string, any[]> => {
    const grouped: Record<string, any[]> = {};

    data.forEach((item) => {
      let dateObj: Date;

      if (typeof item.date === "string") {
        const [day, month, year] = item.date.split("-").map(Number);
        dateObj = new Date(year, month - 1, day);
      } else if (item.date?.toDate) {
        dateObj = item.date.toDate();
      } else {
        return;
      }

      const key = `${String(dateObj.getMonth() + 1).padStart(
        2,
        "0"
      )}/${dateObj.getFullYear()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ ...item, _dateObj: dateObj });
    });

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const [ma, ya] = a.split("/").map(Number);
      const [mb, yb] = b.split("/").map(Number);
      const dateA = new Date(ya, ma - 1);
      const dateB = new Date(yb, mb - 1);
      return option === "mes-asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

    const sortedGrouped: Record<string, any[]> = {};
    sortedKeys.forEach((key) => {
      sortedGrouped[key] = grouped[key].sort((a, b) => {
        return option === "mes-asc"
          ? a._dateObj.getTime() - b._dateObj.getTime()
          : b._dateObj.getTime() - a._dateObj.getTime();
      });
    });

    return sortedGrouped;
  };

  const ganhosOrdenados = useMemo(() => {
    if (sortOption === "lancamento") {
      return {
        "Ordem de Lançamento": [...ganhos].sort((a, b) => {
          const dateA =
            typeof a.date === "string"
              ? new Date(a.date.split("-").reverse().join("-"))
              : a.date?.toDate();
          const dateB =
            typeof b.date === "string"
              ? new Date(b.date.split("-").reverse().join("-"))
              : b.date?.toDate();
          return dateA.getTime() - dateB.getTime();
        }),
      };
    }
    return sortByDateOption(ganhos, sortOption);
  }, [ganhos, sortOption]);

  const gastosOrdenados = useMemo(() => {
    if (sortOption === "lancamento") {
      return {
        "Ordem de Lançamento": [...gastos].sort((a, b) => {
          const dateA =
            typeof a.date === "string"
              ? new Date(a.date.split("-").reverse().join("-"))
              : a.date?.toDate();
          const dateB =
            typeof b.date === "string"
              ? new Date(b.date.split("-").reverse().join("-"))
              : b.date?.toDate();
          return dateA.getTime() - dateB.getTime();
        }),
      };
    }
    return sortByDateOption(gastos, sortOption);
  }, [gastos, sortOption]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
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

      <main className="flex-1 p-8 text-gray-700">
        <Presentation pageDescription="Sua carteira de ganhos e gastos." />
        <h1 className="text-2xl font-bold mb-6">Transações</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Ordenar por:</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border rounded-lg p-2 text-sm border-purple-600"
          >
            <option value="mes-desc">Mais recente primeiro</option>
            <option value="mes-asc">Mais antigo primeiro</option>
            <option value="lancamento">Ordem de lançamento</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-xl font-medium mb-4">Ganhos</h3>
            {Object.keys(ganhosOrdenados).length === 0 ? (
              <p className="text-sm text-gray-500">Sem ganhos registrados.</p>
            ) : (
              Object.entries(ganhosOrdenados).map(([mes, itens], idx) => (
                <div key={idx} className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">{mes}</h4>
                  {itens.map((ganho, index) => (
                    <div
                      key={index}
                      className="mb-2 p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-all"
                    >
                      <div className="flex justify-between">
                        <span className="font-semibold">{ganho.name}</span>
                        <span className="text-green-500">
                          +R$ {ganho.value.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {ganho._parsedDateStr ||
                          (typeof ganho.date === "string"
                            ? ganho.date
                            : ganho.date?.toDate().toLocaleDateString("pt-BR"))}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-xl font-medium mb-4">Gastos</h3>
            {Object.keys(gastosOrdenados).length === 0 ? (
              <p className="text-sm text-gray-500">Sem gastos registrados.</p>
            ) : (
              Object.entries(gastosOrdenados).map(([mes, itens], idx) => (
                <div key={idx} className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">{mes}</h4>
                  {itens.map((gasto, index) => (
                    <div
                      key={index}
                      className="mb-2 p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-all"
                    >
                      <div className="flex justify-between">
                        <span className="font-semibold">{gasto.name}</span>
                        <span className="text-red-500">
                          -R$ {gasto.value.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-sm text-gray-500">
                          {gasto._parsedDateStr ||
                            (typeof gasto.date === "string"
                            ? gasto.date
                            : gasto.date?.toDate().toLocaleDateString("pt-BR"))}
                        </div>
                        <div className="text-xs text-gray-400 italic">
                          {gasto.tipo === "crédito" ? "Gasto no crédito" : "Gasto no débito"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
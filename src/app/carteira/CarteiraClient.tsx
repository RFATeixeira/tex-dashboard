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
  doc,
  getDoc,
} from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import Presentation from "../components/Presentation";

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ganhos, setGanhos] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [saldo, setSaldo] = useState(0);
  const [totalGanhos, setTotalGanhos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonthVA, setSelectedMonthVA] = useState(today.getMonth());
  const [selectedYearVA, setSelectedYearVA] = useState(today.getFullYear());
  const [creditoMaximo, setCreditoMaximo] = useState(1000);
  const [gastosCredito, setGastosCredito] = useState<any[]>([]);
  const [ganhosValeAlim, setGanhosValeAlim] = useState<any[]>([]);
  const [gastosValeAlim, setGastosValeAlim] = useState<any[]>([]);
  const [totalGanhosValeAlim, setTotalGanhosValeAlim] = useState(0);
  const [totalGastosValeAlim, setTotalGastosValeAlim] = useState(0);
  const [saldoValeAlim, setSaldoValeAlim] = useState(0);

  const creditoUsado = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    // Calcular o mês seguinte
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }

    const grupos = new Map<
      string,
      { itemBase: (typeof gastosCredito)[0]; datas: Date[] }
    >();

    // Agrupa parcelas por groupId
    gastosCredito.forEach((item) => {
      const date = item.date?.toDate?.(); // <- Alterado aqui
      if (!date) return;

      const group = grupos.get(item.parcelGroupId);
      if (group) {
        group.datas.push(date);
      } else {
        grupos.set(item.parcelGroupId, {
          itemBase: item,
          datas: [date],
        });
      }
    });

    let total = 0;

    grupos.forEach(({ itemBase, datas }) => {
      const hasParcelaNoMesAtual = datas.some(
        (d) =>
          d.getUTCFullYear() === currentYear && d.getUTCMonth() === currentMonth
      );

      const hasParcelaNoMesSeguinte = datas.some(
        (d) => d.getUTCFullYear() === nextYear && d.getUTCMonth() === nextMonth
      );

      // Só considerar o grupo se há parcela no mês atual ou no mês seguinte
      if (hasParcelaNoMesAtual || hasParcelaNoMesSeguinte) {
        const parcelasFuturasOuAtual = datas.filter(
          (d) =>
            d.getUTCFullYear() > currentYear ||
            (d.getUTCFullYear() === currentYear &&
              d.getUTCMonth() >= currentMonth)
        );

        const valor = Number(itemBase.value);
        if (!isNaN(valor)) {
          total += valor * parcelasFuturasOuAtual.length;
        }
      }
    });

    return total;
  }, [gastosCredito]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const db = getFirestore();

        const userSettingsRef = doc(db, "users", u.uid);
        const userSettingsSnap = await getDoc(userSettingsRef);
        if (userSettingsSnap.exists()) {
          const data = userSettingsSnap.data();
          if (data.creditoMaximo) setCreditoMaximo(data.creditoMaximo);
        }

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
        const gastosValeAlimQuery = query(
          collection(db, "gastosValeAlimData"),
          where("userId", "==", u.uid)
        );
        const ganhosValeAlimQuery = query(
          collection(db, "ganhosValeAlimData"),
          where("userId", "==", u.uid)
        );

        const [
          ganhosSnapshot,
          gastosSnapshot,
          gastosCreditoSnapshot,
          gastosValeAlimSnapshot,
          ganhosValeAlimSnapshot,
        ] = await Promise.all([
          getDocs(ganhosQuery),
          getDocs(gastosQuery),
          getDocs(gastosCreditoQuery),
          getDocs(gastosValeAlimQuery),
          getDocs(ganhosValeAlimQuery),
        ]);

        const ganhosData = ganhosSnapshot.docs.map((doc) => doc.data());
        const gastosData = gastosSnapshot.docs.map((doc) => doc.data());
        const gastosCreditoData = gastosCreditoSnapshot.docs.map((doc) =>
          doc.data()
        );
        const gastosValeAlimData = gastosValeAlimSnapshot.docs.map((doc) =>
          doc.data()
        );
        const ganhosValeAlimData = ganhosValeAlimSnapshot.docs.map((doc) =>
          doc.data()
        );

        const allGastosData = [...gastosData];

        setGanhos(ganhosData);
        setGastos(allGastosData);
        setGastosCredito(gastosCreditoData);
        setGastosValeAlim(gastosValeAlimData);
        setGanhosValeAlim(ganhosValeAlimData);
      } else {
        router.replace("/login");
      }

      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    const getMonthYear = (date: any) => {
      let d =
        typeof date === "string"
          ? new Date(date.split("-").reverse().join("-"))
          : date?.toDate();
      return { month: d?.getMonth(), year: d?.getFullYear() };
    };

    const isSameMonthYear = (date: any, month: number, year: number) => {
      const { month: m, year: y } = getMonthYear(date);
      return m === month && y === year;
    };

    // Mês e ano anterior
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

    const ganhosDoMes = ganhos.filter((item) =>
      isSameMonthYear(item.date, selectedMonth, selectedYear)
    );
    const gastosDoMes = gastos.filter((item) =>
      isSameMonthYear(item.date, selectedMonth, selectedYear)
    );

    const ganhosMesAnterior = ganhos.filter((item) =>
      isSameMonthYear(item.date, prevMonth, prevYear)
    );
    const gastosMesAnterior = gastos.filter((item) =>
      isSameMonthYear(item.date, prevMonth, prevYear)
    );

    const saldoMesAnterior =
      ganhosMesAnterior.reduce((acc, curr) => acc + curr.value, 0) -
      gastosMesAnterior.reduce((acc, curr) => acc + curr.value, 0);

    const totalGanhos =
      ganhosDoMes.reduce((acc, curr) => acc + curr.value, 0) + saldoMesAnterior;
    const totalGastos = gastosDoMes.reduce((acc, curr) => acc + curr.value, 0);

    setTotalGanhos(totalGanhos);
    setTotalGastos(totalGastos);
    setSaldo(totalGanhos - totalGastos);
  }, [ganhos, gastos, selectedMonth, selectedYear]);

  useEffect(() => {
    const getMonthYear = (date: any) => {
      let d =
        typeof date === "string"
          ? new Date(date.split("-").reverse().join("-"))
          : date?.toDate();
      return { month: d?.getMonth(), year: d?.getFullYear() };
    };

    const isSameMonthYear = (date: any, month: number, year: number) => {
      const { month: m, year: y } = getMonthYear(date);
      return m === month && y === year;
    };

    const prevMonth = selectedMonthVA === 0 ? 11 : selectedMonthVA - 1;
    const prevYear =
      selectedMonthVA === 0 ? selectedYearVA - 1 : selectedYearVA;

    const ganhosDoMesValeAlim = ganhosValeAlim.filter((item) =>
      isSameMonthYear(item.date, selectedMonthVA, selectedYearVA)
    );
    const gastosDoMesValeAlim = gastosValeAlim.filter((item) =>
      isSameMonthYear(item.date, selectedMonthVA, selectedYearVA)
    );

    const ganhosValeAlimMesAnterior = ganhosValeAlim.filter((item) =>
      isSameMonthYear(item.date, prevMonth, prevYear)
    );
    const gastosValeAlimMesAnterior = gastosValeAlim.filter((item) =>
      isSameMonthYear(item.date, prevMonth, prevYear)
    );

    const saldoMesAnterior =
      ganhosValeAlimMesAnterior.reduce((acc, curr) => acc + curr.value, 0) -
      gastosValeAlimMesAnterior.reduce((acc, curr) => acc + curr.value, 0);

    const totalGanhosValeAlim =
      ganhosDoMesValeAlim.reduce((acc, curr) => acc + curr.value, 0) +
      saldoMesAnterior;
    const totalGastosValeAlim = gastosDoMesValeAlim.reduce(
      (acc, curr) => acc + curr.value,
      0
    );

    setTotalGanhosValeAlim(totalGanhosValeAlim);
    setTotalGastosValeAlim(totalGastosValeAlim);
    setSaldoValeAlim(totalGanhosValeAlim - totalGastosValeAlim);
  }, [selectedMonthVA, selectedYearVA, ganhosValeAlim, gastosValeAlim]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={() => signOut(auth)} />
      <main className="flex-1 p-8 text-gray-700">
        <Presentation pageDescription="Sua carteira de ganhos e gastos." />
        <div className="flex flex-col gap-6 w-full m">
          <h1 className="text-2xl font-bold mb-6">Carteira</h1>
          {/* DEBITO */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex w-full justify-center p-2 flex-col xl:flex-row">
              {/* Seletor de Mês */}
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4 w-full">
                <label className="text-sm font-medium hidden md:contents">
                  Mês:
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="border rounded p-2 text-sm"
                >
                  {monthNames.map((m, idx) => (
                    <option key={idx} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>

                <label className="text-sm font-medium hidden md:contents">
                  Ano:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="border rounded p-2 text-sm w-28"
                >
                  {Array.from({ length: 11 }, (_, i) => {
                    const year = 2020 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              <h2 className="text-lg md:text-2xl font-medium justify-center flex w-full">
                Débito de {monthNames[selectedMonth]} de {selectedYear}
              </h2>
              <div className="w-full"></div>
            </div>
            <div className="flex flex-col md:flex-row justify-between text-lg font-medium">
              <div className="flex flex-col items-center">
                <p className="text-lg md:text-xl font-medium mb-0 mt-3 md:mt-0 md:mb-4">
                  Ganho
                </p>
                <span className="text-green-500 text-left md:text-center text-lg">
                  +R$ {totalGanhos.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-lg md:text-xl font-medium mb-0 mt-3 md:mt-0 md:mb-4">
                  Saldo
                </p>
                <span
                  className={`text-2xl font-bold text-center ${
                    saldo >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {saldo >= 0
                    ? `R$ ${saldo.toFixed(2)}`
                    : `R$ ${Math.abs(saldo).toFixed(2)}`}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-lg md:text-xl font-medium mb-0 mt-3 md:mt-0 md:mb-4">
                  Gasto
                </p>
                <span className="text-red-500 text-right md:text-center text-lg">
                  -R$ {totalGastos.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          {/* CRÉDITO */}
          <div className="gap-6 w-full">
            <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow gap-4">
              <h3 className="text-lg md:text-2xl font-medium  justify-center flex w-full">
                Limite de Cŕedito
              </h3>
              <div className="w-full flex flex-col md:flex-row">
                <div className="flex justify-center w-full text-lg font-medium">
                  <div className="flex flex-col items-center md:items-start w-full">
                    <div className="flex flex-col items-center">
                      <p className="text-lg md:text-xl font-medium mb-0 mt-3 md:mt-0 md:mb-4">
                        Limite
                      </p>
                      <span className="text-blue-500 text-left md:text-center text-lg">
                        R$ {creditoMaximo.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center w-full">
                  <p className="text-lg md:text-xl font-medium mb-0 mt-3 md:mt-0 md:mb-4">
                    Restante
                  </p>
                  <span
                    className={`text-2xl font-bold text-center ${
                      creditoMaximo - creditoUsado >= 0
                        ? "text-blue-500"
                        : "text-red-500"
                    }`}
                  >
                    {`R$ ${(creditoMaximo - creditoUsado).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex flex-col tems-center md:items-end w-full">
                  <div className="flex flex-col items-center">
                    <p className="text-lg md:text-xl font-medium mb-0 mt-3 md:mt-0 md:mb-4">
                      Usado
                    </p>
                    <span className="text-red-500 text-left md:text-center text-lg">
                      -R$ {creditoUsado.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ALIMENTAÇÃO */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex w-full justify-center p-2 flex-col xl:flex-row">
              {/* Seletor de Mês */}
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4 w-full">
                <label className="text-sm font-medium hidden md:contents">
                  Mês:
                </label>
                <select
                  value={selectedMonthVA}
                  onChange={(e) => setSelectedMonthVA(parseInt(e.target.value))}
                  className="border rounded p-2 text-sm"
                >
                  {monthNames.map((m, idx) => (
                    <option key={idx} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>

                <label className="text-sm font-medium hidden md:contents">
                  Ano:
                </label>
                <select
                  value={selectedYearVA}
                  onChange={(e) => setSelectedYearVA(parseInt(e.target.value))}
                  className="border rounded p-2 text-sm w-28"
                >
                  {Array.from({ length: 11 }, (_, i) => {
                    const year = 2020 + i; // de 2020 a 2030 (ajuste conforme necessário)
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              <h2 className="text-lg md:text-2xl font-medium  justify-center flex w-full">
                Vale Alim de {monthNames[selectedMonthVA]} de {selectedYearVA}
              </h2>
              <div className="w-full"></div>
            </div>
            <div className="flex flex-col md:flex-row justify-between text-lg font-medium">
              <div className="flex flex-col items-center">
                <p className="text-lg md:text-xl font-medium mb-0 mt-3 md:mt-0 md:mb-4">
                  Ganho
                </p>
                <span className="text-green-500 text-left md:text-center">
                  +R$ {totalGanhosValeAlim.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-lg md:text-xl font-medium mb-0 mt-3 md:mt-0 md:mb-4">
                  Saldo
                </p>
                <span
                  className={`text-2xl font-bold text-center ${
                    saldoValeAlim >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {saldoValeAlim >= 0
                    ? `R$ ${saldoValeAlim.toFixed(2)}`
                    : `R$ ${Math.abs(saldoValeAlim).toFixed(2)}`}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-lg md:text-xl font-medium mb-0 mt-3 md:mt-0 md:mb-4">
                  Gasto
                </p>
                <span className="text-red-500 text-right md:text-center">
                  -R$ {totalGastosValeAlim.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

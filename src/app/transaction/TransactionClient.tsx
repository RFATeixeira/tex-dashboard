"use client";

import { useState, useEffect, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import Presentation from "../components/Presentation";
import { motion, AnimatePresence } from "framer-motion";
import MonthPicker from "../components/MonthPicker";

export default function TransactionClient() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${year}-${month}`;
  });

  const [useMonthFilter, setUseMonthFilter] = useState(false);

  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ganhos, setGanhos] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [saldo, setSaldo] = useState(0);
  const [totalGanhos, setTotalGanhos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [sortOption, setSortOption] = useState("mes-desc");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItemData, setEditItemData] = useState<any>(null);
  const db = getFirestore();

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
        const ganhosValeAlimQuery = query(
          collection(db, "ganhosValeAlimData"),
          where("userId", "==", u.uid)
        );
        const gastosValeAlimQuery = query(
          collection(db, "gastosValeAlimData"),
          where("userId", "==", u.uid)
        );

        const [
          ganhosSnapshot,
          gastosSnapshot,
          gastosCreditoSnapshot,
          ganhosValeAlimSnapshot,
          gastosValeAlimSnapshot,
        ] = await Promise.all([
          getDocs(ganhosQuery),
          getDocs(gastosQuery),
          getDocs(gastosCreditoQuery),
          getDocs(ganhosValeAlimQuery),
          getDocs(gastosValeAlimQuery),
        ]);

        const ganhosData = ganhosSnapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id, // ← aqui
            ...data,
            tipo: "débito",
            collection: "ganhosData",
          };
        });

        const gastosData = gastosSnapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id, // ← e aqui
            ...data,
            tipo: "débito",
            collection: "gastosData",
          };
        });

        const gastosCreditoData = gastosCreditoSnapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id, // ← e aqui
            ...data,
            tipo: "crédito",
            collection: "gastosCreditoData",
          };
        });

        const ganhosValeAlimData = ganhosValeAlimSnapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            tipo: "débito",
            collection: "ganhosValeAlimData",
            description: "Ganho no ValeAlim",
          };
        });

        const gastosValeAlimData = gastosValeAlimSnapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            tipo: "débito",
            collection: "gastosValeAlimData",
            description: "Gasto no ValeAlim",
          };
        });

        const allGastosData = [...gastosData, ...gastosCreditoData];
        const allGanhosData = [...ganhosData, ...ganhosValeAlimData];

        setGanhos(allGanhosData);
        setGastos([...allGastosData, ...gastosValeAlimData]);

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
      } else {
        router.replace("/login");
      }

      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [router]);

  const isMobileBreakpoint = 768; // md: 768px

  function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () =>
        setIsMobile(window.innerWidth < isMobileBreakpoint);
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    return isMobile;
  }

  const isMobile = useIsMobile();

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

  const handleDelete = async (id: string, collectionName: string) => {
    try {
      console.log("Deletando:", { id, collectionName });
      if (!id || !collectionName) {
        console.error("ID ou nome da coleção ausente.");
        return;
      }
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error("Erro ao deletar transação:", error);
    }
  };

  const ganhosOrdenados = useMemo(() => {
    const filtered = useMonthFilter
      ? ganhos.filter((item) => {
          const date =
            typeof item.date === "string"
              ? new Date(item.date.split("-").reverse().join("-"))
              : item.date?.toDate();
          if (!date) return false;
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const [selYear, selMonth] = selectedMonth.split("-").map(Number);
          return year === selYear && month === selMonth;
        })
      : ganhos;

    return sortByDateOption(filtered, sortOption);
  }, [ganhos, sortOption, selectedMonth, useMonthFilter]);

  const gastosOrdenados = useMemo(() => {
    const filtered = useMonthFilter
      ? gastos.filter((item) => {
          const date =
            typeof item.date === "string"
              ? new Date(item.date.split("-").reverse().join("-"))
              : item.date?.toDate();
          if (!date) return false;
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const [selYear, selMonth] = selectedMonth.split("-").map(Number);
          return year === selYear && month === selMonth;
        })
      : gastos;

    return sortByDateOption(filtered, sortOption);
  }, [gastos, sortOption, selectedMonth, useMonthFilter]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleUpdate = async () => {
    if (!editItemData) return;
    const { id, collection } = editItemData;
    const ref = doc(db, collection, id);
    const data: any = {
      name: editItemData.name,
      value: editItemData.value,
      tipo: editItemData.tipo,
    };
    if (collection === "gastosCreditoData") {
      data.gastoDate = editItemData.gastoDate;
    } else {
      data.date = editItemData.date;
    }

    await updateDoc(ref, data);
    setIsEditModalOpen(false);
    // TODO: atualizar local state após edição
  };

  // ← Coloque o helper logo aqui, antes do return:
  const formatForDateInput = (d: any) => {
    if (!d) return "";
    // se já for string no formato correto
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      return d;
    }
    // se for Timestamp do Firestore
    if (d?.toDate) {
      return d.toDate().toISOString().substr(0, 10);
    }
    // se for string como 'DD/MM/YYYY'
    if (typeof d === "string" && d.includes("/")) {
      const [day, month, year] = d.split("/").map(Number);
      return new Date(year, month - 1, day).toISOString().substr(0, 10);
    }
    // se for Date puro
    if (d instanceof Date) {
      return d.toISOString().substr(0, 10);
    }
    return "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-700">
        Carregando...
      </div>
    );
  }

  return (
    <>
      {/* Modal de Edição */}
      {isEditModalOpen && (
        <div className="fixed inset-0 backdrop-blur-[2px] bg-opacity-40 flex items-center justify-center z-50 text-gray-600 p-8">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-2">
            <h2 className="text-xl">Editar Transação</h2>
            <input
              type="text"
              value={editItemData.name}
              onChange={(e) =>
                setEditItemData({ ...editItemData, name: e.target.value })
              }
              className="w-full p-2 border rounded-xl focus:outline-0 border-purple-700"
            />
            <input
              type="number"
              value={editItemData.value}
              onChange={(e) =>
                setEditItemData({
                  ...editItemData,
                  value: Number(e.target.value),
                })
              }
              className="w-full p-2 border rounded-xl focus:outline-0 border-purple-700"
            />
            {editItemData.collection === "gastosCreditoData" ? (
              <input
                type="date"
                value={formatForDateInput(editItemData.gastoDate)}
                onChange={(e) =>
                  setEditItemData({
                    ...editItemData,
                    gastoDate: e.target.value,
                  })
                }
                className="w-full p-2 border rounded focus:outline-0 border-purple-700 appearance-none
    sm:appearance-none"
              />
            ) : (
              <input
                type="date"
                value={formatForDateInput(editItemData.date)}
                onChange={(e) =>
                  setEditItemData({ ...editItemData, date: e.target.value })
                }
                className="w-full p-2 border rounded focus:outline-0 border-purple-700 appearance-none
    sm:appearance-none"
              />
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-300 cursor-pointer hover:bg-gray-200 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 rounded bg-[#8B5CF6] text-white cursor-pointer ]hover:bg-[#9E6EFE] transition-all duration-200"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UI Principal */}
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar onLogout={handleLogout} />

        <main className="flex-1 px-6 lg:px-8 py-4 text-gray-700">
          <Presentation pageDescription="Sua carteira de ganhos e gastos." />
          <h1 className="text-2xl font-bold mb-6">Transações</h1>
          <div className="flex flex-col lg:flex-row items-start gap-2 lg:items-center lg:justify-between mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Ordenar por:
              </label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className=" px-2 h-10 text-sm"
              >
                <option value="mes-desc">Mais recente primeiro</option>
                <option value="mes-asc">Mais antigo primeiro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Filtrar por mês:
              </label>
              <div className="flex flex-row border rounded-xl px-2 text-sm border-purple-600 h-10 items-center justify-between">
                <div
                  className="relative inline-flex items-center cursor-pointer"
                  onClick={() => setUseMonthFilter((prev) => !prev)}
                >
                  <input
                    type="checkbox"
                    checked={useMonthFilter}
                    onChange={() => {}}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-checked:bg-[#8B5CF6] rounded-full peer transition-colors duration-300 ease-in-out"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out peer-checked:translate-x-5"></div>
                  <span className="text-gray-700 ml-2 mr-2">Filtrar</span>
                </div>

                {useMonthFilter && (
                  <MonthPicker
                    selectedMonth={selectedMonth}
                    onChange={setSelectedMonth}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-xl font-medium mb-4">Ganhos</h3>
              {Object.keys(ganhosOrdenados ?? {}).length === 0 ? (
                <p className="text-sm text-gray-500">Sem gastos registrados.</p>
              ) : (
                Object.entries(ganhosOrdenados).map(([mes, itens], idx) => (
                  <div key={idx} className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">{mes}</h4>
                    {itens.map((ganho, index) => (
                      <div
                        key={index}
                        className={`relative mb-2 p-4 border overflow-hidden border-gray-200 rounded-lg transform transition-all duration-300 hover:shadow-lg ${
                          expandedCardId === `ganho-${mes}-${index}`
                            ? "pr-4 md:pr-36"
                            : ""
                        }`}
                        onClick={() =>
                          setExpandedCardId(
                            expandedCardId === `ganho-${mes}-${index}`
                              ? null
                              : `ganho-${mes}-${index}`
                          )
                        }
                      >
                        <div className="flex justify-between">
                          <span className="font-semibold truncate">
                            {ganho.name}
                          </span>
                          <span className="text-green-500 text-nowrap">
                            +R$ {ganho.value.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <div>
                            {ganho.date
                              ? typeof ganho.date === "string"
                                ? ganho.date
                                : ganho.date
                                    .toDate()
                                    .toLocaleDateString("pt-BR")
                              : ""}
                          </div>
                          <div className="text-xs text-gray-400 italic">
                            Ganho
                          </div>
                        </div>

                        <AnimatePresence mode="wait">
                          {expandedCardId === `ganho-${mes}-${index}` && (
                            <motion.div
                              key={`actions-${mes}-${index}`}
                              initial={
                                isMobile
                                  ? { opacity: 0, y: 20 }
                                  : { opacity: 0, x: 100 }
                              }
                              animate={
                                isMobile
                                  ? { opacity: 1, y: 0 }
                                  : { opacity: 1, x: 0 }
                              }
                              exit={
                                isMobile
                                  ? { opacity: 0, y: 20 }
                                  : { opacity: 0, x: 100 }
                              }
                              transition={{ duration: 0.2 }}
                              className="flex flex-row gap-2 mt-2 md:mt-0 md:absolute h-full items-center md:top-2 md:right-2 pb-0 md:pb-4"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(ganho.id, ganho.collection);
                                }}
                                className="text-sm bg-red-100 text-red-500 px-2 py-2 h-fit rounded cursor-pointer w-full md:w-auto"
                              >
                                Excluir
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditItemData(ganho);
                                  setIsEditModalOpen(true);
                                }}
                                className="text-sm bg-[#8B5CF6] text-white px-2 h-fit py-2 rounded cursor-pointer w-full md:w-auto"
                              >
                                Editar
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
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
                        className={`relative mb-2 p-4 border overflow-hidden border-gray-200 rounded-lg transform transition-all duration-300 hover:shadow-lg ${
                          expandedCardId === `${mes}-${index}`
                            ? "pr-4 md:pr-36"
                            : ""
                        }`}
                        onClick={() =>
                          setExpandedCardId(
                            expandedCardId === `${mes}-${index}`
                              ? null
                              : `${mes}-${index}`
                          )
                        }
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold truncate">
                            {gasto.name}{" "}
                            {gasto.parcelNumber && gasto.parcelas
                              ? ` (${gasto.parcelNumber}/${gasto.parcelas})`
                              : ""}
                          </span>
                          <span className="text-red-500 text-nowrap">
                            -R$ {gasto.value.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <div>
                            {gasto.gastoDate
                              ? typeof gasto.gastoDate === "string"
                                ? gasto.gastoDate
                                : gasto.gastoDate
                                    .toDate()
                                    .toLocaleDateString("pt-BR")
                              : typeof gasto.date === "string"
                                ? gasto.date
                                : gasto.date
                                    ?.toDate()
                                    .toLocaleDateString("pt-BR")}
                          </div>
                          <div className="text-xs text-gray-400 italic">
                            {gasto.tipo === "crédito"
                              ? "Gasto no crédito"
                              : "Gasto no débito"}
                          </div>
                        </div>

                        <AnimatePresence mode="wait">
                          {expandedCardId === `${mes}-${index}` && (
                            <motion.div
                              key={`actions-${mes}-${index}`}
                              initial={
                                isMobile
                                  ? { opacity: 0, y: 20 }
                                  : { opacity: 0, x: 100 }
                              }
                              animate={
                                isMobile
                                  ? { opacity: 1, y: 0 }
                                  : { opacity: 1, x: 0 }
                              }
                              exit={
                                isMobile
                                  ? { opacity: 0, y: 20 }
                                  : { opacity: 0, x: 100 }
                              }
                              transition={{ duration: 0.2 }}
                              className="flex flex-row gap-2 mt-2 md:mt-0 md:absolute h-full items-center md:top-2 md:right-2 pb-0 md:pb-4"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(gasto.id, gasto.collection);
                                }}
                                className="text-sm bg-red-100 text-red-500 px-2 py-2 h-fit rounded cursor-pointer w-full md:w-auto"
                              >
                                Excluir
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditItemData(gasto);
                                  setIsEditModalOpen(true);
                                }}
                                className="text-sm bg-[#8B5CF6] text-white px-2 h-fit py-2 rounded cursor-pointer w-full md:w-auto"
                              >
                                Editar
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

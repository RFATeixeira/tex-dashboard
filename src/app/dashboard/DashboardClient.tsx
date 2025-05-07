"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import Sidebar from "../components/Sidebar";
import Presentation from "../components/Presentation";
import Link from "next/link";
import { FaChartBar, FaChartPie } from "react-icons/fa";

type TransactionBase = {
  name: string;
  value: number;
  date: Timestamp;
  createdAt?: Timestamp; // Mantido como opcional
  isParcel?: boolean;
};

type TransactionGanho = TransactionBase & {
  type: "ganho";
  originalValue?: number;
};

type TransactionGasto = TransactionBase & {
  type: "gasto";
  parcelNumber?: number;
  totalParcelas?: number;
  originalValue?: number;
};

type Transaction = TransactionGanho | TransactionGasto;

type MonthlyData = {
  [month: string]: { ganhos: number; gastos: number };
};

export default function DashboardPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<
    { name: string; ganhos: number; gastos: number }[]
  >([]);
  const [latestTransactions, setLatestTransactions] = useState<Transaction[]>(
    []
  );
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const totalGanhos = dashboardData.reduce((sum, item) => sum + item.ganhos, 0);
  const totalGastos = dashboardData.reduce((sum, item) => sum + item.gastos, 0);
  const pieData = [
    { name: "Ganhos", value: totalGanhos },
    { name: "Gastos", value: totalGastos },
  ];
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const pieColors = ["#8b5cf6", "#d4c1ff"];
  const [isMobile, setIsMobile] = useState(false);
  const [userChangedChart, setUserChangedChart] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      const isNowMobile = window.innerWidth < 768;
      setIsMobile(isNowMobile);

      if (isNowMobile && !userChangedChart) {
        setChartType("pie");
      }
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, [userChangedChart]);

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

        try {
          const [ganhosSnapshot, gastosSnapshot, gastosCreditoSnapshot] =
            await Promise.all([
              getDocs(ganhosQuery),
              getDocs(gastosQuery),
              getDocs(gastosCreditoQuery),
            ]);

          // Extrair todos os anos únicos dos dados
          const yearsSet = new Set<number>();

          const extractYears = (snapshot: QuerySnapshot<DocumentData>) => {
            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              let date: Date;

              if (data.date instanceof Timestamp) {
                date = data.date.toDate();
              } else if (typeof data.date === "string") {
                date = new Date(data.date);
              } else {
                console.error("Formato de data inválido:", data.date);
                return;
              }

              yearsSet.add(date.getFullYear());
            });
          };

          extractYears(ganhosSnapshot);
          extractYears(gastosSnapshot);
          extractYears(gastosCreditoSnapshot);

          // Converter o Set para um array e ordenar
          const uniqueYears = Array.from(yearsSet).sort();
          setAvailableYears(uniqueYears);

          // Se não houver anos disponíveis, não continue o processamento
          if (uniqueYears.length === 0) {
            setLoading(false);
            return;
          }

          // Se o ano selecionado não estiver na lista, use o mais recente
          if (!uniqueYears.includes(selectedYear)) {
            setSelectedYear(uniqueYears[uniqueYears.length - 1]);
          }

          const MONTH_NAMES = [
            "Jan",
            "Fev",
            "Mar",
            "Abr",
            "Mai",
            "Jun",
            "Jul",
            "Ago",
            "Set",
            "Out",
            "Nov",
            "Dez",
          ];

          // Inicializar o objeto de dados para todos os meses do ano selecionado
          const monthlyData: MonthlyData = {};
          MONTH_NAMES.forEach((month) => {
            monthlyData[month] = { ganhos: 0, gastos: 0 };
          });

          const processData = (
            snapshot: QuerySnapshot<DocumentData>,
            type: "ganhos" | "gastos"
          ) => {
            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              let date: Date;

              if (data.date instanceof Timestamp) {
                date = data.date.toDate();
              } else if (typeof data.date === "string") {
                date = new Date(data.date);
              } else {
                console.error("Formato de data inválido:", data.date);
                return;
              }

              // Verificar se a data está no ano selecionado
              if (date.getFullYear() === selectedYear) {
                const monthIndex = date.getMonth();
                const monthName = MONTH_NAMES[monthIndex];
                const value = Number(data.value) || 0;

                monthlyData[monthName][type] += value;
              }
            });
          };

          // Processar os dados
          processData(ganhosSnapshot, "ganhos");
          processData(gastosSnapshot, "gastos");
          processData(gastosCreditoSnapshot, "gastos");

          // Formatar os dados para o gráfico
          const chartData = MONTH_NAMES.map((month) => ({
            name: month,
            ganhos: monthlyData[month]?.ganhos || 0,
            gastos: monthlyData[month]?.gastos || 0,
          }));

          console.log("Dados processados para o gráfico:", chartData);
          setDashboardData(chartData);

          function isGasto(
            transaction: Transaction
          ): transaction is TransactionGasto {
            return (
              transaction.type === "gasto" && "totalParcelas" in transaction
            );
          }

          // Mantenha os campos originais sem modificar
          const combinedTransactions = [
            ...ganhosSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                type: "ganho" as const,
                name: data.name,
                value: data.value,
                date: data.date,
                createdAt: data.createdAt, // Não use date como fallback
                isParcel: data.isParcel || false,
              };
            }),
            ...gastosSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                type: "gasto" as const,
                name: data.name,
                value: data.value,
                date: data.date,
                createdAt: data.createdAt, // Não use date como fallback
                isParcel: data.isParcel || false,
              };
            }),
            ...gastosCreditoSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                type: "gasto" as const,
                name: data.name,
                value: data.value,
                date: data.date,
                createdAt: data.createdAt, // Não use date como fallback
                isParcel: data.isParcel || false,
                parcelNumber: data.parcelNumber,
                totalParcelas: data.totalParcelas,
              };
            }),
          ];

          const groupedTransactions = new Map();

          combinedTransactions.forEach((transaction) => {
            // Use um identificador único que não dependa de createdAt para o agrupamento
            const key = `${transaction.name}-${transaction.type}-${
              transaction.isParcel ? "parcel" : "normal"
            }`;

            if (!transaction.isParcel) {
              groupedTransactions.set(key, transaction);
              return;
            }

            if (!groupedTransactions.has(key)) {
              const newTransaction: Transaction = {
                ...transaction,
                name: isGasto(transaction)
                  ? `${transaction.name} (${transaction.totalParcelas}x)`
                  : transaction.name,
                originalValue: isGasto(transaction)
                  ? transaction.value * (transaction.totalParcelas || 1)
                  : transaction.value,
              };
              groupedTransactions.set(key, newTransaction);
            }
          });

          // Converter para array
          const uniqueTransactions = Array.from(
            groupedTransactions.values()
          ) as Transaction[];

          // Filtrar transações que têm createdAt
          const transactionsWithCreatedAt = uniqueTransactions.filter(
            (transaction) => transaction.createdAt instanceof Timestamp
          );

          // Ordenar apenas por createdAt
          transactionsWithCreatedAt.sort((a, b) => {
            // A essa altura, já sabemos que a.createdAt e b.createdAt são instâncias de Timestamp
            const timestampA = a.createdAt as Timestamp;
            const timestampB = b.createdAt as Timestamp;

            // Ordem decrescente (mais recente primeiro)
            return (
              timestampB.seconds - timestampA.seconds ||
              timestampB.nanoseconds - timestampA.nanoseconds
            );
          });

          // Filtrar transações sem createdAt (se houver)
          const transactionsWithoutCreatedAt = uniqueTransactions.filter(
            (transaction) => !(transaction.createdAt instanceof Timestamp)
          );

          // Se quiser, pode ordenar essas por date
          transactionsWithoutCreatedAt.sort((a, b) => {
            const dateA =
              a.date instanceof Timestamp ? a.date.toDate() : new Date(0);
            const dateB =
              b.date instanceof Timestamp ? b.date.toDate() : new Date(0);
            return dateB.getTime() - dateA.getTime();
          });

          // Combinar: primeiro as com createdAt, depois as sem createdAt
          const orderedTransactions = [
            ...transactionsWithCreatedAt,
            ...transactionsWithoutCreatedAt,
          ];

          // Log para debug
          console.log(
            "Transações ordenadas APENAS por createdAt:",
            orderedTransactions.slice(0, 5).map((t) => ({
              name: t.name,
              createdAt:
                t.createdAt instanceof Timestamp
                  ? t.createdAt.toDate().toISOString()
                  : "N/A",
              date:
                t.date instanceof Timestamp
                  ? t.date.toDate().toISOString()
                  : "N/A",
            }))
          );

          // Pegar as 3 transações mais recentes (agora só das que têm createdAt)
          setLatestTransactions(orderedTransactions.slice(0, 3));
        } catch (error) {
          console.error("Erro ao buscar dados:", error);
        }
      } else {
        router.replace("/login");
      }

      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [router, selectedYear]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = Number(event.target.value);
    setSelectedYear(year);
  };

  // Função para formatar a data da transação (agora usa createdAt, se disponível)
  const formatTransactionDate = (transaction: Transaction) => {
    // Usar createdAt se disponível
    if (transaction.createdAt instanceof Timestamp) {
      return new Date(
        transaction.createdAt.seconds * 1000
      ).toLocaleDateString();
    }
    // Fallback para date
    if (transaction.date instanceof Timestamp) {
      return new Date(transaction.date.seconds * 1000).toLocaleDateString();
    }
    return "Data inválida";
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
      <main className="flex-1 px-6 lg:px-8 py-4 lg:py-8 text-gray-700">
        <Presentation pageDescription="Seu sistema de finance dashboard mais completo." />
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Seção de seleção de ano */}
        <div className="mb-4">
          <label htmlFor="yearSelect" className="text-lg font-medium mr-4 ">
            Selecione o ano:
          </label>
          {availableYears.length > 0 ? (
            <select
              id="yearSelect"
              value={selectedYear}
              onChange={handleYearChange}
              className="p-2"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          ) : (
            <p className="inline-block text-gray-500">Nenhum dado disponível</p>
          )}
        </div>

        <div className="flex gap-6 justify-between flex-col md:flex-row">
          {/* Seção do gráfico */}
          <div className="bg-white rounded-2xl shadow p-6 w-full overflow-x-auto flex flex-col hover:shadow-2xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">
                Gráfico de Gastos e Ganhos
              </h2>
              <button
                onClick={() => {
                  setChartType((prev) => (prev === "bar" ? "pie" : "bar"));
                  setUserChangedChart(true);
                }}
                className="p-2 rounded-full hover:bg-purple-100 transition-colors duration-200 text-gray-600 hover:text-purple-600"
                title="Alternar tipo de gráfico"
              >
                {chartType === "bar" ? (
                  <FaChartPie size={20} />
                ) : (
                  <FaChartBar size={20} />
                )}
              </button>
            </div>
            {availableYears.length > 0 ? (
              <div className="w-full h-64 md:h-80">
                {chartType === "pie" ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent, value }) =>
                          `${name}: R$ ${value.toFixed(2)} (${(percent * 100).toFixed(1)}%)`
                        }
                        className="focus:outline-0 text-wrap"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={pieColors[index % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboardData}
                      barCategoryGap={10}
                      barGap={4}
                      onMouseMove={(state) => {
                        if (state?.activeTooltipIndex !== undefined) {
                          setActiveIndex(state.activeTooltipIndex);
                        }
                      }}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(value: number) => value.toFixed(2)}
                      />
                      <Bar
                        dataKey="ganhos"
                        name="Ganhos"
                        fill="#8b5cf6"
                        radius={[8, 8, 8, 8]}
                        barSize={20}
                      />
                      <LabelList
                        dataKey="valor"
                        position="top"
                        formatter={(value: number) => value.toFixed(2)}
                      />
                      <Bar
                        dataKey="gastos"
                        name="Gastos"
                        fill="#d4c1ff"
                        radius={[8, 8, 8, 8]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 md:h-80 text-gray-500">
                Nenhum dado disponível para exibir no gráfico
              </div>
            )}
          </div>

          {/* Seção das últimas transações */}
          <Link
            href="/carteira"
            className="w-full bg-white hover:shadow-2xl transition-all duration-200 rounded-2xl shadow p-6 overflow-x-auto flex flex-col"
          >
            <h4 className="text-lg font-medium mb-4">Últimas Transações</h4>
            {latestTransactions.length === 0 ? (
              <p className="text-sm text-gray-500">
                Sem transações registradas.
              </p>
            ) : (
              latestTransactions.map((transaction, index) => (
                <div
                  key={index}
                  className="mb-4 p-4 rounded-lg bg-[#efe7ff] flex justify-between items-center"
                >
                  <div className="flex justify-between flex-col">
                    <span className="font-medium text-[#9E6EFE]">
                      {transaction.name}
                    </span>

                    <div className="text-sm text-[#9E6EFE]">
                      {formatTransactionDate(transaction)}
                    </div>
                  </div>
                  <span className="text-[#9E6EFE] font-semibold text-right text-nowrap">
                    {transaction.type === "ganho"
                      ? `+R$ ${(
                          transaction.originalValue || transaction.value
                        ).toFixed(2)}`
                      : `-R$ ${(
                          transaction.originalValue || transaction.value
                        ).toFixed(2)}`}
                  </span>
                </div>
              ))
            )}
          </Link>
        </div>
      </main>
    </div>
  );
}

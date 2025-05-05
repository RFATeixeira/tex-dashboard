"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig"; // Adicione a configuração do Firebase
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore"; // Importa funções do Firestore
import Sidebar from "../components/Sidebar";
import Presentation from "../components/Presentation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

export default function TicketPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // Controla a exibição do modal
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [boletoCode, setBoletoCode] = useState("");
  const [tickets, setTickets] = useState<any[]>([]); // Para armazenar os boletos
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null); // Armazena o boleto selecionado para edição
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setLoading(false);
        fetchTickets(user.uid); // Carregar boletos do Firebase quando o usuário estiver autenticado
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (showModal && !isEditing) {
      setTitle("");
      setDueDate("");
      setAmount("");
      setBoletoCode("");
    }
  }, [showModal, isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showModal &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModal]);

  // Função para buscar boletos no Firestore
  const fetchTickets = async (userId: string) => {
    const q = query(collection(db, "tickets"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const now = dayjs();
    const expiredTickets: string[] = [];

    const ticketsList = querySnapshot.docs
      .map((doc) => {
        const data = doc.data();
        const dueDate =
          data.dueDate instanceof Timestamp
            ? dayjs(data.dueDate.toDate())
            : dayjs(new Date(data.dueDate.seconds * 1000));

        // Se passaram mais de 5 dias após o vencimento, marcar para exclusão
        if (now.diff(dueDate, "day") > 5) {
          expiredTickets.push(doc.id);
          return null; // Não incluir na lista
        }

        return {
          id: doc.id,
          ...data,
        };
      })
      .filter(Boolean); // Remove os boletos nulos (que serão deletados)

    // Deleta os boletos vencidos há mais de 5 dias
    for (const id of expiredTickets) {
      await deleteDoc(doc(db, "tickets", id));
    }

    setTickets(ticketsList as any[]);
  };

  const [ticketData, setTicketData] = useState({
    title: "",
    dueDate: "",
    amount: "",
    boletoCode: "",
  });

  const getFormattedDate = (dueDate: any) => {
    if (dueDate instanceof Timestamp) {
      // Usa o fuso horário UTC para evitar problemas de fuso horário
      return dayjs(dueDate.toDate()).utc().format("DD/MM/YYYY");
    } else if (dueDate?.seconds) {
      // Caso venha como objeto { seconds, nanoseconds }
      return dayjs(new Date(dueDate.seconds * 1000))
        .utc()
        .format("DD/MM/YYYY");
    } else {
      // Fallback (caso seja string ou Date)
      return dayjs(dueDate).utc().format("DD/MM/YYYY");
    }
  };

  // Função para adicionar boleto
  const handleAddTicket = async () => {
    try {
      const user = auth.currentUser;
      console.log("Usuário:", user);

      if (user) {
        console.log("ticketData:", ticketData);
        console.log("Due Date:", dueDate);
        console.log("Amount:", amount);
        console.log("Boleto Code:", boletoCode);

        const newTicket = {
          ...ticketData,
          createdAt: serverTimestamp(),
          title,
          dueDate: Timestamp.fromDate(dayjs(dueDate).startOf("day").toDate()),
          amount,
          boletoCode,
          userId: user.uid,
        };

        await addDoc(collection(db, "tickets"), newTicket);
        setMessage("Boleto adicionado com sucesso!");
        setShowModal(false);
        fetchTickets(user.uid);
      }
    } catch (error) {
      console.error("Erro ao adicionar boleto: ", error);
      setMessage("Erro ao adicionar boleto.");
    }
  };

  // Função para formatar o código do boleto (exemplo simples)
  const formatBoletoCode = (code: string) => {
    // Formato fictício de código de boleto (EX: "1234.5678.9012.3456")
    return code.replace(
      /(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d{1})/,
      "$1.$2 $3.$4 $5.$6 $7 "
    );
  };

  // Função para copiar o código do boleto
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Código copiado para a área de transferência!");
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setTitle("");
    setDueDate("");
    setAmount("");
    setBoletoCode("");
    setShowModal(true);
  };

  // Função para selecionar o boleto para edição
  const handleEdit = (ticket: any) => {
    setIsEditing(true);
    setSelectedTicket(ticket);
    setShowModal(true);
    setTitle(ticket.title);
    setDueDate(ticket.dueDate);
    setAmount(ticket.amount);
    setBoletoCode(ticket.boletoCode);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("pt-BR");
  };

  // Função para apagar boleto
  const handleDelete = async (title: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await deleteDoc(doc(db, "tickets", title));
      setMessage("Boleto apagado com sucesso!");
      fetchTickets(user.uid); // Atualiza a lista
    } catch (error) {
      console.error("Erro ao apagar boleto: ", error);
      setMessage("Erro ao apagar boleto.");
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
      <Sidebar onLogout={() => {}} />
      <main className="flex-1 p-6 md:p-8 text-gray-700">
        <Presentation pageDescription="Gerencie seus Boletos." />

        <h1 className="text-2xl font-bold mb-6">Boletos</h1>
        <button
          className="py-2 px-4 bg-[#8B5CF6] hover:bg-[#6e3fdb] transition-all duration-200 cursor-pointer text-white rounded-lg"
          onClick={handleOpenCreateModal}
        >
          Adicionar Boleto
        </button>

        {message && <p className="mb-4 text-green-500">{message}</p>}

        {/* Exibindo boletos */}
        <div className="mt-6">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`bg-white p-4 mb-4 rounded-2xl shadow-md relative overflow-hidden flex flex-row justify-between transition-all duration-300 ${
                selectedTicket?.id === ticket.id ? "pr-52" : "pr-4"
              }`}
              onClick={() =>
                setSelectedTicket(
                  selectedTicket?.id === ticket.id ? null : ticket
                )
              }
            >
              <div className="flex flex-col justify-center items-start gap-2">
                <h3 className="font-semibold text-xl">{ticket.title}</h3>
                <p>
                  Valor:{" "}
                  <span className="text-red-500">
                    R$ {parseFloat(ticket.amount).toFixed(2)}
                  </span>
                </p>
              </div>

              <div className="flex flex-col items-end justify-center gap-2">
                <p className="font-semibold">
                  Vencimento:{" "}
                  <span className="font-normal">
                    {getFormattedDate(ticket.dueDate)}
                  </span>
                </p>
                <div className="flex flex-row gap-2 items-center">
                  <button
                    className="py-2 px-4 bg-[#8B5CF6] hover:bg-[#6e3fdb] transition-all duration-200 cursor-pointer text-white rounded-lg"
                    onClick={() => copyToClipboard(ticket.boletoCode)}
                  >
                    Copiar
                  </button>
                  <p className="font-semibold">
                    Código:{" "}
                    <span className="font-normal">
                      {formatBoletoCode(ticket.boletoCode)}
                    </span>{" "}
                  </p>
                </div>
              </div>

              {/* Botões deslizantes */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 right-4 flex gap-2 transition-all duration-300 ${
                  selectedTicket?.id === ticket.id
                    ? "translate-x-0 opacity-100"
                    : "translate-x-full opacity-0 pointer-events-none"
                }`}
              >
                <button
                  className="bg-[#8B5CF6] hover:bg-[#6e3fdb] px-4 py-2 transition-all duration-200 cursor-pointer text-white rounded-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(ticket);
                  }}
                >
                  Editar
                </button>
                <button
                  className="bg-red-100 hover:bg-red-200 px-4 py-2 transition-all duration-200 cursor-pointer text-red-500 rounded-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(ticket.id);
                  }}
                >
                  Apagar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal para adicionar boleto */}
        {showModal && (
          <div className="fixed inset-0 backdrop-blur-[2px] flex justify-center items-center">
            <div
              ref={modalRef}
              className="bg-white p-6 rounded-lg shadow-2xl w-96"
            >
              <h3 className="text-xl font-semibold mb-4">Adicionar Boleto</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Título do Boleto
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-600 rounded-lg focus:outline-0 placeholder:text-gray-700"
                  placeholder="Título"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-600 rounded-lg focus:outline-0 "
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Valor</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-600 rounded-lg focus:outline-0 placeholder:text-gray-700"
                  placeholder="Valor"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Código do Boleto
                </label>
                <input
                  type="text"
                  value={boletoCode}
                  onChange={(e) => setBoletoCode(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-600 rounded-lg focus:outline-0 placeholder:text-gray-700"
                  placeholder="Código"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleAddTicket}
                  className="py-2 px-4 bg-[#8B5CF6] hover:bg-[#6e3fdb] transition-all duration-200 cursor-pointer text-white rounded-lg"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="py-2 px-4 bg-gray-300 hover:bg-gray-400 transition-all duration-200 cursor-pointer text-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

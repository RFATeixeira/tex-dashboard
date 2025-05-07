import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import Head from "next/head";
import Link from "next/link";
import { BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import dayjs from "dayjs";
import { serverTimestamp, updateDoc, Timestamp } from "firebase/firestore";

interface PresentationProps {
  pageDescription?: string;
}

export default function Presentation({ pageDescription }: PresentationProps) {
  const [user, setUser] = useState<any>(null);
  const [description, setDescription] = useState<string>(pageDescription || "");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [seenNotifications, setSeenNotifications] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        setDescription(
          pageDescription || "Seu sistema de dashboard mais completo."
        );

        // Busca as informações do usuário no Firestore
        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileImage(
            data.profileImage ||
              authUser.photoURL ||
              "https://cdn.pixabay.com/photo/2012/04/26/19/43/profile-42914_960_720.png"
          );
        } else {
          setProfileImage(
            authUser.photoURL ||
              "https://cdn.pixabay.com/photo/2012/04/26/19/43/profile-42914_960_720.png"
          );
        }
      } else {
        setUser(null);
        setDescription(
          pageDescription || "Seu sistema de dashboard mais completo."
        );
        setProfileImage(null);
      }
    });

    return () => unsubscribe();
  }, [pageDescription]);

  interface Ticket {
    id: string;
    title: string;
    dueDate: Timestamp; // Use o tipo Timestamp do Firestore
    createdAt: Timestamp; // Use o tipo Timestamp do Firestore
    userId: string;
  }

  interface Ticket {
    id: string;
    title: string;
    dueDate: Timestamp; // Use o tipo Timestamp do Firestore
    createdAt: Timestamp;
    userId: string;
  }

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      const db = getFirestore();
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const lastSeen =
        userDocSnap.data()?.lastSeenNotifications?.toDate() || null;

      const ticketsRef = collection(db, "tickets");
      const q = query(ticketsRef, where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const today = dayjs().startOf("day");

      // Filtra as notificações próximas do vencimento (dentro de 3 dias)
      const twoDaysAgo = dayjs().subtract(2, "day").startOf("day");

      const alerts = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Ticket)
        .filter((ticket) => {
          const dueDate = dayjs(ticket.dueDate.toDate()).startOf("day");
          const createdAt = ticket.createdAt?.toDate?.();
          const diff = dueDate.diff(today, "day");

          return (
            diff >= 0 &&
            diff <= 3 &&
            createdAt &&
            dayjs(createdAt).isAfter(twoDaysAgo)
          );
        });

      console.log("Alerts filtrados:", alerts); // Log para verificar as notificações filtradas
      setNotifications(alerts);

      // Log para verificar o lastSeen
      console.log("Last seen:", lastSeen);

      // Verifica se há notificações mais recentes que a data de última visualização
      const unseen = alerts.some((ticket) => {
        const created = ticket.createdAt?.toDate?.() || null;
        return created && (!lastSeen || created > lastSeen);
      });

      setSeenNotifications(!unseen);
    };

    fetchNotifications();
  }, [user]);

  return (
    <>
      {showNotifications && (
        <div className="fixed inset-0 backdrop-blur-[1px] flex justify-end items-start p-8 z-50">
          <div className="bg-white shadow-lg rounded-lg w-100 max-h-[70vh] overflow-y-auto animate-slide-in px-4 py-4 mt-12 mr-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Notificações</h2>
              <XMarkIcon
                className="font-semibold h-6 w-6 cursor-pointer hover:text-black transition-all duration-100"
                onClick={() => setShowNotifications(false)}
              />
            </div>
            {notifications.length === 0 ? (
              <p className="text-gray-500">Sem notificações.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="border-b py-2 px-4 border-gray-200">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-gray-600">
                    Vence em{" "}
                    {dayjs(n.dueDate.seconds * 1000)
                      .startOf("day")
                      .diff(dayjs().startOf("day"), "day")}{" "}
                    dia(s)
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <div className="flex flex-col-reverse lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
        <Head>
          <meta name="description" content={description} />
        </Head>

        <div className="text-left">
          <h1 className="text-2xl lg:text-3xl font-semibold">
            Olá, {user?.displayName || user?.email || "Visitante"}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">{description}</p>
        </div>
        <div className="flex justify-end flex-row gap-6">
          <button
            onClick={async () => {
              setShowNotifications(true);
              setSeenNotifications(true);

              const db = getFirestore();
              const userDocRef = doc(db, "users", user.uid);
              await updateDoc(userDocRef, {
                lastSeenNotifications: serverTimestamp(),
              });
            }}
            className="relative cursor-pointer"
          >
            <BellIcon className="h-6 w-6 text-gray-700 hover:text-black transition duration-200" />
            {!seenNotifications && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1.5">
                {
                  notifications.filter((n) => {
                    const created = n.createdAt?.toDate?.();
                    return created && (!lastSeen || created > lastSeen);
                  }).length
                }
              </span>
            )}
          </button>

          <Link href="/ajustes" className="flex items-center gap-2">
            <img
              src={
                profileImage ||
                "https://cdn.pixabay.com/photo/2012/04/26/19/43/profile-42914_960_720.png"
              }
              alt="Imagem de perfil"
              className="w-10 h-10 rounded-full object-cover shadow-lg"
            />
            <h1 className="text-md font-medium hidden md:block">
              {user?.displayName || user?.email || "Visitante"}
            </h1>
          </Link>
        </div>
      </div>
    </>
  );
}

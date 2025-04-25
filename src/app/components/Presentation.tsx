import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import Head from "next/head";
import Link from "next/link";

interface PresentationProps {
  pageDescription?: string;
}

export default function Presentation({ pageDescription }: PresentationProps) {
  const [user, setUser] = useState<any>(null);
  const [description, setDescription] = useState<string>(pageDescription || "");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        setDescription(
          pageDescription || "Seu sistema de dashboard mais completo."
        );

        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileImage(
            data.profileImage ||
              "https://cdn.pixabay.com/photo/2012/04/26/19/43/profile-42914_960_720.png"
          );
        } else {
          setProfileImage(
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

  return (
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

      <Link href="/ajustes" className="flex justify-end items-center gap-4">
        <img
          src={
            profileImage ||
            "https://cdn.pixabay.com/photo/2012/04/26/19/43/profile-42914_960_720.png"
          }
          alt="Imagem de perfil"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-lg"
        />
        <h1 className="text-md sm:text-lg font-medium hidden md:contents">
          {user?.displayName || user?.email || "Visitante"}
        </h1>
      </Link>
    </div>
  );
}

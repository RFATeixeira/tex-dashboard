import { Metadata } from "next";
import CarteiraClient from "./CarteiraClient";

export const metadata: Metadata = {
  title: "Carteira",
  description: "Sua carteira de ganhos e gastos.",
};

export default function CarteiraPage() {
  return <CarteiraClient />;
}

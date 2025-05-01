import { Metadata } from "next";
import AjustesClient from "./AjustesClient";

export const metadata: Metadata = {
  title: "Ajustes",
  description: "Altere os dados caso necessário.",
};

export default function AjustesPage() {
  return <AjustesClient />;
}

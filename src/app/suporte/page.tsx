import { Metadata } from "next";
import SuporteClient from "./SuporteClient";

export const metadata: Metadata = {
  title: "Suporte",
  description: "Entre em contato conosco!",
};

export default function SuportePage() {
  return <SuporteClient />;
}

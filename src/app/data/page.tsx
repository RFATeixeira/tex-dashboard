import { Metadata } from "next";
import DataClient from "./DataClient";

export const metadata: Metadata = {
  title: "Carteira",
  description: "Registre seus ganhos e gastos.",
};

export default function DataPage() {
  return <DataClient />;
}

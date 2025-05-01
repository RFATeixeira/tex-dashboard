import { Metadata } from "next";
import TransactionClient from "./TransactionClient";

export const metadata: Metadata = {
  title: "Transações",
  description: "Veja as transações realizadas.",
};

export default function TransactionPage() {
  return <TransactionClient />;
}

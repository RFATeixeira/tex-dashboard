import { Metadata } from "next";
import TicketClient from "./TicketClient";

export const metadata: Metadata = {
  title: "Boletos",
  description: "Entre em contato conosco!",
};

export default function TicketPage() {
  return <TicketClient />;
}

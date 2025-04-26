import { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Finance Dashboard",
  description: "Seu sistema de finance dashboard mais completo.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}

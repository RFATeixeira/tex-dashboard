import { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Cadastro",
  description: "Realize o Cadastro na Tex Finance Dashboard.",
};

export default function RegisterPage() {
  return <RegisterClient />;
}

import { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Login",
  description: "Realize o login na Tex Finance Dashboard.",
};

export default function LoginPage() {
  return <LoginClient />;
}

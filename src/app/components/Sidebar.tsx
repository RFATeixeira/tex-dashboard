"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CreditCardIcon,
  ShoppingCartIcon,
  LifebuoyIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { MenuIcon, XIcon, Barcode } from "lucide-react";

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Botão hamburguer fixo no topo (mobile only) */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow-md"
      >
        {isOpen ? (
          <XIcon className="h-6 w-6 text-purple-600" />
        ) : (
          <MenuIcon className="h-6 w-6 text-purple-600" />
        )}
      </button>

      {/* Sidebar - modificada para ser fixa em todos os tamanhos de tela */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white p-6 shadow-lg transform transition-transform duration-300 z-40 rounded-r-3xl overflow-y-auto
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex flex-col justify-between h-full">
          <div>
            {/* Adiciona margem superior para o título ficar abaixo do menu hamburguer */}
            <div className="flex flex-col items-center justify-center mb-8">
              <img
                className="w-40 h-40"
                src="../../../TexFinanceDashboard_Logo_no_bg.png"
                alt="Tex Finance Dashboard Logo"
              />
              <p className="text-gray-600 font-medium text-2xl text-center -mt-6 leading-5">
                <span className="text-[#8B5CF6] font-semibold">T</span>ex{" "}
                <span className="text-[#8B5CF6] font-semibold">F</span>
                inance <span className="text-[#8B5CF6] font-semibold">D</span>
                ashboard
              </p>
            </div>
            <nav className="space-y-4 text-gray-700">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-100 hover:text-purple-600 transition-all"
              >
                <ChartBarIcon className="h-5 w-5" />
                Dashboard
              </Link>
              <Link
                href="/data"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-100 hover:text-purple-600 transition-all"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Inserir Dados
              </Link>
              <Link
                href="/carteira"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-100 hover:text-purple-600 transition-all"
              >
                <CreditCardIcon className="h-5 w-5" />
                Carteira
              </Link>

              <Link
                href="/transaction"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-100 hover:text-purple-600 transition-all"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                Transações
              </Link>

              <Link
                href="/ticket"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-100 hover:text-purple-600 transition-all"
              >
                <Barcode className="h-5 w-5" />
                Boletos
              </Link>

              <Link
                href="/suporte"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-100 hover:text-purple-600 transition-all"
              >
                <LifebuoyIcon className="h-5 w-5" />
                Suporte
              </Link>

              <div className="flex-grow border-t border-2 border-gray-100"></div>

              <Link
                href="/ajustes"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-100 hover:text-purple-600 transition-all"
              >
                <Cog6ToothIcon className="h-5 w-5" />
                Ajustes
              </Link>
              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-300 transition-all cursor-pointer w-full"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Desconectar
              </button>
            </nav>
          </div>
        </div>
      </aside>

      {/* Espaçador para compensar o espaço da sidebar em telas grandes */}
      <div className="hidden lg:block w-64"></div>
    </>
  );
}

"use client";

import * as React from "react";
import { CreditCard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu";
import { Button } from "@texnomart/ui/button";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const [language, setLanguage] = React.useState<"ru" | "uz">("ru");

  return (
    <div className="flex min-h-screen">
      {/* Brand Panel - Left 60% */}
      <div className="hidden lg:flex lg:w-[60%] bg-primary flex-col p-12 relative">
        {/* Logo top-left */}
        <div className="flex items-center gap-3">
          <svg
            width="40"
            height="40"
            viewBox="160 0 20 38"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            <path
              d="M179.653 12.0021L177.301 15.8257L172.596 13.2016V18.4497H167.891V13.2016L163.186 15.8257L160.834 12.0021L165.617 9.37804L160.912 6.75401L163.186 2.93043L167.891 5.55446V0.306396H172.596V5.55446L177.301 2.93043L179.575 6.75401L174.87 9.37804L179.653 12.0021Z"
              fill="currentColor"
            />
          </svg>
          <span className="text-2xl font-bold text-black">Texnomart</span>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <CreditCard className="size-24 text-black mb-8" strokeWidth={1.5} />
          <h1 className="text-4xl font-bold text-black mb-4">Кредитный брокер</h1>
          <p className="text-lg text-gray-900 max-w-md">
            Административная панель управления BNPL-агрегатором
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-900">
          <span>© Texnomart, 2026</span>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">
              Документация
            </a>
            <a href="#" className="hover:underline">
              Поддержка
            </a>
          </div>
        </div>
      </div>

      {/* Form Panel - Right 40% */}
      <div className="flex-1 lg:w-[40%] bg-white flex flex-col">
        {/* Language selector top-right */}
        <div className="flex justify-end p-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {language === "ru" ? "RU" : "O'zbek"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage("ru")}>
                Русский
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("uz")}>
                O'zbek
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Form content - centered */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-[400px]">
            {/* Mobile logo */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <div className="flex items-center gap-3 mb-4">
                <svg
                  width="40"
                  height="40"
                  viewBox="160 0 20 38"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <path
                    d="M179.653 12.0021L177.301 15.8257L172.596 13.2016V18.4497H167.891V13.2016L163.186 15.8257L160.834 12.0021L165.617 9.37804L160.912 6.75401L163.186 2.93043L167.891 5.55446V0.306396H172.596V5.55446L177.301 2.93043L179.575 6.75401L174.87 9.37804L179.653 12.0021Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-2xl font-bold">Texnomart</span>
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

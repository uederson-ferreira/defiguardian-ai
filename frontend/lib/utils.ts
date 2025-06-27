/**
 * MÓDULO: Utilitários Simples
 * LOCALIZAÇÃO: lib/utils.ts
 * DESCRIÇÃO: Função cn para combinar classes CSS (caso não tenha)
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Se não tiver clsx instalado, use esta versão simples:
/*
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
*/
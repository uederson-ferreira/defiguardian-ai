// frontend/src/components/dashboard-layout.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { PieChart, Settings, Menu, Home, Database, TrendingUp, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { AIChat } from "@/components/ai-chat"
import { WalletButton } from "@/components/wallet-button"
import { useAuth } from "@/contexts/AuthContext"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Portfolios", href: "/portfolios", icon: PieChart },
  { name: "Protocols", href: "/protocols", icon: Database },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-700/50 px-6">
        <Zap className="h-8 w-8 text-purple-400" />
        <span className="ml-2 text-xl font-bold text-white">DefiGuardian</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-purple-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* AI Chat at bottom */}
      <div className="border-t border-slate-700/50 p-4">
        <AIChat />
      </div>
    </div>
  )
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { isAuthenticated, loading, user } = useAuth()
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to home...')
      window.location.href = '/'
    }
  }, [isAuthenticated, loading])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:z-20 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-slate-900/80 backdrop-blur-md border-r border-slate-700/50">
          <SidebarContent pathname={pathname} />
        </div>
      </div>

      {/* Top Header Bar */}
      <header className="fixed top-0 right-0 left-0 md:left-64 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="flex items-center justify-between h-full px-6">
          {/* Mobile menu button */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden text-white" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-slate-900/95 border-slate-700">
              <SidebarContent pathname={pathname} />
            </SheetContent>
          </Sheet>

          {/* Page Title - Mobile */}
          <div className="md:hidden">
            <h1 className="text-lg font-semibold text-white">
              {navigation.find(item => item.href === pathname)?.name || 'DefiGuardian'}
            </h1>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-4">
            {/* User info - Desktop */}
            <div className="hidden md:block">
              <p className="text-sm text-slate-400">
                Welcome back
              </p>
              <p className="text-sm font-medium text-white">
                {user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : 'User'}
              </p>
            </div>
            
            {/* Wallet Button */}
            {isClient && <WalletButton />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:pl-64 pt-16">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
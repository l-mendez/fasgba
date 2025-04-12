"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home, LayoutDashboard, LogOut, Menu, MessageSquare, Trophy, Users, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClubContextProvider, useClubContext } from "./context/club-context"

function ClubAdminHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { selectedClub, clubesAdministrados, handleClubChange, isLoading } = useClubContext()

  // Navegación principal
  const mainNav = [
    {
      title: "Dashboard",
      href: "/club-admin",
      icon: LayoutDashboard,
      active: pathname === "/club-admin",
    },
    {
      title: "Miembros",
      href: "/club-admin/miembros",
      icon: Users,
      active: pathname.startsWith("/club-admin/miembros"),
    },
    {
      title: "Noticias",
      href: "/club-admin/noticias",
      icon: MessageSquare,
      active: pathname.startsWith("/club-admin/noticias"),
    },
    {
      title: "Torneos",
      href: "/club-admin/torneos",
      icon: Trophy,
      active: pathname.startsWith("/club-admin/torneos"),
    },
  ]

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 pr-0">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-2">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <BarChart3 className="h-6 w-6" />
                <span className="text-lg font-bold">FASGBA</span>
              </Link>
              <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
                <span className="sr-only">Cerrar menú</span>
              </Button>
            </div>
            <div className="px-2 py-2">
              <div className="mb-2 text-xs font-semibold tracking-tight">Club seleccionado</div>
              {isLoading ? (
                <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                  Cargando clubes...
                </div>
              ) : clubesAdministrados.length > 0 ? (
                <Select 
                  value={selectedClub?.id.toString() || ''} 
                  onValueChange={handleClubChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubesAdministrados.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={club.logo} alt={club.nombre} />
                            <AvatarFallback className="text-xs">
                              {club.nombre
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{club.nombre}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                  No administras ningún club
                </div>
              )}
            </div>
            <nav className="grid gap-1 px-2">
              {mainNav.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                    item.active ? "bg-terracotta text-white" : "hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              ))}
            </nav>
            <div className="mt-auto px-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Volver al sitio
                </Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 font-semibold md:hidden">
          <BarChart3 className="h-6 w-6" />
          <span className="text-lg font-bold">FASGBA</span>
        </Link>
      </div>
      <div className="hidden gap-1 md:flex">
        {mainNav.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`flex h-9 items-center gap-1 rounded-md px-3 text-sm font-medium ${
              item.active ? "bg-terracotta text-white" : "hover:bg-muted"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-4">
        {/* Selector de club para escritorio */}
        <div className="hidden md:block">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Cargando clubes...</div>
          ) : clubesAdministrados.length > 0 ? (
            <Select 
              value={selectedClub?.id.toString() || ''} 
              onValueChange={handleClubChange}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Seleccionar club" />
              </SelectTrigger>
              <SelectContent>
                {clubesAdministrados.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={club.logo} alt={club.nombre} />
                        <AvatarFallback className="text-xs">
                          {club.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{club.nombre}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-muted-foreground">No administras ningún club</div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Avatar" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/perfil">Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/configuracion">Configuración</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/logout" className="text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default function ClubAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClubContextProvider>
      <div className="flex min-h-screen flex-col">
        <ClubAdminHeader />
        <main className="flex-1">{children}</main>
      </div>
    </ClubContextProvider>
  )
}


"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Home,
  Building2,
  Calendar,
  BookOpen,
  Settings,
  Users,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  organisation?: {
    id: string;
    name: string;
  };
  userPreferences?: {
    establishmentType: string;
  };
}

export function Sidebar({ organisation, userPreferences }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const unitTerminology =
    userPreferences?.establishmentType === "hotel" ? "Chambres" : "Espaces";

  const navigation = [
    {
      name: "Tableau de bord",
      href: "/dashboard",
      icon: Home,
      current: pathname === "/dashboard",
    },
    {
      name: "Propriétés",
      href: "/dashboard/properties",
      icon: Building2,
      current: pathname.startsWith("/dashboard/properties"),
    },
    {
      name: unitTerminology,
      href: "/dashboard/rooms",
      icon: BookOpen,
      current: pathname.startsWith("/dashboard/rooms"),
    },
    {
      name: "Planning",
      href: "/dashboard/calendar",
      icon: Calendar,
      current: pathname.startsWith("/dashboard/calendar"),
    },
    {
      name: "Réservations",
      href: "/dashboard/reservations",
      icon: Users,
      current: pathname.startsWith("/dashboard/reservations"),
    },
    {
      name: "Paramètres",
      href: "/dashboard/settings",
      icon: Settings,
      current: pathname.startsWith("/dashboard/settings"),
    },
  ];

  return (
    <div
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } min-h-screen flex flex-col`}
    >
      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-airbnb-red rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">OTB</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-airbnb-charcoal text-lg">
              Channel Manager
            </span>
          )}
        </Link>
      </div>

      {/* Organisation Selector */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span className="truncate">{organisation?.name}</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Organisations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Building2 className="mr-2 h-4 w-4" />
                {organisation?.name}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Gérer les organisations</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.current
                    ? "bg-airbnb-red text-white"
                    : "text-airbnb-charcoal hover:bg-gray-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-airbnb-red rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-airbnb-charcoal">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-airbnb-dark-gray">
                      {session?.user?.email}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Préférences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut()}
            className="w-full"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Collapse Button */}
      <div className="p-2 border-t border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full"
        >
          <ChevronDown
            className={`h-4 w-4 transform transition-transform ${
              isCollapsed ? "rotate-90" : "-rotate-90"
            }`}
          />
        </Button>
      </div>
    </div>
  );
}

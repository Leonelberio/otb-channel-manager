"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Settings, LogOut, ChevronDown, Building2 } from "lucide-react";
import Link from "next/link";

interface Organisation {
  id: string;
  name: string;
}

interface AppHeaderProps {
  currentOrganisation?: Organisation;
  organizations?: Organisation[];
  showOrgSwitch?: boolean;
  title?: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export function AppHeader({
  currentOrganisation,
  organizations = [],
  showOrgSwitch = false,
  title,
  subtitle,
  rightContent,
}: AppHeaderProps) {
  const { data: session } = useSession();
  const [selectedOrgId, setSelectedOrgId] = useState(
    currentOrganisation?.id || ""
  );

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    // Here you would typically update the user's active organization
    // For now, we'll just update the local state
    console.log("Switching to organization:", orgId);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Organization Switcher */}
            {showOrgSwitch && organizations.length > 1 && (
              <>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <Select value={selectedOrgId} onValueChange={handleOrgChange}>
                    <SelectTrigger className="w-48 border-gray-200">
                      <SelectValue placeholder="Sélectionner une organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-6 w-px bg-gray-300" />
              </>
            )}

            {/* Title Section */}
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-airbnb-charcoal">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-airbnb-dark-gray">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Right Content */}
            {rightContent}

            {/* User Menu */}
            {session && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-airbnb-charcoal truncate max-w-32">
                        {session.user?.name}
                      </p>
                      <p className="text-xs text-airbnb-dark-gray truncate max-w-32">
                        {session.user?.email}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

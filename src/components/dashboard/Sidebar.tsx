"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Home,
  Building2,
  Calendar,
  Settings,
  Users,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  Hotel,
  Building,
  Info,
  ArrowLeftRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Property {
  id: string;
  name: string;
  establishmentType: string;
  roomCount?: number;
}

interface PropertyApiResponse {
  id: string;
  name: string;
  establishmentType: string;
  roomCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rooms: any[];
  createdAt: string;
  updatedAt: string;
}

interface SidebarProps {
  organisation?: {
    id: string;
    name: string;
  };
  userPreferences?: {
    establishmentType: string;
  };
  properties?: Property[];
}

export function Sidebar({
  organisation,
  userPreferences,
  properties: initialProperties = [],
}: SidebarProps) {
  console.log("🔧 Sidebar initializing with:", {
    count: initialProperties.length,
    properties: initialProperties.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.establishmentType,
    })),
  });

  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [isFetchingProperties, setIsFetchingProperties] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Detect current property from pathname
  const currentProperty = useMemo(() => {
    const propertyMatch = pathname.match(/\/dashboard\/properties\/([^\/]+)/);
    if (propertyMatch && propertyMatch[1] !== "new") {
      const propertyId = propertyMatch[1];
      return properties.find((p) => p.id === propertyId) || null;
    }
    return null;
  }, [pathname, properties]);

  // Fetch properties when current property is not found in the list
  useEffect(() => {
    const propertyMatch = pathname.match(/\/dashboard\/properties\/([^\/]+)/);
    if (propertyMatch && propertyMatch[1] !== "new") {
      const propertyId = propertyMatch[1];
      const foundProperty = properties.find((p) => p.id === propertyId);

      // If property not found in current list, refetch properties immediately
      if (!foundProperty) {
        fetchProperties();
      }
    }
  }, [pathname, properties]);

  // Removed the useEffect that always refetches on property pages

  const fetchProperties = async () => {
    // Simple protection against multiple simultaneous fetches
    if (isFetchingProperties) {
      return;
    }

    setIsFetchingProperties(true);
    try {
      const response = await fetch("/api/properties");
      if (response.ok) {
        const { properties: data } = await response.json();
        // Transform the data to match our Property interface
        const transformedProperties = data.map(
          (property: PropertyApiResponse) => ({
            id: property.id,
            name: property.name,
            establishmentType: property.establishmentType,
            roomCount: property.roomCount || 0,
          })
        );
        setProperties(transformedProperties);
        setLastFetchTime(Date.now());
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsFetchingProperties(false);
    }
  };

  // Update last active property when currentProperty changes
  useEffect(() => {
    if (currentProperty) {
      updateLastActiveProperty(currentProperty.id);
    }
  }, [currentProperty]);

  const updateLastActiveProperty = async (propertyId: string) => {
    try {
      await fetch("/api/user/last-active-property", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ propertyId }),
      });
    } catch (error) {
      console.error("Error updating last active property:", error);
    }
  };

  const handlePropertySwitch = async (propertyId: string) => {
    await updateLastActiveProperty(propertyId);
    router.push(`/dashboard/properties/${propertyId}`);
  };

  const getPropertyIcon = (establishmentType: string) => {
    return establishmentType === "hotel" ? Hotel : Building;
  };

  const getPropertyTerminology = (establishmentType: string) => {
    return establishmentType === "hotel" ? "Chambres" : "Espaces";
  };

  // If we're in a property context, show property-focused navigation
  if (currentProperty) {
    const PropertyIcon = getPropertyIcon(currentProperty.establishmentType);
    const terminology = getPropertyTerminology(
      currentProperty.establishmentType
    );

    const propertyNavigation = [
      {
        name: "Vue d'ensemble",
        href: `/dashboard/properties/${currentProperty.id}`,
        icon: Home,
        current: pathname === `/dashboard/properties/${currentProperty.id}`,
      },
      {
        name: terminology,
        href: `/dashboard/properties/${currentProperty.id}/rooms`,
        icon: PropertyIcon,
        current:
          pathname === `/dashboard/properties/${currentProperty.id}/rooms`,
        count: currentProperty.roomCount,
      },
      {
        name: "Planning",
        href: `/dashboard/properties/${currentProperty.id}/calendar`,
        icon: Calendar,
        current: pathname.startsWith(
          `/dashboard/properties/${currentProperty.id}/calendar`
        ),
      },
      {
        name: "Réservations",
        href: `/dashboard/properties/${currentProperty.id}/reservations`,
        icon: Users,
        current: pathname.startsWith(
          `/dashboard/properties/${currentProperty.id}/reservations`
        ),
      },
      {
        name: "Paramètres",
        href: `/dashboard/properties/${currentProperty.id}/settings`,
        icon: Settings,
        current:
          pathname === `/dashboard/properties/${currentProperty.id}/settings`,
      },
    ];

    return (
      <div
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Property Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-2 hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        currentProperty.establishmentType === "hotel"
                          ? "bg-blue-100"
                          : "bg-green-100"
                      }`}
                    >
                      <PropertyIcon
                        className={`h-5 w-5 ${
                          currentProperty.establishmentType === "hotel"
                            ? "text-blue-600"
                            : "text-green-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <h2 className="text-sm font-semibold text-airbnb-charcoal truncate">
                        {currentProperty.name}
                      </h2>
                      <p className="text-xs text-airbnb-dark-gray">
                        {currentProperty.establishmentType === "hotel"
                          ? "Hôtel"
                          : "Espace"}
                      </p>
                    </div>
                    <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Changer de propriété</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {properties.map((property) => {
                  const Icon = getPropertyIcon(property.establishmentType);
                  return (
                    <DropdownMenuItem
                      key={property.id}
                      onClick={() => handlePropertySwitch(property.id)}
                      className={
                        currentProperty.id === property.id ? "bg-gray-50" : ""
                      }
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span className="flex-1">{property.name}</span>
                      {currentProperty.id === property.id && (
                        <span className="text-xs text-main">✓</span>
                      )}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/properties")}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Toutes mes propriétés
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User Profile */}
        {session && !isCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-airbnb-charcoal truncate">
                        {session.user?.name}
                      </p>
                      <p className="text-xs text-airbnb-dark-gray truncate">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {propertyNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.current
                      ? "bg-main text-white"
                      : "text-airbnb-charcoal hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </div>
                  {!isCollapsed && item.count !== undefined && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        item.current
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  // Default navigation when no property is selected
  const defaultNavigation = [
    {
      name: "Tableau de bord",
      href: "/dashboard/properties",
      icon: Home,
      current:
        pathname === "/dashboard" || pathname === "/dashboard/properties",
    },
    {
      name: "Mes Propriétés",
      href: "/dashboard/properties",
      icon: Building2,
      current: pathname.startsWith("/dashboard/properties"),
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
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Organization Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-main rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">OTB</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-airbnb-charcoal">
                {organisation?.name || "Organisation"}
              </h2>
              <p className="text-xs text-airbnb-dark-gray">Channel Manager</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Profile */}
      {session && !isCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-airbnb-charcoal truncate">
                      {session.user?.name}
                    </p>
                    <p className="text-xs text-airbnb-dark-gray truncate">
                      {session.user?.email}
                    </p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {defaultNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.current
                    ? "bg-main text-white"
                    : "text-airbnb-charcoal hover:bg-gray-100"
                }`}
              >
                <Icon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

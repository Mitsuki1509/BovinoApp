import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Settings,
  Users,
  BarChart3,
  Package,
  Boxes,
  PackageOpen,
  ShoppingCart,
  LogOut,
  Stethoscope,
  User,
  Heart,
  ChevronDown,
  HelpCircle, 
  MessageSquare, 
  LifeBuoy,
  Scale,
  Utensils,
  Calendar,
  Tag,
  MapPin,
  Syringe,
  Weight
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Usuarios", href: "/users", icon: Users },
  { title: "Tipos de eventos", href: "/tipos_evento", icon: Calendar },
  { title: "Alimentación", href: "/control_alimentacion", icon: Utensils },
  { title: "Pesajes", href: "/pesajes", icon: Scale },
];

// Constantes para el grupo Help
const inventario = [
  { title: "Insumos", href: "/insumos", icon: Package },
  { title: "Compras", href: "/compras", icon: ShoppingCart },
  { title: "Proveedores", href: "/proveedores", icon: Users },
];

const ganado = [
  { title: "Animales", href: "/animales", icon: Heart },
  { title: "Razas", href: "/razas", icon: Tag },
  { title: "Lotes", href: "/lotes", icon: Boxes },
  { title: "Potreros", href: "/potreros", icon: MapPin },
];

const sanidad = [
  { title: "Eventos Sanitarios", href: "/eventos_sanitarios", icon: Stethoscope },
  { title: "Uso de Insumos", href: "/uso_insumos", icon: Syringe },
];

const pesaje = [
  { title: "Registro de Pesajes", href: "/pesajes", icon: Weight },
];

const produccion = [
  { title: "Producción Lechera", href: "/produccion_lechera", icon: HelpCircle },
  { title: "Producción Cárnica", href: "/produccion_carnica", icon: Package },
];

const reproduccion = [
  { title: "Montas", href: "/montas", icon: Heart },
  { title: "Diagnóstico de Preñez", href: "/diagnostico_preñez", icon: Stethoscope },
  { title: "Partos", href: "/partos", icon: HelpCircle },
];

export function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, checkAuth } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const isAuthenticated = await checkAuth();
        
        if (!isAuthenticated) {
          console.log("No autenticado, redirigiendo a login");
          navigate('/login', { replace: true });
          return;
        }
        
        setIsCheckingAuth(false);
      } catch (error) {
        navigate('/login', { replace: true });
      }
    };

    if (!user) {
      verifyAuth();
    } else {
      setIsCheckingAuth(false);
    }
  }, [user, checkAuth, navigate]);

  const handleLogout = async () => {
    await logout();
  };

  const getPageTitle = () => {
    const currentItem = navItems.find((item) => item.href === location.pathname);
    const inventarioItem = inventario.find((item) => item.href === location.pathname);
    const ganadoItem = ganado.find((item) => item.href === location.pathname);
    const sanidadItem = sanidad.find((item) => item.href === location.pathname);
    const pesajeItem = pesaje.find((item) => item.href === location.pathname);
    const produccionItem = produccion.find((item) => item.href === location.pathname);
    const reproduccionItem = reproduccion.find((item) => item.href === location.pathname);

    return currentItem ? currentItem.title : 
           inventarioItem ? inventarioItem.title :
           ganadoItem ? ganadoItem.title : 
           sanidadItem ? sanidadItem.title :
           pesajeItem ? pesajeItem.title : 
           produccionItem ? produccionItem.title :
           reproduccionItem ? reproduccionItem.title : "Dashboard";
  };

  const getUserDisplayName = () => {
    if (!user) return 'Usuario';
    if (user.nombre) return user.nombre;
    if (user.correo) {
      const username = user.correo.split('@')[0];
      return username.charAt(0).toUpperCase() + username.slice(1);
    }
    return 'Usuario';
  };

  const getUserInitials = () => {
    if (user?.nombre) {
      return user.nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    if (user?.correo) {
      return user.correo.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full">
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg">
                          <img 
                            src="/Logo.png" 
                            alt="Logo Finca San Pablo" 
                            className="w-8 h-8 object-contain"
                          /> 
                        </div>
                        <div className="flex flex-col flex-1 text-left">
                          <span className="font-semibold text-sm">Finca San Pablo</span>
                          <span className="text-xs text-muted-foreground">Sistema de Gestión</span>
                        </div>
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                    <DropdownMenuItem>
                      <span>Finca San Pablo</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>Configuración de Finca</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <div className="p-2">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Navegación Principal
              </div>
              <SidebarMenu>
                {navItems.slice(0, 5).map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>

            <div className="p-2">
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Inventario
                      </span>
                      <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {inventario.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.href;
                          
                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton asChild isActive={isActive}>
                                <Link to={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            </div>

            <div className="p-2">
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Ganado
                      </span>
                      <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {ganado.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.href;
                          
                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton asChild isActive={isActive}>
                                <Link to={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            </div>

            <div className="p-2">
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Sanidad
                      </span>
                      <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {sanidad.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.href;
                          
                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton asChild isActive={isActive}>
                                <Link to={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            </div>

            <div className="p-2">
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Producción
                      </span>
                      <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {produccion.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.href;
                          
                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton asChild isActive={isActive}>
                                <Link to={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            </div>

            {/* Grupo Reproducción Colapsable */}
            <div className="p-2">
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Reproducción
                      </span>
                      <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {reproduccion.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.href;
                          
                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton asChild isActive={isActive}>
                                <Link to={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            </div>
          </SidebarContent>

          <SidebarFooter>
            <div className="p-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start h-auto p-2">
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0 text-left">
                        <span className="text-sm font-medium truncate">
                          {getUserDisplayName()}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {user.correo || "Correo no disponible"}
                        </span>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">{getUserDisplayName()}</div>
                    <div className="text-muted-foreground truncate">
                      {user.correo || "Correo no disponible"}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/configuracion" className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configuración</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-h-screen">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px]">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
            </div>
          </header>
          <div className="flex-1 p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
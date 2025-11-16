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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Settings,
  Users,
  Package,
  ShoppingCart,
  LogOut,
  Stethoscope,
  User,
  Heart,
  ChevronDown,
  HelpCircle, 
  Scale,
  Utensils,
  Calendar,
  Tag,
  MapPin,
  Weight,
  Bell 
} from "lucide-react";
import { FaCow, FaClipboardCheck } from 'react-icons/fa6';
import { useAuthStore } from "@/store/authStore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { Badge } from "@/components/ui/badge"; 
import { useNotificacionStore } from "@/store/notificacionStore"; 
import ModalNotificaciones from "@/components/notificaciones/ModalNotificaciones"; 

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Usuarios", href: "/users", icon: Users },
  { title: "Tipos de eventos", href: "/types", icon: Calendar }
];

const inventario = [
  { title: "Insumos", href: "/gestion-insumos", icon: Package },
  { title: "Compras", href: "/gestion-compras", icon: ShoppingCart },
  { title: "Proveedores", href: "/proveedores", icon: Users },
];

const ganado = [
  { title: "Animales", href: "/animales", icon: FaCow },
  { title: "Razas", href: "/razas", icon: Tag },
  { title: "Gestión de Áreas", href: "/gestion-areas", icon: MapPin },
  { title: "Alimentación", href: "/alimentaciones", icon: Utensils },
  { title: "Pesajes", href: "/pesajes", icon: Scale },
];

const sanidad = [
  { title: "Eventos Sanitarios", href: "/evento", icon: Stethoscope },
];
const pesaje = [
  { title: "Registro de Pesajes", href: "/pesajes", icon: Weight },
];

const produccion = [
  { title: "Producción Lechera", href: "/produccionLechera", icon: HelpCircle },
  { title: "Producción Cárnica", href: "/produccionCarne", icon: Package },
];

const reproduccion = [
  { title: "Montas", href: "/montas", icon: FaClipboardCheck },
  { title: "Diagnóstico de Preñez", href: "/diagnosticos", icon: Stethoscope },
  { title: "Partos", href: "/partos", icon: FaCow },
];

export function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, checkAuth } = useAuthStore();
  const { notificacionesNoLeidas } = useNotificacionStore(); 
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [modalNotificacionesAbierto, setModalNotificacionesAbierto] = useState(false); 

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const isAuthenticated = await checkAuth();
        
        if (!isAuthenticated) {
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

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="bg-slate-50 border-r border-slate-200">
          <SidebarHeader className="relative h-32 border-b border-slate-200">
            <div 
              className="absolute inset-0 bg-cover bg-center "
              style={{
                backgroundImage: 'url("/layout.jpg")',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/50"></div>
            </div>
            
            <div className="relative z-10 flex items-center justify-center h-full p-4">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-1">Finca San Pablo</h1>
                <p className="text-white/80 text-sm">Sistema de Gestión</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="flex-1 overflow-auto">
            <div className="p-3">
              <div className="px-2 py-2 text-xs font-medium text-slate-600 uppercase tracking-wide">
                Navegación Principal
              </div>
              <SidebarMenu>
                {navItems.slice(0, 5).map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} className="py-3">
                        <Link to={item.href}>
                          <Icon className="h-5 w-5" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>

            <div className="p-3">
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 cursor-pointer hover:bg-slate-100 rounded-md transition-colors">
                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Inventario
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {inventario.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.href;
                          
                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton asChild isActive={isActive} className="py-2">
                                <Link to={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span className="text-sm">{item.title}</span>
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

            <div className="p-3">
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 cursor-pointer hover:bg-slate-100 rounded-md transition-colors">
                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Ganado
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {ganado.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.href;
                          
                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton asChild isActive={isActive} className="py-2">
                                <Link to={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span className="text-sm">{item.title}</span>
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

            <div className="p-3">
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 cursor-pointer hover:bg-slate-100 rounded-md transition-colors">
                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Sanidad
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {sanidad.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.href;
                          
                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton asChild isActive={isActive} className="py-2">
                                <Link to={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span className="text-sm">{item.title}</span>
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

            <div className="p-3">
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 cursor-pointer hover:bg-slate-100 rounded-md transition-colors">
                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Producción
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {produccion.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.href;
                          
                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton asChild isActive={isActive} className="py-2">
                                <Link to={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span className="text-sm">{item.title}</span>
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

            <div className="p-3">
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 cursor-pointer hover:bg-slate-100 rounded-md transition-colors">
                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Reproducción
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {reproduccion.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.href;
                          
                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton asChild isActive={isActive} className="py-2">
                                <Link to={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span className="text-sm">{item.title}</span>
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

          <SidebarFooter className="border-t border-slate-200 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start h-auto p-3 hover:bg-slate-100">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-9 w-9 border-2 border-slate-200">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0 text-left">
                      <span className="text-sm font-medium truncate text-slate-900">
                        {getUserDisplayName()}
                      </span>
                      <span className="text-xs text-slate-600 truncate">
                        {user.correo || "Correo no disponible"}
                      </span>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{getUserDisplayName()}</div>
                  <div className="text-slate-600 truncate">
                    {user.correo || "Correo no disponible"}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/perfil" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
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
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-h-screen bg-white">
          <header className="flex h-14 items-center gap-4 border-b bg-white px-6 lg:h-[60px]">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-slate-900">{getPageTitle()}</h1>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setModalNotificacionesAbierto(true)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {notificacionesNoLeidas > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
                </Badge>
              )}
            </Button>
          </header>
          
          <div className="flex-1 p-6 bg-slate-50">{children}</div>
        </main>

        <ModalNotificaciones 
          open={modalNotificacionesAbierto} 
          onOpenChange={setModalNotificacionesAbierto} 
        />
      </div>
    </SidebarProvider>
  );
}
import React, { useEffect, useState, useRef } from "react";
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
  Users,
  Package,
  ShoppingCart,
  LogOut,
  Stethoscope,
  ChevronDown,
  Scale,
  Utensils,
  Calendar,
  Tag,
  MapPin,
  Bell,
  Milk
} from "lucide-react";
import { FaCow, FaClipboardCheck } from 'react-icons/fa6';
import { useAuthStore } from "@/store/authStore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { Badge } from "@/components/ui/badge"; 
import { useNotificacionStore } from "@/store/notificacionStore"; 
import ModalNotificaciones from "@/components/notificaciones/ModalNotificaciones"; 
import Modal from "@/components/users/Modal";

const permisosPorRol = {
  admin: {
    dashboard: true,
    usuarios: true,
    tiposEventos: true,
    inventario: true,
    ganado: true,
    sanidad: true,
    produccion: true,
    reproduccion: true,
    notificaciones: true
  },
  veterinario: {
    dashboard: true,
    usuarios: false,
    tiposEventos: true,
    inventario: false,
    ganado: true,
    sanidad: true,
    produccion: false,
    reproduccion: true,
    notificaciones: true
  },
  operario: {
    dashboard: true,
    usuarios: false,
    tiposEventos: true,
    inventario: false,
    ganado: true,
    sanidad: true,
    produccion: true,
    reproduccion: true,
    notificaciones: true
  },
  contable: {
    dashboard: true,
    usuarios: false,
    tiposEventos: false,
    inventario: true,
    ganado: true,
    sanidad: false,
    produccion: false,
    reproduccion: false,
    notificaciones: true
  },
  ordeño: {
    dashboard: true,
    usuarios: false,
    tiposEventos: false,
    inventario: false,
    ganado: true,
    sanidad: false,
    produccion: true,
    reproduccion: false,
    notificaciones: false
  }
};

const navItemsBase = [
  { title: "Dashboard", href: "/dashboard", icon: Home, permiso: "dashboard" },
  { title: "Usuarios", href: "/users", icon: Users, permiso: "usuarios" },
  { title: "Tipos de eventos", href: "/types", icon: Calendar, permiso: "tiposEventos" }
];

const inventarioBase = [
  { title: "Insumos", href: "/gestion-insumos", icon: Package, permiso: "inventario" },
  { title: "Compras", href: "/gestion-compras", icon: ShoppingCart, permiso: "inventario" },
  { title: "Proveedores", href: "/proveedores", icon: Users, permiso: "inventario" },
];

const ganadoBase = [
  { title: "Animales", href: "/animales", icon: FaCow, permiso: "ganado" },
  { title: "Razas", href: "/razas", icon: Tag, permiso: "ganado" },
  { title: "Gestión de Áreas", href: "/gestion-areas", icon: MapPin, permiso: "ganado" },
  { title: "Alimentación", href: "/alimentaciones", icon: Utensils, permiso: "ganado" },
  { title: "Pesajes", href: "/pesajes", icon: Scale, permiso: "ganado" },
];

const sanidadBase = [
  { title: "Eventos Sanitarios", href: "/evento", icon: Stethoscope, permiso: "sanidad" },
];

const produccionBase = [
  { title: "Producción Lechera", href: "/produccionLechera", icon: Milk, permiso: "produccion" },
  { title: "Producción Cárnica", href: "/produccionCarne", icon: FaCow, permiso: "produccion" },
];

const reproduccionBase = [
  { title: "Montas", href: "/montas", icon: FaClipboardCheck, permiso: "reproduccion" },
  { title: "Diagnóstico de Preñez", href: "/diagnosticos", icon: Stethoscope, permiso: "reproduccion" },
  { title: "Partos", href: "/partos", icon: FaCow, permiso: "reproduccion" },
];

export function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, checkAuth } = useAuthStore();
  const { notificacionesNoLeidas } = useNotificacionStore(); 
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [modalNotificacionesAbierto, setModalNotificacionesAbierto] = useState(false);
  const sidebarContentRef = useRef(null);

  const [expandedSections, setExpandedSections] = useState({
    inventario: true,
    ganado: true,
    sanidad: true,
    produccion: true,
    reproduccion: true
  });

  const tienePermiso = (permiso) => {
    if (!user?.rol) return false;
    return permisosPorRol[user.rol]?.[permiso] || false;
  };

  const getNavItemsFiltrados = () => {
    return navItemsBase.filter(item => tienePermiso(item.permiso));
  };

  const getInventarioFiltrado = () => {
    if (user?.rol === 'contable') {
      return inventarioBase;
    }
    return user?.rol === 'admin' ? inventarioBase : [];
  };

  const getGanadoFiltrado = () => {
    const rol = user?.rol;
    
    switch(rol) {
      case 'admin':
        return ganadoBase;
      case 'veterinario':
        return ganadoBase.filter(item => item.href !== "/gestion-areas");
      case 'operario':
        return ganadoBase;
      case 'contable':
        return ganadoBase.filter(item => item.href === "/animales");
      case 'ordeño':
        return ganadoBase.filter(item => item.href === "/animales");
      default:
        return [];
    }
  };

  const getSanidadFiltrado = () => {
    return ['admin', 'veterinario', 'operario'].includes(user?.rol) ? sanidadBase : [];
  };

  const getProduccionFiltrado = () => {
    const rol = user?.rol;
    
    switch(rol) {
      case 'admin':
        return produccionBase;
      case 'operario':
        return produccionBase.filter(item => item.href === "/produccionCarne");
      case 'ordeño':
        return produccionBase.filter(item => item.href === "/produccionLechera");
      default:
        return [];
    }
  };

  const getReproduccionFiltrado = () => {
    return ['admin', 'veterinario', 'operario'].includes(user?.rol) ? reproduccionBase : [];
  };

  const navItems = getNavItemsFiltrados();
  const inventario = getInventarioFiltrado();
  const ganado = getGanadoFiltrado();
  const sanidad = getSanidadFiltrado();
  const produccion = getProduccionFiltrado();
  const reproduccion = getReproduccionFiltrado();

  const mostrarSeccion = (seccion) => seccion.length > 0;

  useEffect(() => {
    const sidebarContent = sidebarContentRef.current;
    if (!sidebarContent) return;

    const handleScroll = () => {
      if (sidebarContent.scrollTop > 0) {
        sidebarContent.classList.add('scrolling');
      } else {
        sidebarContent.classList.remove('scrolling');
      }
    };

    sidebarContent.addEventListener('scroll', handleScroll);
    
    return () => {
      sidebarContent.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarExpandedState');
    if (savedState) {
      setExpandedSections(JSON.parse(savedState));
    }
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      const newState = {
        ...prev,
        [section]: !prev[section]
      };
      localStorage.setItem('sidebarExpandedState', JSON.stringify(newState));
      return newState;
    });
  };

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
    const allItems = [
      ...navItems,
      ...inventario,
      ...ganado,
      ...sanidad,
      ...produccion,
      ...reproduccion
    ];
    
    const currentItem = allItems.find((item) => item.href === location.pathname);
    
    if (currentItem) {
      return currentItem.title;
    }
    
    const defaultTitles = {
      '/': 'Inicio',
      '/login': 'Iniciar Sesión'
    };
    
    return defaultTitles[location.pathname] || 'cambiar contrión';
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
                <Badge variant="secondary" className="mt-1 text-xs bg-white/20 text-white border-white/30">
                  {user.rol?.charAt(0).toUpperCase() + user.rol?.slice(1)}
                </Badge>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent 
            ref={sidebarContentRef}
            className="flex-1 overflow-auto custom-scrollbar"
          >
            {mostrarSeccion(navItems) && (
              <div className="p-3">
                <div className="px-2 py-2 text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Navegación Principal
                </div>
                <SidebarMenu>
                  {navItems.map((item) => {
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
            )}

            {mostrarSeccion(inventario) && (
              <div className="p-3">
                <Collapsible 
                  open={expandedSections.inventario} 
                  onOpenChange={() => toggleSection('inventario')}
                  className="group/collapsible"
                >
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
            )}

            {mostrarSeccion(ganado) && (
              <div className="p-3">
                <Collapsible 
                  open={expandedSections.ganado} 
                  onOpenChange={() => toggleSection('ganado')}
                  className="group/collapsible"
                >
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
            )}

            {mostrarSeccion(sanidad) && (
              <div className="p-3">
                <Collapsible 
                  open={expandedSections.sanidad} 
                  onOpenChange={() => toggleSection('sanidad')}
                  className="group/collapsible"
                >
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
            )}

            {mostrarSeccion(produccion) && (
              <div className="p-3">
                <Collapsible 
                  open={expandedSections.produccion} 
                  onOpenChange={() => toggleSection('produccion')}
                  className="group/collapsible"
                >
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
            )}

            {mostrarSeccion(reproduccion) && (
              <div className="p-3">
                <Collapsible 
                  open={expandedSections.reproduccion} 
                  onOpenChange={() => toggleSection('reproduccion')}
                  className="group/collapsible"
                >
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
            )}
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
                      <span className="text-xs text-blue-600 font-medium">
                        {user.rol?.charAt(0).toUpperCase() + user.rol?.slice(1)}
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
                  <div className="text-xs text-blue-600 font-medium mt-1">
                    {user.rol?.charAt(0).toUpperCase() + user.rol?.slice(1)}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Modal 
                    usuario={user}
                    onSuccess={(message) => {
                    }}
                  />
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
            
            {['admin', 'veterinario', 'operario', 'contable'].includes(user?.rol) && (
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
            )}
          </header>
          
          <div className="flex-1 p-6 bg-slate-50">{children}</div>
        </main>

        {['admin', 'veterinario', 'operario', 'contable'].includes(user?.rol) && (
          <ModalNotificaciones 
            open={modalNotificacionesAbierto} 
            onOpenChange={setModalNotificacionesAbierto} 
          />
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          display: none;
        }
        
        .custom-scrollbar.scrolling::-webkit-scrollbar {
          display: block;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </SidebarProvider>
  );
}
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEventoSanitarioStore } from '@/store/eventoSanitarioStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Shield, MoreHorizontal, Search, CheckCircle,
  XCircle, Calendar as CalendarIcon
 } from 'lucide-react';
import EventoSanitarioForm from '@/components/eventosSanitario/EventoSanitarioForm';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const EventosSanitariosPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { eventosSanitarios, fetchEventosSanitarios, deleteEventoSanitario, loading } = useEventoSanitarioStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [showForm, setShowForm] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const { toast } = useToast();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const isAuthenticated = await checkAuth();
        if (isAuthenticated) {
          setAuthStatus('authenticated');
        } else {
          setAuthStatus('unauthenticated');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        setAuthStatus('unauthenticated');
        navigate('/login', { replace: true });
      }
    };

    verifyAuth();
  }, [checkAuth, navigate]);

  useEffect(() => {
    if (authStatus === 'authenticated' && 
        (user?.rol === 'admin' || user?.rol === 'veterinario' || user?.rol === 'operario')) {
      fetchEventosSanitarios();
    }
  }, [authStatus, user, fetchEventosSanitarios]);

  const handleCreate = useCallback(() => {
    setEditingEvento(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((eventoData) => {
    setEditingEvento(eventoData);
    setShowForm(true);
  }, []);

  const handleDeleteClick = useCallback((eventoItem) => {
    setItemToDelete(eventoItem);
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      const result = await deleteEventoSanitario(itemToDelete.evento_sanitario_id);
      
      if (result.success) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Eliminado correctamente</span>
            </div>
          ),
          description: "El evento sanitario se eliminó exitosamente.",
          duration: 3000,
        });
      } else {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Error al eliminar</span>
            </div>
          ),
          description: result.error || "Error desconocido al eliminar el evento sanitario.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span>Error de conexión</span>
          </div>
        ),
        description: "Por favor, intente nuevamente.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setDeleteLoading(false);
      setShowConfirm(false);
      setItemToDelete(null);
    }
  };

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditingEvento(null);
    fetchEventosSanitarios();

    toast({
      title: editingEvento ?
        (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Actualizado correctamente</span>
          </div>
        )
        : 
        (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Creado correctamente</span>
          </div>
        ),
      description: editingEvento 
        ? "El evento sanitario se actualizó exitosamente." 
        : "El evento sanitario se creó exitosamente.",
      duration: 3000,
    });
  }, [fetchEventosSanitarios,editingEvento, toast]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingEvento(null);
  }, []);

  const convertirAFechaLocal = (fecha) => {
    try {
      if (!fecha) return null;
      
      let date;
      
      if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = fecha.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(fecha);
      }
      
      if (isNaN(date.getTime())) return null;
      
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      return null;
    }
  };

  const filteredEventos = eventosSanitarios.filter(eventoItem => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const coincide = (
        eventoItem.animal?.arete?.toLowerCase().includes(searchLower) ||
        eventoItem.tipo_evento?.nombre?.toLowerCase().includes(searchLower) ||
        eventoItem.estado?.toLowerCase().includes(searchLower) ||
        eventoItem.diagnostico?.toLowerCase().includes(searchLower) ||
        eventoItem.tratamiento?.toLowerCase().includes(searchLower)
      );
      if (!coincide) return false;
    }
   
    if (fechaFiltro) {
      const fechaEvento = convertirAFechaLocal(eventoItem.fecha);
      const fechaFiltroComparable = convertirAFechaLocal(fechaFiltro);
      
      if (!fechaEvento || !fechaFiltroComparable) {
        return false;
      }
      
      if (fechaEvento !== fechaFiltroComparable) {
        return false;
      }
    }
    
    return true;
  });

  const getEstadoBadge = (estado) => {
    if (!estado) return null;
    
    const estadoLower = estado.toLowerCase();
    
    if (estadoLower === 'completado') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Completado</Badge>;
    } else if (estadoLower === 'pendiente') {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Pendiente</Badge>;
    } else {
      return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const getItemName = () => {
    if (!itemToDelete) return '';
    return `Evento Sanitario ${itemToDelete.numero_evento}`;
  };

  const canManage = user?.rol === 'admin' || user?.rol === 'veterinario' || user?.rol === 'operario';
  const canDelete = user?.rol === 'admin' || user?.rol === 'veterinario'|| user?.rol === 'operario';

  const formatDateWithoutTZ = (dateString) => {
    try {
        if (!dateString) return 'Fecha inválida';
        
        const fechaLocal = convertirAFechaLocal(dateString);
        if (!fechaLocal) return 'Fecha inválida';
        
        const [year, month, day] = fechaLocal.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        return format(date, "dd/MM/yyyy", { locale: es });
    } catch (error) {
        return 'Fecha inválida';
    }
  };

  if (!canManage) {
    return (
      <MainLayout>
        <div className="container mx-auto p-4 sm:p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold">Acceso Restringido</h3>
                <p className="text-gray-500 mt-2">
                  No tienes permisos para acceder a la gestión de eventos sanitarios.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Eventos Sanitarios</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra los eventos sanitarios de los animales</p>
          </div>
          <Button 
            onClick={handleCreate} 
            className="flex items-center gap-2 w-full sm:w-auto"
            type="button"
            variant="sanidad"
          >
            <Plus className="h-4 w-4" />
            Nuevo Evento
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar eventos por arete, tipo de evento, estado, diagnóstico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal",
                    !fechaFiltro && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaFiltro ? (
                    format(fechaFiltro, "dd/MM/yyyy", { locale: es })
                  ) : (
                    <span>Filtrar por fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fechaFiltro}
                  onSelect={setFechaFiltro}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Eventos Sanitarios</CardTitle>
            <CardDescription>
              {filteredEventos.length} de {eventosSanitarios.length} evento(s) encontrado(s)
              {fechaFiltro && (
                <span> - Filtrado por: {format(fechaFiltro, "dd/MM/yyyy", { locale: es })}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium">Número</th>
                      <th className="text-left py-3 font-medium">Animal</th>
                      <th className="text-left py-3 font-medium">Tipo Evento</th>
                      <th className="text-left py-3 font-medium">Estado</th>
                      <th className="text-left py-3 font-medium">Fecha</th>
                      <th className="text-left py-3 font-medium">Diagnóstico</th>
                      <th className="text-left py-3 font-medium">Tratamiento</th>
                      <th className="text-left py-3 font-medium">Insumos</th>
                      <th className="text-left py-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEventos.map((eventoItem) => (                        
                      <tr key={eventoItem.evento_sanitario_id} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono">
                              {eventoItem.numero_evento || `EVT-${eventoItem.evento_sanitario_id.toString().padStart(4, '0')}`}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary"  className="font-mono">
                              {eventoItem.animal?.arete}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3">
                          {eventoItem.tipo_evento?.nombre || 'N/A'}
                        </td>
                        <td className="py-3">
                          {getEstadoBadge(eventoItem.estado)}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span>
                              {formatDateWithoutTZ(eventoItem.fecha)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 max-w-[150px] truncate ">
                            {eventoItem.diagnostico}
                          
                        </td>
                        <td className="py-3 max-w-[150px] truncate">
                         {eventoItem.tratamiento}
                        
                        </td>
                        <td className="py-3">
                          <div className="text-sm text-gray-600">
                            {eventoItem.evento_insumo?.length > 0 
                              ? `${eventoItem.evento_insumo.length} insumo(s)` 
                              : 'Sin insumos'
                            }
                          </div>
                        </td>
                        <td className="py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                type="button"
                              >
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(eventoItem)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar evento
                              </DropdownMenuItem>
                              {canDelete && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(eventoItem)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar evento
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden space-y-4">
                {filteredEventos.map((eventoItem) => (
                  <Card key={eventoItem.evento_sanitario_id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="font-mono">
                              {eventoItem.animal?.arete}
                            </Badge>
                            {getEstadoBadge(eventoItem.estado)}
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">{eventoItem.tipo_evento?.nombre || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-600">
                                {formatDateWithoutTZ(eventoItem.fecha)}
                              </span>
                            </div>
                            {eventoItem.diagnostico && (
                              <div className="text-sm text-gray-600">
                                <strong>Diagnóstico:</strong> 
                                <div className="truncate" title={eventoItem.diagnostico}>
                                  {eventoItem.diagnostico}
                                </div>
                              </div>
                            )}
                            {eventoItem.tratamiento && (
                              <div className="text-sm text-gray-600">
                                <strong>Tratamiento:</strong>
                                <div className="truncate" title={eventoItem.tratamiento}>
                                  {eventoItem.tratamiento}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {eventoItem.evento_insumo?.length > 0 
                              ? `${eventoItem.evento_insumo.length} insumo(s) utilizados` 
                              : 'Sin insumos'
                            }
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              type="button"
                            >
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(eventoItem)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar evento
                            </DropdownMenuItem>
                            {canDelete && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(eventoItem)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar evento
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {filteredEventos.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || fechaFiltro ? 'No se encontraron eventos que coincidan con los filtros' : 'No hay eventos sanitarios registrados'}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingEvento ? 'Editar Evento Sanitario' : 'Nuevo Evento Sanitario'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {editingEvento 
                  ? 'Actualiza la información del evento sanitario' 
                  : 'Complete la información para registrar un nuevo evento sanitario'
                }
              </DialogDescription>
            </DialogHeader>
            <EventoSanitarioForm
              eventoSanitario={editingEvento}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        <Modal
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Eliminar Evento Sanitario"
          description={`¿Está seguro de eliminar el ${getItemName()}? Esta acción no se puede deshacer y se restaurará el stock de insumos utilizados.`}
          variant="destructive"
          confirmText="Eliminar"
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
        />

        <Toaster />
      </div>
    </MainLayout>
  );
};

export default EventosSanitariosPage;
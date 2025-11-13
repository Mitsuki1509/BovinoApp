import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAlimentacionStore } from '@/store/alimentacionStore';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Edit, Trash2, Shield, MoreHorizontal, Search, Loader2, CheckCircle,
  XCircle, Calendar as CalendarIcon, Utensils
 } from 'lucide-react';
import AlimentacionForm from '@/components/alimentaciones/AlimentacionForm';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const AlimentacionesPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { alimentaciones, fetchAlimentaciones, deleteAlimentacion, loading } = useAlimentacionStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [showForm, setShowForm] = useState(false);
  const [editingAlimentacion, setEditingAlimentacion] = useState(null);
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
      fetchAlimentaciones();
    }
  }, [authStatus, user, fetchAlimentaciones]);

  const handleCreate = useCallback(() => {
    setEditingAlimentacion(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((alimentacionData) => {
    setEditingAlimentacion(alimentacionData);
    setShowForm(true);
  }, []);

  const handleDeleteClick = useCallback((alimentacionItem) => {
    setItemToDelete(alimentacionItem);
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      const result = await deleteAlimentacion(itemToDelete.alimentacion_id);
      
      if (result.success) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Eliminado correctamente</span>
            </div>
          ),
          description: "La alimentación se eliminó exitosamente.",
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
          description: result.error || "Error desconocido al eliminar la alimentación.",
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
    setEditingAlimentacion(null);
    fetchAlimentaciones();

    toast({
      title: editingAlimentacion ?
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
            <span>Registrado correctamente</span>
          </div>
        ),
      description: editingAlimentacion 
        ? "La alimentación se actualizó exitosamente." 
        : "La alimentación se registró exitosamente.",
      duration: 3000,
    });
  }, [fetchAlimentaciones, editingAlimentacion, toast]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingAlimentacion(null);
  }, []);

  const filteredAlimentaciones = alimentaciones.filter(alimentacionItem => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const coincide = (
        alimentacionItem.animal?.arete?.toLowerCase().includes(searchLower) ||
        alimentacionItem.insumo?.nombre?.toLowerCase().includes(searchLower) ||
        alimentacionItem.insumo?.descripcion?.toLowerCase().includes(searchLower)
      );
      if (!coincide) return false;
    }

    if (fechaFiltro) {
      const fechaAlimentacion = new Date(alimentacionItem.fecha);
      const fechaFiltroDate = new Date(fechaFiltro);
      
      if (fechaAlimentacion.toDateString() !== fechaFiltroDate.toDateString()) {
        return false;
      }
    }
    
    return true;
  });

  const getItemName = () => {
    if (!itemToDelete) return '';
    return `Alimentación #${itemToDelete.alimentacion_id}`;
  };

  const canManage = user?.rol === 'admin' || user?.rol === 'veterinario' || user?.rol === 'operario';
  const canDelete = user?.rol === 'admin' || user?.rol === 'veterinario';

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
                  No tienes permisos para acceder a la gestión de alimentaciones.
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
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Alimentaciones</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra las alimentaciones de los animales</p>
          </div>
          <Button 
            onClick={handleCreate} 
            className="flex items-center gap-2 w-full sm:w-auto"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Nueva Alimentación
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar alimentaciones por arete, nombre de insumo..."
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
            <CardTitle>Lista de Alimentaciones</CardTitle>
            <CardDescription>
              {filteredAlimentaciones.length} de {alimentaciones.length} alimentación(es) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="hidden sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium">Animal</th>
                        <th className="text-left py-3 font-medium">Insumo</th>
                        <th className="text-left py-3 font-medium">Cantidad</th>
                        <th className="text-left py-3 font-medium">Fecha</th>
                        <th className="text-left py-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAlimentaciones.map((alimentacionItem) => (                        
                        <tr key={alimentacionItem.alimentacion_id} className="border-b hover:bg-gray-50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono">
                                {alimentacionItem.animal?.arete}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{alimentacionItem.insumo?.nombre}</span>
                              {alimentacionItem.insumo?.descripcion && (
                                <span className="text-sm text-gray-600">
                                  {alimentacionItem.insumo.descripcion}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge variant="outline">
                              {alimentacionItem.cantidad} {alimentacionItem.insumo?.unidad?.nombre || ''}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span>
                                {format(new Date(alimentacionItem.fecha), "dd/MM/yyyy", { locale: es })}
                              </span>
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
                                
                                {canDelete && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(alimentacionItem)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar alimentación
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
                  {filteredAlimentaciones.map((alimentacionItem) => (
                    <Card key={alimentacionItem.alimentacion_id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="font-mono">
                                {alimentacionItem.animal?.arete}
                              </Badge>
                              <Badge variant="outline">
                                {alimentacionItem.cantidad} {alimentacionItem.insumo?.unidad?.nombre || ''}
                              </Badge>
                            </div>
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{alimentacionItem.insumo?.nombre}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">
                                  {format(new Date(alimentacionItem.fecha), "dd/MM/yyyy", { locale: es })}
                                </span>
                              </div>
                              {alimentacionItem.insumo?.descripcion && (
                                <div className="text-sm text-gray-600">
                                  {alimentacionItem.insumo.descripcion}
                                </div>
                              )}
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
                              <DropdownMenuItem onClick={() => handleEdit(alimentacionItem)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar alimentación
                              </DropdownMenuItem>
                              {canDelete && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(alimentacionItem)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar alimentación
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
            )}

            {filteredAlimentaciones.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || fechaFiltro ? 'No se encontraron alimentaciones que coincidan con los filtros' : 'No hay alimentaciones registradas'}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingAlimentacion ? 'Editar Alimentación' : 'Nueva Alimentación'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {editingAlimentacion 
                  ? 'Actualiza la información de la alimentación' 
                  : 'Complete la información para registrar una nueva alimentación'
                }
              </DialogDescription>
            </DialogHeader>
            <AlimentacionForm
              alimentacion={editingAlimentacion}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        <Modal
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Eliminar Alimentación"
          description={`¿Está seguro de eliminar la ${getItemName()}? Esta acción no se puede deshacer y se restaurará el stock del insumo.`}
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

export default AlimentacionesPage;
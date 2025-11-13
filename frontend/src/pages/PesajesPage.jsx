import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePesajeStore } from '@/store/pesajeStore';
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
  XCircle, Calendar as CalendarIcon, Scale, TrendingUp
 } from 'lucide-react';
import PesajeForm from '@/components/pesajes/PesajeForm';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const PesajesPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { pesajes, fetchPesajes, deletePesaje, loading} = usePesajeStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [showForm, setShowForm] = useState(false);
  const [editingPesaje, setEditingPesaje] = useState(null);
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
      fetchPesajes();
    }
  }, [authStatus, user, fetchPesajes]);

  const handleCreate = useCallback(() => {
    setEditingPesaje(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((pesajeData) => {
    setEditingPesaje(pesajeData);
    setShowForm(true);
  }, []);

  const handleDeleteClick = useCallback((pesajeItem) => {
    setItemToDelete(pesajeItem);
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      const result = await deletePesaje(itemToDelete.pesaje_id);
      
      if (result.success) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Eliminado correctamente</span>
            </div>
          ),
          description: "El pesaje se eliminó exitosamente.",
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
          description: result.error || "Error desconocido al eliminar el pesaje.",
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
    setEditingPesaje(null);
    fetchPesajes();

    toast({
      title: editingPesaje ?
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
      description: editingPesaje 
        ? "El pesaje se actualizó exitosamente." 
        : "El pesaje se registró exitosamente.",
      duration: 3000,
    });
  }, [fetchPesajes, editingPesaje, toast]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingPesaje(null);
  }, []);

  const filteredPesajes = pesajes.filter(pesajeItem => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const coincide = (
        pesajeItem.animal?.arete?.toLowerCase().includes(searchLower) ||
        pesajeItem.animal?.nombre?.toLowerCase().includes(searchLower) ||
        pesajeItem.unidad?.nombre?.toLowerCase().includes(searchLower) ||
        pesajeItem.peso?.toString().includes(searchTerm)
      );
      if (!coincide) return false;
    }

    if (fechaFiltro) {
      const fechaPesaje = new Date(pesajeItem.fecha);
      const fechaFiltroDate = new Date(fechaFiltro);
      
      if (fechaPesaje.toDateString() !== fechaFiltroDate.toDateString()) {
        return false;
      }
    }
    
    return true;
  });

  const getItemName = () => {
    if (!itemToDelete) return '';
    return `Pesaje #${itemToDelete.pesaje_id}`;
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
                  No tienes permisos para acceder a la gestión de pesajes.
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
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Pesajes</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra los pesajes de los animales</p>
          </div>
          <Button 
            onClick={handleCreate} 
            className="flex items-center gap-2 w-full sm:w-auto"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Nuevo Pesaje
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar pesajes por arete, nombre de animal, unidad o peso..."
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
            <CardTitle>Lista de Pesajes</CardTitle>
            <CardDescription>
              {filteredPesajes.length} de {pesajes.length} pesaje(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(
              <div className="overflow-x-auto">
                <div className="hidden sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium">Animal</th>
                        <th className="text-left py-3 font-medium">Peso</th>
                        <th className="text-left py-3 font-medium">Fecha</th>
                        <th className="text-left py-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPesajes.map((pesajeItem) => (                        
                        <tr key={pesajeItem.pesaje_id} className="border-b hover:bg-gray-50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {pesajeItem.animal?.arete}
                              </Badge>
                              {pesajeItem.animal?.arete && (
                                <span className="text-sm text-gray-600">
                                  {pesajeItem.animal.nombre}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                              {parseFloat(pesajeItem.peso).toFixed(2) }                              {pesajeItem.unidad?.abreviatura || pesajeItem.unidad?.nombre}

                            
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span>
                                {format(new Date(pesajeItem.fecha), "dd/MM/yyyy", { locale: es })}
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
                                <DropdownMenuItem onClick={() => handleEdit(pesajeItem)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar pesaje
                                </DropdownMenuItem>
                                {canDelete && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(pesajeItem)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar pesaje
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
                  {filteredPesajes.map((pesajeItem) => (
                    <Card key={pesajeItem.pesaje_id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">
                                {pesajeItem.animal?.arete}
                              </Badge>
                              <Badge variant="outline">
                                {parseFloat(pesajeItem.peso).toFixed(2)} {pesajeItem.unidad?.abreviatura || pesajeItem.unidad?.nombre}
                              </Badge>
                            </div>
                            <div className="mt-3 space-y-2">
                              
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">
                                  {format(new Date(pesajeItem.fecha), "dd/MM/yyyy", { locale: es })}
                                </span>
                              </div>
                             
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
                              <DropdownMenuItem onClick={() => handleEdit(pesajeItem)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar pesaje
                              </DropdownMenuItem>
                              {canDelete && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(pesajeItem)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar pesaje
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

            {filteredPesajes.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || fechaFiltro ? 'No se encontraron pesajes que coincidan con los filtros' : 'No hay pesajes registrados'}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingPesaje ? 'Editar Pesaje' : 'Nuevo Pesaje'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {editingPesaje 
                  ? 'Actualiza la información del pesaje' 
                  : 'Complete la información para registrar un nuevo pesaje'
                }
              </DialogDescription>
            </DialogHeader>
            <PesajeForm
              pesaje={editingPesaje}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        <Modal
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Eliminar Pesaje"
          description={`¿Está seguro de eliminar el ${getItemName()}? Esta acción no se puede deshacer.`}
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

export default PesajesPage;
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProduccionLecheraStore } from '@/store/produccionLecheraStore';
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
  XCircle, Calendar as CalendarIcon, Milk, TrendingUp, Hash
 } from 'lucide-react';
import ProduccionLecheraForm from '@/components/produccionLechera/ProduccionLecheraForm';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const ProduccionLecheraPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { producciones, fetchProducciones, deleteProduccion, loading } = useProduccionLecheraStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [showForm, setShowForm] = useState(false);
  const [editingProduccion, setEditingProduccion] = useState(null);
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
        (user?.rol === 'admin' || user?.rol === 'ordeño')) {
      fetchProducciones();
    }
  }, [authStatus, user, fetchProducciones]);

  const handleCreate = useCallback(() => {
    setEditingProduccion(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((produccionData) => {
    setEditingProduccion(produccionData);
    setShowForm(true);
  }, []);

  const handleDeleteClick = useCallback((produccionItem) => {
    setItemToDelete(produccionItem);
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      const result = await deleteProduccion(itemToDelete.produccion_id);
      
      if (result.success) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Eliminado correctamente</span>
            </div>
          ),
          description: "La producción lechera se eliminó exitosamente.",
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
          description: result.error || "Error desconocido al eliminar la producción lechera.",
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
    setEditingProduccion(null);
    fetchProducciones();

    toast({
      title: editingProduccion ?
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
      description: editingProduccion 
        ? "La producción lechera se actualizó exitosamente." 
        : "La producción lechera se registró exitosamente.",
      duration: 3000,
    });
  }, [fetchProducciones, editingProduccion, toast]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingProduccion(null);
  }, []);

  // Función para convertir cualquier fecha a formato YYYY-MM-DD sin zona horaria
  const convertirAFechaLocal = (fecha) => {
    try {
      if (!fecha) return null;
      
      let date;
      
      // Si es string YYYY-MM-DD, convertir directamente
      if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = fecha.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        // Para otros formatos, crear fecha
        date = new Date(fecha);
      }
      
      if (isNaN(date.getTime())) return null;
      
      // Usar UTC para evitar problemas de zona horaria
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      return null;
    }
  };

  const filteredProducciones = producciones.filter(produccionItem => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const coincide = (
        produccionItem.numero_produccion?.toLowerCase().includes(searchLower) ||
        produccionItem.animal?.arete?.toLowerCase().includes(searchLower) ||
        produccionItem.animal?.nombre?.toLowerCase().includes(searchLower) ||
        produccionItem.unidad?.nombre?.toLowerCase().includes(searchLower) ||
        produccionItem.cantidad?.toString().includes(searchTerm) ||
        produccionItem.descripcion?.toLowerCase().includes(searchLower)
      );
      if (!coincide) return false;
    }

    if (fechaFiltro) {
      const fechaProduccion = convertirAFechaLocal(produccionItem.fecha);
      const fechaFiltroComparable = convertirAFechaLocal(fechaFiltro);
      
      if (!fechaProduccion || !fechaFiltroComparable) {
        return false;
      }
      
      if (fechaProduccion !== fechaFiltroComparable) {
        return false;
      }
    }
    
    return true;
  });

  // Función para formatear fechas sin problemas de zona horaria
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

  const getItemName = () => {
    if (!itemToDelete) return '';
    return `Producción ${itemToDelete.numero_produccion || `#${itemToDelete.produccion_id}`}`;
  };

  const canDelete = user?.rol === 'admin' || user?.rol === 'ordeño';


  return (
    <MainLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Producción Lechera</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra las producciones lecheras de los animales</p>
          </div>
          <Button 
            onClick={handleCreate} 
            className="flex items-center gap-2 w-full sm:w-auto"
            type="button"
            variant="produccion"
          >
            <Plus className="h-4 w-4" />
            Nueva Producción
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar producciones por número, arete, nombre, unidad, cantidad o descripción..."
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
            <CardTitle>Lista de Producciones Lecheras</CardTitle>
            <CardDescription>
              {filteredProducciones.length} de {producciones.length} producción(es) encontrada(s)
              {fechaFiltro && (
                <span> - Filtrado por: {format(fechaFiltro, "dd/MM/yyyy", { locale: es })}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(
              <div className="overflow-x-auto">
                <div className="hidden sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium">Número</th>
                        <th className="text-left py-3 font-medium">Animal</th>
                        <th className="text-left py-3 font-medium">Cantidad</th>
                        <th className="text-left py-3 font-medium">Fecha</th>
                        <th className="text-left py-3 font-medium">Descripción</th>
                        <th className="text-left py-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducciones.map((produccionItem) => (                        
                        <tr key={produccionItem.produccion_id} className="border-b hover:bg-gray-50">
                          <td className='py-3'>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono">
                                {produccionItem.numero_produccion || `LEC-${produccionItem.produccion_id.toString().padStart(4, '0')}`}
                              </Badge>                   
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono">
                                {produccionItem.animal?.arete}
                              </Badge>
                              {produccionItem.animal?.nombre && (
                                <span className="text-sm text-gray-600">
                                  {produccionItem.animal.nombre}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                            <Badge variant="outline" >
                             {parseInt(produccionItem.cantidad).toLocaleString()} {produccionItem.unidad?.nombre}
                            </Badge>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span>
                                {formatDateWithoutTZ(produccionItem.fecha)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="text-sm text-gray-600 max-w-[200px] truncate block">
                              {produccionItem.descripcion || '-'}
                            </span>
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
                                <DropdownMenuItem onClick={() => handleEdit(produccionItem)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar producción
                                </DropdownMenuItem>
                                {canDelete && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(produccionItem)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar producción
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
                  {filteredProducciones.map((produccionItem) => (
                    <Card key={produccionItem.produccion_id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="font-mono">
                                {produccionItem.numero_produccion || `LEC-${produccionItem.produccion_id.toString().padStart(4, '0')}`}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="font-mono">
                                {produccionItem.animal?.arete}
                              </Badge>
                              <div className="flex items-center gap-1">
                                  <Badge variant="outline">
                                    {parseInt(produccionItem.cantidad).toLocaleString()} {produccionItem.unidad?.nombre}
                                  </Badge>
                              </div>
                            </div>
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">
                                  {formatDateWithoutTZ(produccionItem.fecha)}
                                </span>
                              </div>
                              {produccionItem.descripcion && (
                                <div className="text-sm text-gray-600">
                                  {produccionItem.descripcion}
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
                              <DropdownMenuItem onClick={() => handleEdit(produccionItem)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar producción
                              </DropdownMenuItem>
                              {canDelete && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(produccionItem)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar producción
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

            {filteredProducciones.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || fechaFiltro ? 'No se encontraron producciones que coincidan con los filtros' : 'No hay producciones lecheras registradas'}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingProduccion ? 'Editar Producción Lechera' : 'Nueva Producción Lechera'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {editingProduccion 
                  ? 'Actualiza la información de la producción lechera' 
                  : 'Complete la información para registrar una nueva producción lechera'
                }
              </DialogDescription>
            </DialogHeader>
            <ProduccionLecheraForm
              produccion={editingProduccion}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        <Modal
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Eliminar Producción Lechera"
          description={`¿Está seguro de eliminar la ${getItemName()}? Esta acción no se puede deshacer.`}
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

export default ProduccionLecheraPage;
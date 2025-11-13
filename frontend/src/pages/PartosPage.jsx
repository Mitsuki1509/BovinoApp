import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePartoStore } from '../store/partoStore';
import { useDiagnosticoStore } from '../store/diagnosticoStore';
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
  XCircle, Calendar as CalendarIcon, Baby, X
 } from 'lucide-react';
import PartoForm from '@/components/partos/PartoForm';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const PartosPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { partos, fetchPartos, deleteParto, loading } = usePartoStore();
  const { fetchDiagnosticos } = useDiagnosticoStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [showForm, setShowForm] = useState(false);
  const [editingParto, setEditingParto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasFetchedData, setHasFetchedData] = useState(false);
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
        (user?.rol === 'admin' || user?.rol === 'veterinario') && 
        !hasFetchedData) {
      console.log('Cargando datos...');
      fetchPartos();
      fetchDiagnosticos(); 
      setHasFetchedData(true);
    }
  }, [authStatus, user, fetchPartos, fetchDiagnosticos, hasFetchedData]);

  const handleCreate = useCallback(() => {
    setEditingParto(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((partoData) => {
    setEditingParto(partoData);
    setShowForm(true);
  }, []);

  const handleDeleteClick = useCallback((partoItem) => {
    setItemToDelete(partoItem);
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      const result = await deleteParto(itemToDelete.evento_id);
      
      if (result.success) {
        await fetchPartos();
        
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Eliminado correctamente</span>
            </div>
          ),
          description: "El parto se eliminó exitosamente.",
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
          description: result.error || "Error desconocido al eliminar el parto.",
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

  const handleFormSuccess = useCallback(async () => {
    setShowForm(false);
    setEditingParto(null);
    
    try {
      await fetchPartos();
      
      toast({
        title: editingParto ?
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
        description: editingParto 
          ? "El parto se actualizó exitosamente." 
          : "El parto se registró exitosamente.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error al recargar datos:', error);
    }
  }, [fetchPartos, editingParto, toast]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingParto(null);
  }, []);

  const formatearNumeroMonta = (numeroMonta) => {
    if (!numeroMonta) return 'N/A';
    
    if (typeof numeroMonta === 'number') {
      return `MONTA-${numeroMonta.toString()}`;
    }
    
    return numeroMonta;
  };

  const obtenerDatosMonta = (partoItem) => {
    const prenez = partoItem.prenez;
    if (!prenez) return { numeroMonta: 'N/A', areteHembra: 'N/A' };
    
    const monta = prenez.monta;
    if (!monta) return { numeroMonta: 'N/A', areteHembra: 'N/A' };
    
    return {
      numeroMonta: monta.numero_monta,
      areteHembra: monta.hembra?.arete || 'N/A'
    };
  };

  const filteredPartos = partos.filter(partoItem => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const { numeroMonta, areteHembra } = obtenerDatosMonta(partoItem);
      const numeroMontaFormateado = formatearNumeroMonta(numeroMonta);
      
      const coincideBusqueda = (
        partoItem.descripcion?.toLowerCase().includes(searchLower) ||
        areteHembra?.toLowerCase().includes(searchLower) ||
        numeroMontaFormateado.toLowerCase().includes(searchLower) ||
        partoItem.tipo_evento?.nombre?.toLowerCase().includes(searchLower)
      );
      
      if (!coincideBusqueda) return false;
    }
    
    if (fechaFiltro) {
      const fechaParto = new Date(partoItem.fecha);
      const fechaFiltroDate = new Date(fechaFiltro);
      
      if (fechaParto.toDateString() !== fechaFiltroDate.toDateString()) {
        return false;
      }
    }
    
    return true;
  });

  const getItemName = () => {
    if (!itemToDelete) return '';
    return `Parto #${itemToDelete.evento_id}`;
  };

  const canManage = user?.rol === 'admin' || user?.rol === 'veterinario';

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
                  No tienes permisos para acceder a la gestión de partos.
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
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Partos</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra los partos registrados en el sistema</p>
          </div>
          <Button 
            onClick={handleCreate} 
            className="flex items-center gap-2 w-full sm:w-auto"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Registrar Parto
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar partos por descripción, arete de hembra, número de monta o tipo de evento..."
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
            <CardTitle>Lista de Partos</CardTitle>
            <CardDescription>
              {filteredPartos.length} de {partos.length} parto(s) encontrado(s)
              {(searchTerm || fechaFiltro) && " (filtrados)"}
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
                        <th className="text-left py-3 font-medium">Hembra</th>
                        <th className="text-left py-3 font-medium">Tipo Evento</th>
                        <th className="text-left py-3 font-medium">Fecha Parto</th>
                        <th className="text-left py-3 font-medium">Descripción</th>
                        <th className="text-left py-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPartos.map((partoItem) => {                        
                        const { numeroMonta, areteHembra } = obtenerDatosMonta(partoItem);
                        
                        return (
                          <tr key={partoItem.evento_id} className="border-b hover:bg-gray-50">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-mono ">
                                  {formatearNumeroMonta(numeroMonta)}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-mono ">
                                  {areteHembra}
                                </Badge>

                              </div>
                            </td>
                            <td className="py-3">
                                {partoItem.tipo_evento?.nombre || 'N/A'}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                  {format(new Date(partoItem.fecha), "dd/MM/yyyy", { locale: es })}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="max-w-xs truncate">
                                {partoItem.descripcion || 'Sin descripción'}
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
                                  <DropdownMenuItem onClick={() => handleEdit(partoItem)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar parto
                                  </DropdownMenuItem>
                                  {user.rol === 'admin' && (
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteClick(partoItem)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar parto
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="sm:hidden space-y-4">
                  {filteredPartos.map((partoItem) => {
                    const { numeroMonta, areteHembra } = obtenerDatosMonta(partoItem);
                    
                    return (
                      <Card key={partoItem.evento_id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="font-mono">
                                  {formatearNumeroMonta(numeroMonta)}
                                </Badge>
                                <Badge variant="secondary" className="font-mono">
                                  {areteHembra}
                                </Badge>
                              </div>
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  {partoItem.tipo_evento?.nombre || 'N/A'}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  {format(new Date(partoItem.fecha), "dd/MM/yyyy", { locale: es })}
                                </div>
                                {partoItem.descripcion && (
                                  <div className="text-sm text-gray-600">
                                    {partoItem.descripcion}
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
                                <DropdownMenuItem onClick={() => handleEdit(partoItem)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar parto
                                </DropdownMenuItem>
                                {user.rol === 'admin' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(partoItem)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar parto
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredPartos.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || fechaFiltro ? 'No se encontraron partos que coincidan con los filtros aplicados' : 'No hay partos registrados'}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingParto ? 'Editar Parto' : 'Registrar Nuevo Parto'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {editingParto 
                  ? 'Actualiza la información del parto' 
                  : 'Complete la información para registrar un nuevo parto'
                }
              </DialogDescription>
            </DialogHeader>
            <PartoForm
              parto={editingParto}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        <Modal
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Eliminar Parto"
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

export default PartosPage;
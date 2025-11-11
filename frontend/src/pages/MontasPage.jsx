import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMontaStore } from '../store/montaStore';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Shield, MoreHorizontal, Search, Loader2, CheckCircle,
  XCircle, Calendar
 } from 'lucide-react';
import MontaForm from '@/components/montas/MontaForm';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { FaCow } from 'react-icons/fa6';

const MontasPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { montas, fetchMontas, deleteMonta, loading } = useMontaStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [showForm, setShowForm] = useState(false);
  const [editingMonta, setEditingMonta] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasFetchedMontas, setHasFetchedMontas] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos'); 

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
        (user?.rol === 'admin' || user?.rol === 'veterinario' || user?.rol === 'operario') && 
        !hasFetchedMontas) {
      console.log('Cargando montas...');
      fetchMontas();
      setHasFetchedMontas(true);
    }
  }, [authStatus, user, fetchMontas, hasFetchedMontas]);

  const handleCreate = useCallback((e) => {
    setEditingMonta(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((montaData) => {
    setEditingMonta(montaData);
    setShowForm(true);
  }, []);

  const handleDeleteClick = useCallback((montaItem) => {
    setItemToDelete(montaItem);
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      const result = await deleteMonta(itemToDelete.monta_id);
      
      if (result.success) {
        await fetchMontas();
        
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Eliminado correctamente</span>
            </div>
          ),
          description: "La monta se eliminó exitosamente.",
          duration: 3000,
        });
      } else {
        if (result.error?.includes('diagnósticos') || result.error?.includes('asociados')) {
          toast({
            title: (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>Error al eliminar</span>
              </div>
            ),
            description: "No se puede eliminar porque esta monta tiene diagnósticos asociados.",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          toast({
            title: (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>Error al eliminar</span>
              </div>
            ),
            description: result.error || "Error desconocido al eliminar la monta.",
            variant: "destructive",
            duration: 5000,
          });
        }
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
    setEditingMonta(null);
    fetchMontas();
    
    toast({
      title: editingMonta ?
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
      description: editingMonta 
        ? "La monta se actualizó exitosamente." 
        : "La monta se creó exitosamente.",
      duration: 3000,
    });
  }, [fetchMontas, editingMonta, toast]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingMonta(null);
  }, []);

  const formatearNumeroMonta = (numeroMonta) => {
    if (!numeroMonta) return 'N/A';
    

    if (typeof numeroMonta === 'number') {
      return `MONTA-${numeroMonta.toString()}`;
    }
    
    return numeroMonta;
  };

  const filteredMontas = montas.filter(montaItem => {
    if (filtroEstado === 'completadas' && !montaItem.estado) return false;
    if (filtroEstado === 'pendientes' && montaItem.estado) return false;
    
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase().trim();
    const numeroMontaFormateado = formatearNumeroMonta(montaItem.numero_monta);
    
    return (
      numeroMontaFormateado.toLowerCase().includes(searchLower) ||
      montaItem.hembra?.arete?.toLowerCase().includes(searchLower) ||
      montaItem.macho?.arete?.toLowerCase().includes(searchLower) ||
      montaItem.tipo_evento?.nombre?.toLowerCase().includes(searchLower) ||
      montaItem.descripcion?.toLowerCase().includes(searchLower)
    );
  });

  const getItemName = () => {
    if (!itemToDelete) return '';
    const numeroFormateado = formatearNumeroMonta(itemToDelete.numero_monta);
    return `Monta ${numeroFormateado}`;
  };

  const getEstadoBadge = (estado) => {
    return estado ? 
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Completada</Badge> :
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
  };

  if (user.rol !== 'admin' && user.rol !== 'veterinario' && user.rol !== 'operario') {
    return (
      <MainLayout>
        <div className="container mx-auto p-4 sm:p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold">Acceso Restringido</h3>
                <p className="text-gray-500 mt-2">
                  No tienes permisos para acceder a la gestión de montas.
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
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Montas</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra los eventos de monta del sistema</p>
          </div>
          <Button 
            onClick={handleCreate} 
            className="flex items-center gap-2 w-full sm:w-auto"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Crear Monta
          </Button>
        </div>
    
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar montas por número, arete de animales o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="w-full sm:w-48">
          
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger id="filtro-estado" className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="completadas">Completadas</SelectItem>
                <SelectItem value="pendientes">Pendientes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Montas</CardTitle>
            <CardDescription>
              {filteredMontas.length} de {montas.length} monta(s) encontrada(s)
              {filtroEstado !== 'todos' && (
                <span className="ml-2">
                  ({filtroEstado === 'completadas' ? 'Completadas' : 'En proceso'})
                </span>
              )}
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
                        <th className="text-left py-3 font-medium">Número</th>
                        <th className="text-left py-3 font-medium">Hembra</th>
                        <th className="text-left py-3 font-medium">Macho</th>
                        <th className="text-left py-3 font-medium">Tipo Evento</th>
                        <th className="text-left py-3 font-medium">Estado</th>
                        <th className="text-left py-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMontas.map((montaItem) => (                        
                        <tr key={montaItem.monta_id} className="border-b hover:bg-gray-50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono">
                                {formatearNumeroMonta(montaItem.numero_monta)}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              {montaItem.hembra?.arete || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              {montaItem.macho?.arete || 'No asignado'}
                            </div>
                          </td>
                          <td className="py-3">
                            {montaItem.tipo_evento?.nombre || 'N/A'}
                          </td>
                          <td className="py-3">
                            {getEstadoBadge(montaItem.estado)}
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
                                <DropdownMenuItem onClick={() => handleEdit(montaItem)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar monta
                                </DropdownMenuItem>
                                {user.rol === 'admin' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(montaItem)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar monta
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
                  {filteredMontas.map((montaItem) => (
                    <Card key={montaItem.monta_id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="font-mono">
                                {formatearNumeroMonta(montaItem.numero_monta)}
                              </Badge>
                              {getEstadoBadge(montaItem.estado)}
                            </div>
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Hembra: {montaItem.hembra?.arete || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Macho: {montaItem.macho?.arete || 'No asignado'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">{montaItem.tipo_evento?.nombre || 'N/A'}</span>
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
                              <DropdownMenuItem onClick={() => handleEdit(montaItem)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar monta
                              </DropdownMenuItem>
                              {user.rol === 'admin' && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(montaItem)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar monta
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

            {filteredMontas.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || filtroEstado !== 'todos' 
                  ? 'No se encontraron montas que coincidan con los filtros aplicados' 
                  : 'No hay montas registradas'
                }
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingMonta ? 'Editar Monta' : 'Crear Nueva Monta'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {editingMonta 
                  ? 'Actualiza la información de la monta' 
                  : 'Complete la información para crear una nueva monta'
                }
              </DialogDescription>
            </DialogHeader>
            <MontaForm
              monta={editingMonta}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        <Modal
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Eliminar Monta"
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

export default MontasPage;
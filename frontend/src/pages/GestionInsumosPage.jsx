import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useInsumoStore } from '@/store/insumoStore';
import { useTipoInsumoStore } from '@/store/tipoInsumoStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Loader2, Plus, Edit, Trash2, MoreHorizontal, Search, Package, Tag, AlertCircle } from 'lucide-react';
import InsumoForm from '@/components/insumos/InsumoForm';
import TipoInsumoForm from '@/components/tipoInsumo/TipoInsumoForm';
import InsumoCard from '@/components/insumos/InsumoCard';
import InsumoDetails from '@/components/insumos/InsumoDetails';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const GestionInsumosPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { 
    insumos, 
    fetchInsumos, 
    deleteInsumo, 
    loading: loadingInsumos 
  } = useInsumoStore();
  
  const { 
    tiposInsumo, 
    fetchTiposInsumo, 
    deleteTipoInsumo, 
    loading: loadingTipos 
  } = useTipoInsumoStore();
  
  const [authStatus, setAuthStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('insumos');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [vistaDetalle, setVistaDetalle] = useState(false);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);

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
    if (authStatus === 'authenticated') {
      fetchInsumos();
      fetchTiposInsumo();
    }
  }, [authStatus, fetchInsumos, fetchTiposInsumo]);

  const handleCreate = useCallback(() => {
    setEditingItem(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setShowForm(true);
    setVistaDetalle(false); 
  }, []);

  const handleDelete = useCallback((item, type) => {
    setItemToDelete({ item, type });
    setShowConfirm(true);
    setVistaDetalle(false); 
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      const { item, type } = itemToDelete;
      let result;
      
      if (type === 'insumo') {
        result = await deleteInsumo(item.insumo_id);
      } else {
        result = await deleteTipoInsumo(item.tipo_insumo_id);
      }
            
      if (result?.success) {
        await fetchInsumos();
        await fetchTiposInsumo();
        
        toast({
          title: "Eliminado correctamente",
          description: `El ${type === 'insumo' ? 'insumo' : 'tipo de insumo'} se eliminó exitosamente.`,
          duration: 3000,
        });
      } else {
        const errorMessage = result?.error || 'Error desconocido al eliminar';
        
        if (errorMessage.includes('referencia') || errorMessage.includes('foreign key') || errorMessage.includes('usado')) {
          toast({
            title: "No se puede eliminar",
            description: `No se puede eliminar porque está siendo usado en el sistema.`,
            variant: "destructive",
            duration: 5000,
          });
        } else {
          toast({
            title: "Error al eliminar",
            description: `Error: ${errorMessage}`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "Por favor, intente nuevamente.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setDeleteLoading(false);
      setShowConfirm(false);
    }
  };

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditingItem(null);
    fetchInsumos();
    fetchTiposInsumo();
    
    const itemType = activeTab === 'insumos' ? 'insumo' : 'tipo de insumo';
    toast({
      title: editingItem ? "Actualizado correctamente" : "Creado correctamente",
      description: editingItem 
        ? `El ${itemType} se actualizó exitosamente.` 
        : `El ${itemType} se creó exitosamente.`,
      duration: 3000,
    });
  }, [fetchInsumos, fetchTiposInsumo, editingItem, activeTab, toast]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingItem(null);
  }, []);

  const verDetalles = useCallback((insumo) => {
    setInsumoSeleccionado(insumo);
    setVistaDetalle(true);
  }, []);

  const cerrarDetalles = useCallback(() => {
    setVistaDetalle(false);
    setInsumoSeleccionado(null);
  }, []);

  const getItemName = () => {
    if (!itemToDelete) return '';
    return itemToDelete.type === 'insumo' 
      ? itemToDelete.item.nombre
      : itemToDelete.item.nombre;
  };

  const getItemType = () => {
    if (!itemToDelete) return '';
    return itemToDelete.type === 'insumo' ? 'insumo' : 'tipo de insumo';
  };

  const canManage = user?.rol === 'admin' || user?.rol === 'contable';

  const filteredInsumos = insumos.filter(insumo => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return (
      insumo.nombre?.toLowerCase().includes(searchLower) ||
      insumo.tipo_insumo?.nombre?.toLowerCase().includes(searchLower)
    );
  });

  const filteredTipos = tiposInsumo.filter(tipo => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return tipo.nombre?.toLowerCase().includes(searchLower);
  });

  const getFormTitle = () => {
    if (activeTab === 'insumos') {
      return editingItem ? 'Editar Insumo' : 'Crear Nuevo Insumo';
    } else {
      return editingItem ? 'Editar Tipo de Insumo' : 'Crear Nuevo Tipo de Insumo';
    }
  };

  const getFormDescription = () => {
    if (activeTab === 'insumos') {
      return editingItem 
        ? 'Actualiza la información del insumo' 
        : 'Complete la información para crear un nuevo insumo';
    } else {
      return editingItem 
        ? 'Actualiza la información del tipo de insumo' 
        : 'Complete la información para crear un nuevo tipo de insumo';
    }
  };

  const loading = loadingInsumos || loadingTipos;

  const totalInsumos = insumos.length;
  const insumosBajoStock = insumos.filter(insumo => insumo.cantidad <= 10).length;
  const insumosAgotados = insumos.filter(insumo => insumo.cantidad === 0).length;

  return (
    <MainLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Insumos</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra el inventario de insumos y sus categorías</p>
          </div>
          {canManage && (
            <Button 
              onClick={handleCreate} 
              className="flex items-center gap-2 w-full sm:w-auto"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Crear {activeTab === 'insumos' ? 'Insumo' : 'Tipo'}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Insumos</p>
                  <p className="text-2xl font-bold text-gray-900">{totalInsumos}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-gray-900">{insumosBajoStock}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Agotados</p>
                  <p className="text-2xl font-bold text-gray-900">{insumosAgotados}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={
              activeTab === 'insumos' 
                ? "Buscar por nombre, descripción o tipo..." 
                : "Buscar tipos de insumo..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="insumos" className="flex items-center gap-2 text-xs sm:text-sm">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              Insumos ({insumos.length})
            </TabsTrigger>
            <TabsTrigger value="tipos" className="flex items-center gap-2 text-xs sm:text-sm">
              <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
              Tipos de Insumo ({tiposInsumo.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insumos">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Insumos</CardTitle>
                <CardDescription>
                  {filteredInsumos.length} de {insumos.length} insumo(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(
                  <>
                    {filteredInsumos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredInsumos.map(insumo => (
                          <InsumoCard
                            key={insumo.insumo_id}
                            insumo={insumo}
                            onVerDetalles={verDetalles}
                            onEditar={canManage ? () => handleEdit(insumo) : undefined}
                            onEliminar={canManage ? () => handleDelete(insumo, 'insumo') : undefined}
                            canManage={canManage}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        {searchTerm 
                          ? 'No se encontraron insumos que coincidan con la búsqueda' 
                          : 'No hay insumos registrados'
                        }
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tipos">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Tipos de Insumo</CardTitle>
                <CardDescription>
                  {filteredTipos.length} de {tiposInsumo.length} tipo(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(
                  <div className="overflow-x-auto">
                    <div className="hidden sm:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 font-medium">Nombre</th>
                            <th className="text-left py-3 font-medium">Insumos</th>
                            {canManage && <th className="text-left py-3 font-medium">Acciones</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTipos.map((tipo) => (
                            <tr key={tipo.tipo_insumo_id} className="border-b hover:bg-gray-50">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{tipo.nombre}</span>
                                </div>
                              </td>
                              <td className="py-3">
                                <Badge variant={tipo._count?.insumos > 0 ? "default" : "secondary"}>
                                  {tipo._count?.insumos || 0} insumos
                                </Badge>
                              </td>
                              {canManage && (
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
                                      <DropdownMenuItem onClick={() => handleEdit(tipo)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDelete(tipo, 'tipo')}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="sm:hidden space-y-4">
                      {filteredTipos.map((tipo) => (
                        <Card key={tipo.tipo_insumo_id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Tag className="h-4 w-4 text-blue-600" />
                                  <h3 className="font-semibold text-lg">{tipo.nombre}</h3>
                                </div>
                               
                              </div>
                              {canManage && (
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
                                    <DropdownMenuItem onClick={() => handleEdit(tipo)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(tipo, 'tipo')}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {filteredTipos.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm 
                      ? 'No se encontraron tipos que coincidan con la búsqueda' 
                      : 'No hay tipos de insumo registrados'
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{getFormTitle()}</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">{getFormDescription()}</DialogDescription>
            </DialogHeader>
            {activeTab === 'insumos' ? (
              <InsumoForm
                insumo={editingItem}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            ) : (
              <TipoInsumoForm
                tipoInsumo={editingItem}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={vistaDetalle} onOpenChange={cerrarDetalles}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Detalles del Insumo</DialogTitle>
              <DialogDescription>
                Información completa del insumo seleccionado
              </DialogDescription>
            </DialogHeader>
            <InsumoDetails
              insumo={insumoSeleccionado}
              onEditar={canManage ? () => handleEdit(insumoSeleccionado) : undefined}
              onEliminar={canManage ? () => handleDelete(insumoSeleccionado, 'insumo') : undefined}
              canManage={canManage}
            />
          </DialogContent>
        </Dialog>

        <Modal
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title={`Eliminar ${getItemType()}`}
          description={`¿Está seguro de eliminar "${getItemName()}"? Esta acción no se puede deshacer.`}
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

export default GestionInsumosPage;
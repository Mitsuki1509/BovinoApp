import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTypeStore } from '../store/typeStore';
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
import { Plus, Edit, Trash2, Shield, MoreHorizontal, Search, Loader2, CheckCircle,
  XCircle, AlertCircle
 } from 'lucide-react';
import TypeForm from '@/components/types/TypeForm';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const TypesPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { eventTypes, fetchEventTypes, deleteEventType, loading, fetchParentEventTypes } = useTypeStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasFetchedTypes, setHasFetchedTypes] = useState(false);

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
    if (authStatus === 'authenticated' && (user?.rol === 'admin' || user?.rol === 'veterinario') && !hasFetchedTypes) {
      console.log('Cargando tipos de evento...');
      fetchEventTypes();
      fetchParentEventTypes();
      setHasFetchedTypes(true);
    }
  }, [authStatus, user, fetchEventTypes, fetchParentEventTypes, hasFetchedTypes]);

  const handleCreate = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingType(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((typeData) => {
    setEditingType(typeData);
    setShowForm(true);
  }, []);

  const handleDeleteClick = useCallback((typeItem) => {
    setItemToDelete(typeItem);
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      const result = await deleteEventType(itemToDelete.tipo_evento_id);
      
      if (result.success) {
        await fetchEventTypes();
        await fetchParentEventTypes();
        
        toast({
          title: 
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Eliminado correctamente</span>
          </div>,
          description: "El tipo de evento se eliminó exitosamente.",
          duration: 3000,
        });
      } else {
        
        if (result.error?.includes('referencia') || result.error?.includes('foreign key')) {
          toast({
            title:  (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>Error al eliminar</span>
              </div>
            ),
            description: "No se puede eliminar porque este tipo está siendo usado por eventos existentes.",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          toast({
            title:(
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>Error al eliminar</span>
              </div>
            ),
            description: result.error || "Error desconocido al eliminar el tipo de evento.",
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
    setEditingType(null);
    fetchEventTypes();
    fetchParentEventTypes();
    
    toast({
      title: editingType ?
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
      description: editingType 
        ? "El tipo de evento se actualizó exitosamente." 
        : "El tipo de evento se creó exitosamente.",
      duration: 3000,
    });
  }, [fetchEventTypes, fetchParentEventTypes, editingType, toast]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingType(null);
  }, []);

  const getParentName = useCallback((typeItem) => {
    if (typeItem.padre && typeItem.padre.nombre) {
      return typeItem.padre.nombre;
    }
    
    if (typeItem.padre_id) {
      const parentType = eventTypes.find(t => t.tipo_evento_id === typeItem.padre_id);
      return parentType?.nombre || 'Tipo padre no encontrado';
    }
    
    return 'Categoría Principal';
  }, [eventTypes]);

  const hasChildren = useCallback((typeItem) => {
    return typeItem.hijos && typeItem.hijos.length > 0;
  }, []);

  const filteredTypes = eventTypes.filter(typeItem => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase().trim();
    const parentName = getParentName(typeItem).toLowerCase();
    
    return (
      typeItem.nombre?.toLowerCase().includes(searchLower) ||
      parentName.includes(searchLower)
    );
  });

  const getItemName = () => {
    if (!itemToDelete) return '';
    return itemToDelete.nombre || 'Tipo de evento';
  };


  if (user.rol !== 'admin' && user.rol !== 'veterinario') {
    return (
      <MainLayout>
        <div className="container mx-auto p-4 sm:p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold">Acceso Restringido</h3>
                <p className="text-gray-500 mt-2">
                  No tienes permisos para acceder a la gestión de tipos de evento.
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
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Tipos de Evento</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra los tipos y categorías de eventos del sistema</p>
          </div>
          <Button 
            onClick={handleCreate} 
            className="flex items-center gap-2 w-full sm:w-auto"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Crear Tipo
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar tipos por nombre o categoría padre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Tipos de Evento</CardTitle>
            <CardDescription>
              {filteredTypes.length} de {eventTypes.length} tipo(s) encontrado(s)
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
                        <th className="text-left py-3 font-medium">Nombre</th>
                        <th className="text-left py-3 font-medium">Tipo Evento</th>
                        <th className="text-left py-3 font-medium">Sub-eventos</th>
                        <th className="text-left py-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTypes.map((typeItem) => {
                        const parentName = getParentName(typeItem);
                        const hasSubTypes = hasChildren(typeItem);
                        
                        return (
                          <tr key={typeItem.tipo_evento_id} className="border-b hover:bg-gray-50">
                            <td className="py-3 font-medium">{typeItem.nombre}</td>
                            <td className="py-3">
                              <Badge variant={parentName === 'Categoría Principal' ? 'default' : 'secondary'}>
                                {parentName}
                              </Badge>
                            </td>
                            <td className="py-3">
                              {hasSubTypes ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-green-600 font-medium">
                                    {typeItem.hijos.length} sub-evento(s)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">Sin sub-eventos</span>
                              )}
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
                                  <DropdownMenuItem onClick={() => handleEdit(typeItem)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar evento
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(typeItem)}
                                    disabled={hasSubTypes}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {hasSubTypes ? 'No se puede eliminar (tiene sub-eventos)' : 'Eliminar evento'}
                                  </DropdownMenuItem>
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
                  {filteredTypes.map((typeItem) => {
                    const parentName = getParentName(typeItem);
                    const hasSubTypes = hasChildren(typeItem);
                    
                    return (
                      <Card key={typeItem.tipo_evento_id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{typeItem.nombre}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={parentName === 'Categoría Principal' ? 'default' : 'secondary'}>
                                  {parentName}
                                </Badge>
                              </div>
                              <div className="mt-2">
                                {hasSubTypes ? (
                                  <span className="text-green-600 font-medium text-sm">
                                    {typeItem.hijos.length} sub-evento(s)
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-sm">Sin sub-eventos</span>
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
                                <DropdownMenuItem onClick={() => handleEdit(typeItem)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar evento
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(typeItem)}
                                  disabled={hasSubTypes}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {hasSubTypes ? 'No se puede eliminar (tiene sub-eventos)' : 'Eliminar evento'}
                                </DropdownMenuItem>
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

            {filteredTypes.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No se encontraron tipos que coincidan con la búsqueda' : 'No hay tipos de evento registrados'}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingType ? 'Editar Tipo de Evento' : 'Crear Nuevo Tipo de Evento'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {editingType 
                  ? 'Actualiza la información del tipo de evento' 
                  : 'Complete la información para crear un nuevo tipo de evento'
                }
              </DialogDescription>
            </DialogHeader>
            <TypeForm
              type={editingType}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        <Modal
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Eliminar Tipo de Evento"
          description={`¿Está seguro de eliminar el tipo de evento "${getItemName()}"? Esta acción no se puede deshacer.`}
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

export default TypesPage;
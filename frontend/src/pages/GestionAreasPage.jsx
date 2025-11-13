import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useLoteStore } from '@/store/loteStore';
import { usePotreroStore } from '@/store/potreroStore';
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
import { Loader2, Plus, Edit, Trash2, MoreHorizontal, Search, Package, MapPin,
  CheckCircle, XCircle
 } from 'lucide-react';
import LoteForm from '@/components/lotes/LoteForm';
import PotreroForm from '@/components/potreros/PotreroForm';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const GestionAreasPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { lotes, fetchLotes, deleteLote, loading: loadingLotes } = useLoteStore();
  const { potreros, fetchPotreros, deletePotrero, loading: loadingPotreros } = usePotreroStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('lotes');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    if (authStatus === 'authenticated') {
      fetchLotes();
      fetchPotreros();
    }
  }, [authStatus, fetchLotes, fetchPotreros]);

  const handleCreate = useCallback(() => {
    setEditingItem(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((item, type) => {
    setItemToDelete({ item, type });
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      const { item, type } = itemToDelete;
      const itemId = type === 'lote' ? item.lote_id : item.potrero_id;
      
      let result;
      if (type === 'lote') {
        result = await deleteLote(itemId);
      } else {
        result = await deletePotrero(itemId);
      }
            
      if (result?.success) {
        await fetchLotes();
        await fetchPotreros();
        
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Eliminado correctamente</span>
            </div>
          ),
          description: `El ${type === 'lote' ? 'lote' : 'potrero'} se eliminó exitosamente.`,
          duration: 3000,
        });
      } else {
        const errorMessage = result?.error || 'Error desconocido al eliminar';
        
        if (errorMessage.includes('referencia') || errorMessage.includes('foreign key') || errorMessage.includes('lotes') || errorMessage.includes('restrict')) {
          toast({
            title: (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>No se puede eliminar</span>
              </div>
            ),
            description: `No se puede eliminar el potrero porque está siendo usado por uno o más lotes.`,
            variant: "destructive",
            duration: 5000,
          });
        } else if (errorMessage.includes('animales') || errorMessage.includes('asignado')) {
          toast({
            title: (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>No se puede eliminar</span>
              </div>
            ),
            description: `No se puede eliminar el lote porque tiene animales asignados.`,
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
            description: `Error: ${errorMessage}`,
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
    }
  };

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditingItem(null);
    fetchLotes();
    fetchPotreros();
    
    const itemType = activeTab === 'lotes' ? 'lote' : 'potrero';
    toast({
      title: editingItem ? (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>Actualizado correctamente</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>Creado correctamente</span>
        </div>
      ),
      description: editingItem 
        ? `El ${itemType} se actualizó exitosamente.` 
        : `El ${itemType} se creó exitosamente.`,
      duration: 3000,
    });
  }, [fetchLotes, fetchPotreros, editingItem, activeTab, toast]);

  const getItemName = () => {
    if (!itemToDelete) return '';
    return itemToDelete.type === 'lote' 
      ? `${itemToDelete.item.codigo} - ${itemToDelete.item.descripcion}`
      : itemToDelete.item.ubicacion;
  };

  const getItemType = () => {
    if (!itemToDelete) return '';
    return itemToDelete.type === 'lote' ? 'lote' : 'potrero';
  };

  const canManage = user?.rol === 'admin' || user?.rol === 'operario';

  const filteredLotes = lotes.filter(lote => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return (
      lote.codigo?.toLowerCase().includes(searchLower) ||
      lote.descripcion?.toLowerCase().includes(searchLower) ||
      lote.potrero?.ubicacion?.toLowerCase().includes(searchLower)
    );
  });

  const filteredPotreros = potreros.filter(potrero => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return potrero.ubicacion?.toLowerCase().includes(searchLower);
  });

  const getFormTitle = () => {
    if (activeTab === 'lotes') {
      return editingItem ? 'Editar Lote' : 'Crear Nuevo Lote';
    } else {
      return editingItem ? 'Editar Potrero' : 'Crear Nuevo Potrero';
    }
  };

  const getFormDescription = () => {
    if (activeTab === 'lotes') {
      return editingItem 
        ? 'Actualiza la información del lote' 
        : 'Complete la información para crear un nuevo lote';
    } else {
      return editingItem 
        ? 'Actualiza la información del potrero' 
        : 'Complete la información para crear un nuevo potrero';
    }
  };

  const loading = loadingLotes || loadingPotreros;

  return (
    <MainLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Áreas</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra potreros y lotes de animales</p>
          </div>
          {canManage && (
            <Button 
              onClick={handleCreate} 
              className="flex items-center gap-2 w-full sm:w-auto"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Crear {activeTab === 'lotes' ? 'Lote' : 'Potrero'}
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={
              activeTab === 'lotes' 
                ? "Buscar por código, descripción o ubicación..." 
                : "Buscar potreros por ubicación..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lotes" className="flex items-center gap-2 text-xs sm:text-sm">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              Lotes ({lotes.length})
            </TabsTrigger>
            <TabsTrigger value="potreros" className="flex items-center gap-2 text-xs sm:text-sm">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              Potreros ({potreros.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lotes">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Lotes</CardTitle>
                <CardDescription>
                  {filteredLotes.length} de {lotes.length} lote(s) encontrado(s)
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
                            <th className="text-left py-3 font-medium">Código</th>
                            <th className="text-left py-3 font-medium">Descripción</th>
                            <th className="text-left py-3 font-medium">Potrero</th>
                            <th className="text-left py-3 font-medium">Animales</th>
                            {canManage && <th className="text-left py-3 font-medium">Acciones</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLotes.map((lote) => (
                            <tr key={lote.lote_id} className="border-b hover:bg-gray-50">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="font-mono">
                                    {lote.codigo}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-3">
                                <span className="font-medium max-w-md truncate">
                                  {lote.descripcion}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {lote.potrero?.ubicacion}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-3">
                                <Badge variant={lote._count?.animales > 0 ? "default" : "secondary"}>
                                  {lote._count?.animales || 0} animales
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
                                      <DropdownMenuItem onClick={() => handleEdit(lote)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDelete(lote, 'lote')}
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
                      {filteredLotes.map((lote) => (
                        <Card key={lote.lote_id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div>
                                    <Badge variant="outline" className="font-mono mb-1">
                                      {lote.codigo}
                                    </Badge>
                                    <h3 className="font-semibold text-lg">{lote.descripcion}</h3>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">
                                    {lote.potrero?.ubicacion}
                                  </Badge>
                                </div>
                                <Badge variant={lote._count?.animales > 0 ? "default" : "secondary"}>
                                  {lote._count?.animales || 0} animales
                                </Badge>
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
                                  <DropdownMenuItem onClick={() => handleEdit(lote)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(lote, 'lote')}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {filteredLotes.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No se encontraron lotes que coincidan con la búsqueda' : 'No hay lotes registrados'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="potreros">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Potreros</CardTitle>
                <CardDescription>
                  {filteredPotreros.length} de {potreros.length} potrero(s) encontrado(s)
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
                            <th className="text-left py-3 font-medium">Ubicación</th>
                            {canManage && <th className="text-left py-3 font-medium">Acciones</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPotreros.map((potrero) => (
                            <tr key={potrero.potrero_id} className="border-b hover:bg-gray-50">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{potrero.ubicacion}</span>
                                </div>
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
                                      <DropdownMenuItem onClick={() => handleEdit(potrero)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDelete(potrero, 'potrero')}
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
                      {filteredPotreros.map((potrero) => (
                        <Card key={potrero.potrero_id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{potrero.ubicacion}</h3>
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
                                  <DropdownMenuItem onClick={() => handleEdit(potrero)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(potrero, 'potrero')}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {filteredPotreros.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No se encontraron potreros que coincidan con la búsqueda' : 'No hay potreros registrados'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{getFormTitle()}</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">{getFormDescription()}</DialogDescription>
            </DialogHeader>
            {activeTab === 'lotes' ? (
              <LoteForm
                lote={editingItem}
                onSuccess={handleFormSuccess}
              />
            ) : (
              <PotreroForm
                potrero={editingItem}
                onSuccess={handleFormSuccess}
              />
            )}
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

export default GestionAreasPage;
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useMataderoStore } from '@/store/mataderoStore';
import { useProduccionCarneStore } from '@/store/produccionCarneStore';
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
import { Loader2, Plus, Edit, Trash2, MoreHorizontal, Search, MapPin, Scale,
  CheckCircle, XCircle, Calendar, User
 } from 'lucide-react';
import MataderoForm from '@/components/mataderos/MataderoForm';
import ProduccionCarneForm from '@/components/produccionCarne/ProduccionCarneForm';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const GestionCarnePage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { mataderos, fetchMataderos, deleteMatadero, loading: loadingMataderos } = useMataderoStore();
  const { producciones, fetchProducciones, deleteProduccion, loading: loadingProducciones } = useProduccionCarneStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('producciones');
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
      fetchMataderos();
      fetchProducciones();
    }
  }, [authStatus, fetchMataderos, fetchProducciones]);

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
      const itemId = type === 'matadero' ? item.matadero_id : item.produccion_id;
      
      let result;
      if (type === 'matadero') {
        result = await deleteMatadero(itemId);
      } else {
        result = await deleteProduccion(itemId);
      }
            
      if (result?.success) {
        await fetchMataderos();
        await fetchProducciones();
        
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Eliminado correctamente</span>
            </div>
          ),
          description: `El ${type === 'matadero' ? 'matadero' : 'registro de producción'} se eliminó exitosamente.`,
          duration: 3000,
        });
      } else {
        const errorMessage = result?.error || 'Error desconocido al eliminar';
        
        if (errorMessage.includes('referencia') || errorMessage.includes('foreign key') || errorMessage.includes('producciones') || errorMessage.includes('restrict')) {
          toast({
            title: (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>No se puede eliminar</span>
              </div>
            ),
            description: `No se puede eliminar el matadero porque está siendo usado en producciones de carne.`,
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
    fetchMataderos();
    fetchProducciones();
    
    const itemType = activeTab === 'mataderos' ? 'matadero' : 'producción de carne';
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
        : `La ${itemType} se creó exitosamente.`,
      duration: 3000,
    });
  }, [fetchMataderos, fetchProducciones, editingItem, activeTab, toast]);

  const formatDateWithoutTZ = (dateString) => {
    try {
        if (!dateString) return 'Fecha inválida';
        
        const [year, month, day] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (isNaN(date.getTime())) return 'Fecha inválida';
        
        return format(date, "dd/MM/yyyy", { locale: es });
    } catch (error) {
        return 'Fecha inválida';
    }
  };

  const getItemName = () => {
    if (!itemToDelete) return '';
    return itemToDelete.type === 'matadero' 
      ? itemToDelete.item.ubicacion
      : `Producción del ${formatDateWithoutTZ(itemToDelete.item.fecha)}`;
  };

  const getItemType = () => {
    if (!itemToDelete) return '';
    return itemToDelete.type === 'matadero' ? 'matadero' : 'producción de carne';
  };

  const canManage = user?.rol === 'admin' || user?.rol === 'operario';

  const filteredMataderos = mataderos.filter(matadero => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return matadero.ubicacion?.toLowerCase().includes(searchLower);
  });

  const filteredProducciones = producciones.filter(produccion => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return (
      produccion.animal?.arete?.toLowerCase().includes(searchLower) ||
      produccion.matadero?.ubicacion?.toLowerCase().includes(searchLower) ||
      produccion.peso_canal?.toString().includes(searchTerm) ||
      (produccion.pesaje?.numero_pesaje && produccion.pesaje.numero_pesaje.toLowerCase().includes(searchLower))
    );
  });

  const getFormTitle = () => {
    if (activeTab === 'mataderos') {
      return editingItem ? 'Editar Matadero' : 'Crear Nuevo Matadero';
    } else {
      return editingItem ? 'Editar Producción de Carne' : 'Nueva Producción de Carne';
    }
  };

  const getFormDescription = () => {
    if (activeTab === 'mataderos') {
      return editingItem 
        ? 'Actualiza la información del matadero' 
        : 'Complete la información para crear un nuevo matadero';
    } else {
      return editingItem 
        ? 'Actualiza la información de la producción de carne' 
        : 'Complete la información para registrar una nueva producción de carne';
    }
  };

  const loading = loadingMataderos || loadingProducciones;

  return (
    <MainLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Producción de Carne</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra mataderos y registros de producción de carne</p>
          </div>
          {canManage && (
            <Button 
              onClick={handleCreate} 
              className="flex items-center gap-2 w-full sm:w-auto"
              type="button"
              variant="produccion"
            >
              <Plus className="h-4 w-4" />
              {activeTab === 'mataderos' ? 'Crear Matadero' : 'Nueva Producción'}
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={
              activeTab === 'mataderos' 
                ? "Buscar mataderos por ubicación..." 
                : "Buscar por arete, matadero, peso o número de pesaje..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="producciones" className="flex items-center gap-2 text-xs sm:text-sm">
              <Scale className="h-3 w-3 sm:h-4 sm:w-4" />
              Producciones ({producciones.length})
            </TabsTrigger>
            <TabsTrigger value="mataderos" className="flex items-center gap-2 text-xs sm:text-sm">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              Mataderos ({mataderos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="producciones">
            <Card>
              <CardHeader>
                <CardTitle>Registros de Producción de Carne</CardTitle>
                <CardDescription>
                  {filteredProducciones.length} de {producciones.length} registro(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!loading ? (
                  <div className="overflow-x-auto">
                    <div className="hidden sm:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 font-medium">Animal</th>
                            <th className="text-left py-3 font-medium">Peso Canal</th>
                            <th className="text-left py-3 font-medium">Matadero</th>
                            <th className="text-left py-3 font-medium">Pesaje</th>
                            <th className="text-left py-3 font-medium">Fecha</th>
                            {canManage && <th className="text-left py-3 font-medium">Acciones</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducciones.map((produccion) => (
                            <tr key={produccion.produccion_id} className="border-b hover:bg-gray-50">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="font-mono">
                                    {produccion.animal?.arete}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {parseFloat(produccion.peso_canal).toFixed(2)} kg
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <span>{produccion.matadero?.ubicacion}</span>
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {produccion.pesaje?.numero_pesaje || 'Auto-generado'}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <span>
                                    {formatDateWithoutTZ(produccion.fecha)}
                                  </span>
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
                                     
                                      <DropdownMenuItem 
                                        onClick={() => handleDelete(produccion, 'produccion')}
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
                      {filteredProducciones.map((produccion) => (
                        <Card key={produccion.produccion_id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" className="font-mono">
                                    {produccion.animal?.arete}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">
                                    {parseFloat(produccion.peso_canal).toFixed(2)} kg
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm">{produccion.matadero?.ubicacion}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {produccion.pesaje?.numero_pesaje || 'Auto-generado'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">
                                    {formatDateWithoutTZ(produccion.fecha)}
                                  </span>
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
                                 
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(produccion, 'produccion')}
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
                ) : (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Cargando producciones...</span>
                  </div>
                )}

                {filteredProducciones.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No se encontraron producciones que coincidan con la búsqueda' : 'No hay registros de producción de carne'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mataderos">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Mataderos</CardTitle>
                <CardDescription>
                  {filteredMataderos.length} de {mataderos.length} matadero(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!loading ? (
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
                          {filteredMataderos.map((matadero) => (
                            <tr key={matadero.matadero_id} className="border-b hover:bg-gray-50">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{matadero.ubicacion}</span>
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
                                      <DropdownMenuItem onClick={() => handleEdit(matadero)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDelete(matadero, 'matadero')}
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
                      {filteredMataderos.map((matadero) => (
                        <Card key={matadero.matadero_id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">{matadero.ubicacion}</h3>
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
                                    <DropdownMenuItem onClick={() => handleEdit(matadero)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(matadero, 'matadero')}
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
                ) : (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Cargando mataderos...</span>
                  </div>
                )}

                {filteredMataderos.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No se encontraron mataderos que coincidan con la búsqueda' : 'No hay mataderos registrados'}
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
            {activeTab === 'mataderos' ? (
              <MataderoForm
                matadero={editingItem}
                onSuccess={handleFormSuccess}
                onCancel={() => setShowForm(false)}
              />
            ) : (
              <ProduccionCarneForm
                produccion={editingItem}
                onSuccess={handleFormSuccess}
                onCancel={() => setShowForm(false)}
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

export default GestionCarnePage;
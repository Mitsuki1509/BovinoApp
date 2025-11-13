import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useRazaStore } from '../store/razaStore';
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
import RazaForm from '@/components/razas/RazaForm';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const RazasPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { razas, fetchRazas, deleteRaza, loading } = useRazaStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [showForm, setShowForm] = useState(false);
  const [editingRaza, setEditingRaza] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasFetchedRazas, setHasFetchedRazas] = useState(false);

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
      !hasFetchedRazas) {
    console.log('Cargando razas...');
    fetchRazas()
    setHasFetchedRazas(true);
  }
}, [authStatus, user, fetchRazas, hasFetchedRazas]);


  const handleCreate = useCallback((e) => {
    
    setEditingRaza(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((razaData) => {
    setEditingRaza(razaData);
    setShowForm(true);
  }, []);

  const handleDeleteClick = useCallback((razaItem) => {
    setItemToDelete(razaItem);
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      const result = await deleteRaza(itemToDelete.raza_id);
      
      if (result.success) {
        await fetchRazas();
        
        toast({
          title: 
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Eliminado correctamente</span>
          </div>,
          description: "La raza se eliminó exitosamente.",
          duration: 3000,
        });
      } else {
        
        if (result.error?.includes('animales') || result.error?.includes('asignada')) {
          toast({
            title:  (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>Error al eliminar</span>
              </div>
            ),
            description: "No se puede eliminar porque esta raza está siendo usada por animales existentes.",
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
            description: result.error || "Error desconocido al eliminar la raza.",
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
    setEditingRaza(null);
    fetchRazas();
    
    toast({
      title: editingRaza ?
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
      description: editingRaza 
        ? "La raza se actualizó exitosamente." 
        : "La raza se creó exitosamente.",
      duration: 3000,
    });
  }, [fetchRazas, editingRaza, toast]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingRaza(null);
  }, []);

  const filteredRazas = razas.filter(razaItem => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    return (
      razaItem.nombre?.toLowerCase().includes(searchLower) ||
      (razaItem.descripcion?.toLowerCase().includes(searchLower) || '')
    );
  });

  const getItemName = () => {
    if (!itemToDelete) return '';
    return itemToDelete.nombre || 'Raza';
  };

  if (user.rol !== 'admin' && user.rol !== 'veterinario' && user.rol !='operario') {
    return (
      <MainLayout>
        <div className="container mx-auto p-4 sm:p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold">Acceso Restringido</h3>
                <p className="text-gray-500 mt-2">
                  No tienes permisos para acceder a la gestión de razas.
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
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Razas</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra las razas de animales del sistema</p>
          </div>
          <Button 
            onClick={handleCreate} 
            className="flex items-center gap-2 w-full sm:w-auto"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Crear Raza
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar razas por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Razas</CardTitle>
            <CardDescription>
              {filteredRazas.length} de {razas.length} raza(s) encontrada(s)
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
                        <th className="text-left py-3 font-medium">Descripción</th>
                        <th className="text-left py-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRazas.map((razaItem) => (                        
                        <tr key={razaItem.raza_id} className="border-b hover:bg-gray-50">
                          <td className="py-3 font-medium">{razaItem.nombre}</td>
                          <td className="py-3">
                            {razaItem.descripcion ? (
                              <span className="text-gray-600">{razaItem.descripcion}</span>
                            ) : (
                              <span className="text-gray-400 italic">Sin descripción</span>
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
                                <DropdownMenuItem onClick={() => handleEdit(razaItem)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar raza
                                </DropdownMenuItem>
                                {user.rol === 'admin' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(razaItem)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar raza
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
                  {filteredRazas.map((razaItem) => (
                    <Card key={razaItem.raza_id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{razaItem.nombre}</h3>
                            <div className="mt-2">
                              {razaItem.descripcion ? (
                                <p className="text-gray-600 text-sm">{razaItem.descripcion}</p>
                              ) : (
                                <span className="text-gray-400 text-sm italic">Sin descripción</span>
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
                              <DropdownMenuItem onClick={() => handleEdit(razaItem)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar raza
                              </DropdownMenuItem>
                              {user.rol === 'admin' && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(razaItem)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar raza
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

            {filteredRazas.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No se encontraron razas que coincidan con la búsqueda' : 'No hay razas registradas'}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingRaza ? 'Editar Raza' : 'Crear Nueva Raza'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {editingRaza 
                  ? 'Actualiza la información de la raza' 
                  : 'Complete la información para crear una nueva raza'
                }
              </DialogDescription>
            </DialogHeader>
            <RazaForm
              raza={editingRaza}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        <Modal
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Eliminar Raza"
          description={`¿Está seguro de eliminar la raza "${getItemName()}"? Esta acción no se puede deshacer.`}
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

export default RazasPage;
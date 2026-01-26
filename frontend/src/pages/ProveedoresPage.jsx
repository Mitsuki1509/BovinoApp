import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProveedorStore } from '../store/proveedorStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Plus, Edit, Trash2, MoreHorizontal, Search, CheckCircle,
  XCircle
 } from 'lucide-react';
import ProveedorForm from '@/components/proveedores/ProveedorForm';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const ProveedoresPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { proveedores, fetchProveedores, deleteProveedor, loading } = useProveedorStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [showForm, setShowForm] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasFetchedProveedores, setHasFetchedProveedores] = useState(false);

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
        (user?.rol === 'admin' || user?.rol === 'contable') && 
        !hasFetchedProveedores) {
      fetchProveedores();
      setHasFetchedProveedores(true);
    }
  }, [authStatus, user, fetchProveedores, hasFetchedProveedores]);

  const handleCreate = useCallback((e) => {
    setEditingProveedor(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((proveedorData) => {
    setEditingProveedor(proveedorData);
    setShowForm(true);
  }, []);

  const handleDeleteClick = useCallback((proveedorItem) => {
    setItemToDelete(proveedorItem);
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      const result = await deleteProveedor(itemToDelete.proveedor_id);
      
      if (result.success) {
        await fetchProveedores();
        
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Eliminado correctamente</span>
            </div>
          ),
          description: "El proveedor se eliminó exitosamente.",
          duration: 3000,
        });
      } else {
        if (result.error?.includes('compras') || result.error?.includes('asociadas')) {
          toast({
            title: (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>Error al eliminar</span>
              </div>
            ),
            description: "No se puede eliminar porque este proveedor tiene compras asociadas.",
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
            description: result.error || "Error desconocido al eliminar el proveedor.",
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
    setEditingProveedor(null);
    fetchProveedores();
    
    toast({
      title: editingProveedor ?
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
      description: editingProveedor 
        ? "El proveedor se actualizó exitosamente." 
        : "El proveedor se creó exitosamente.",
      duration: 3000,
    });
  }, [fetchProveedores, editingProveedor, toast]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingProveedor(null);
  }, []);

  const filteredProveedores = proveedores.filter(proveedorItem => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    return (
      proveedorItem.nombre_compañia?.toLowerCase().includes(searchLower) ||
      proveedorItem.nombre_contacto?.toLowerCase().includes(searchLower) ||
      proveedorItem.telefono_local?.includes(searchTerm) ||
      proveedorItem.telefono_completo?.includes(searchTerm)
    );
  });

  const getItemName = () => {
    if (!itemToDelete) return '';
    return itemToDelete.nombre_compañia || 'Proveedor';
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Proveedores</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra los proveedores del sistema</p>
          </div>
          <Button 
            onClick={handleCreate} 
            className="flex items-center gap-2 w-full sm:w-auto"
            type="button"
            variant="inventario"
          >
            <Plus className="h-4 w-4" />
            Crear Proveedor
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar proveedores por nombre, contacto o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Proveedores</CardTitle>
            <CardDescription>
              {filteredProveedores.length} de {proveedores.length} proveedor(es) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(
              <div className="overflow-x-auto">
                <div className="hidden sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium">Compañía</th>
                        <th className="text-left py-3 font-medium">Contacto</th>
                        <th className="text-left py-3 font-medium">Teléfono</th>
                        <th className="text-left py-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProveedores.map((proveedorItem) => (                        
                        <tr key={proveedorItem.proveedor_id} className="border-b hover:bg-gray-50">
                          <td className="py-3 font-medium">
                            <div className="flex items-center gap-2">
                              {proveedorItem.nombre_compañia}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              {proveedorItem.nombre_contacto}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              {proveedorItem.telefono_completo}
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
                                <DropdownMenuItem onClick={() => handleEdit(proveedorItem)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar proveedor
                                </DropdownMenuItem>
                                {(user.rol === 'admin' ||  user.rol === 'contable') &&(
                                 <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(proveedorItem)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar proveedor
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
                  {filteredProveedores.map((proveedorItem) => (
                    <Card key={proveedorItem.proveedor_id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{proveedorItem.nombre_compañia}</h3>
                            </div>
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">{proveedorItem.nombre_contacto}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">{proveedorItem.telefono_completo}</span>
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
                              <DropdownMenuItem onClick={() => handleEdit(proveedorItem)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar proveedor
                              </DropdownMenuItem>
                              {(user.rol === 'admin' || user.rol === 'contable') && (
                               <DropdownMenuItem 
                                onClick={() => handleDeleteClick(proveedorItem)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar proveedor
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

            {filteredProveedores.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No se encontraron proveedores que coincidan con la búsqueda' : 'No hay proveedores registrados'}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingProveedor ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {editingProveedor 
                  ? 'Actualiza la información del proveedor' 
                  : 'Complete la información para crear un nuevo proveedor'
                }
              </DialogDescription>
            </DialogHeader>
            <ProveedorForm
              proveedor={editingProveedor}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        <Modal
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Eliminar Proveedor"
          description={`¿Está seguro de eliminar el proveedor "${getItemName()}"? Esta acción no se puede deshacer.`}
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

export default ProveedoresPage;
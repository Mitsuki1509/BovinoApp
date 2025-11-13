import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCompraStore } from '@/store/compraStore';
import { useDetalleCompraStore } from '@/store/detalleCompraStore';
import { useProveedorStore } from '@/store/proveedorStore';
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
import { Loader2, Plus, Edit, Trash2, MoreHorizontal, Search, Package, Receipt,
  CheckCircle, XCircle, Calendar, User, DollarSign
 } from 'lucide-react';
import CompraForm from '@/components/compras/CompraForm';
import DetalleCompraForm from '@/components/compras/DetalleCompraForm';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const GestionComprasPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { compras, fetchCompras, deleteCompra, loading: loadingCompras } = useCompraStore();
  const { detalles, fetchDetalles, deleteDetalleCompra, loading: loadingDetalles } = useDetalleCompraStore();
  const { proveedores, fetchProveedores } = useProveedorStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('compras');
  const [showForm, setShowForm] = useState(false);
  const [showDetalleForm, setShowDetalleForm] = useState(false);
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
        console.error('Error verificando autenticación:', error);
        setAuthStatus('unauthenticated');
        navigate('/login', { replace: true });
      }
    };

    verifyAuth();
  }, [checkAuth, navigate]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      const loadData = async () => {
        try {
          await fetchCompras();
          await fetchProveedores();
          if (fetchDetalles) {
            await fetchDetalles();
          }
        } catch (error) {
          console.error('Error cargando datos:', error);
        }
      };
      loadData();
    }
  }, [authStatus, fetchCompras, fetchProveedores, fetchDetalles]);

  const handleCreate = useCallback(() => {
    setEditingItem(null);
    setShowForm(true);
  }, []);

  const handleCreateDetalle = useCallback(() => {
    setShowDetalleForm(true);
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
      let result;
      
      if (type === 'compra') {
        result = await deleteCompra(item.compra_id);
      } else {
        result = await deleteDetalleCompra(item.detalle_id);
      }
            
      if (result?.success) {
        await fetchCompras();
        if (fetchDetalles) {
          await fetchDetalles();
        }
        
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Eliminado correctamente</span>
            </div>
          ),
          description: `El ${type === 'compra' ? 'compra' : 'detalle de compra'} se eliminó exitosamente.`,
          duration: 3000,
        });
      } else {
        const errorMessage = result?.error || 'Error desconocido al eliminar';
        
        if (errorMessage.includes('referencia') || errorMessage.includes('foreign key') || errorMessage.includes('detalles') || errorMessage.includes('asociados')) {
          toast({
            title: (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>No se puede eliminar</span>
              </div>
            ),
            description: `No se puede eliminar la compra porque tiene detalles de compra asociados.`,
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
      console.error('Error eliminando:', error);
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
    fetchCompras();
    
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
        ? `La compra se actualizó exitosamente.` 
        : `La compra se creó exitosamente.`,
      duration: 3000,
    });
  }, [fetchCompras, editingItem, toast]);

  const handleDetalleFormSuccess = useCallback(() => {
    setShowDetalleForm(false);
    // Recargar detalles si la función existe
    if (fetchDetalles) {
      fetchDetalles();
    }
    
    toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>Detalle agregado</span>
        </div>
      ),
      description: `El insumo se agregó exitosamente a la compra.`,
      duration: 3000,
    });
  }, [fetchDetalles, toast]);

  const getItemName = () => {
    if (!itemToDelete) return '';
    return itemToDelete.type === 'compra' 
      ? `${itemToDelete.item.numero_compra} - ${itemToDelete.item.proveedor?.nombre_compañia}`
      : `${itemToDelete.item.insumo?.nombre} (${itemToDelete.item.cantidad} unidades)`;
  };

  const getItemType = () => {
    if (!itemToDelete) return '';
    return itemToDelete.type === 'compra' ? 'compra' : 'detalle de compra';
  };

  const canManage = user?.rol === 'admin' || user?.rol === 'contable';

  const filteredCompras = compras.filter(compra => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return (
      compra.numero_compra?.toLowerCase().includes(searchLower) ||
      compra.proveedor?.nombre_compañia?.toLowerCase().includes(searchLower) ||
      compra.proveedor?.nombre_contacto?.toLowerCase().includes(searchLower)
    );
  });

  const filteredDetalles = (detalles || []).filter(detalle => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return (
      detalle.compra?.numero_compra?.toLowerCase().includes(searchLower) ||
      detalle.insumo?.nombre?.toLowerCase().includes(searchLower) ||
      detalle.insumo?.tipo_insumo?.nombre?.toLowerCase().includes(searchLower) ||
      detalle.compra?.proveedor?.nombre_compañia?.toLowerCase().includes(searchLower)
    );
  });

  const getFormTitle = () => {
    return editingItem ? 'Editar Compra' : 'Crear Nueva Compra';
  };

  const getFormDescription = () => {
    return editingItem 
      ? 'Actualiza la información de la compra' 
      : 'Complete la información para crear una nueva compra';
  };

  const calcularTotalCompra = (compra) => {
    if (!compra.detalle_compras || compra.detalle_compras.length === 0) return 0;
    return compra.detalle_compras.reduce((total, detalle) => {
      return total + (parseFloat(detalle.precio) * detalle.cantidad);
    }, 0);
  };

  const loading = loadingCompras || loadingDetalles;

  return (
    <MainLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Compras</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra compras y sus detalles</p>
          </div>
          <div className="flex gap-2">
            {canManage && activeTab === 'compras' && (
              <Button 
                onClick={handleCreate} 
                className="flex items-center gap-2"
                type="button"
              >
                <Plus className="h-4 w-4" />
                Crear Compra
              </Button>
            )}
            {canManage && activeTab === 'detalles' && (
              <Button 
                onClick={handleCreateDetalle} 
                className="flex items-center gap-2"
                type="button"
              >
                <Plus className="h-4 w-4" />
                Agregar Insumo
              </Button>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={
              activeTab === 'compras' 
                ? "Buscar por número de compra o proveedor..." 
                : "Buscar por número de compra, insumo o proveedor..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compras" className="flex items-center gap-2 text-xs sm:text-sm">
              <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
              Compras ({compras.length})
            </TabsTrigger>
            <TabsTrigger value="detalles" className="flex items-center gap-2 text-xs sm:text-sm">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              Detalles ({(detalles || []).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compras">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Compras</CardTitle>
                <CardDescription>
                  {filteredCompras.length} de {compras.length} compra(s) encontrada(s)
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
                            <th className="text-left py-3 font-medium">N° Compra</th>
                            <th className="text-left py-3 font-medium">Proveedor</th>
                            <th className="text-left py-3 font-medium">Fecha</th>
                            <th className="text-left py-3 font-medium">Total</th>
                            <th className="text-left py-3 font-medium">Detalles</th>
                            {canManage && <th className="text-left py-3 font-medium">Acciones</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCompras.map((compra) => (
                            <tr key={compra.compra_id} className="border-b hover:bg-gray-50">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="font-mono">
                                    {compra.numero_compra}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {compra.proveedor?.nombre_compañia}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <span>
                                    {format(new Date(compra.fecha), "dd/MM/yyyy", { locale: es })}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    ${calcularTotalCompra(compra).toFixed(2)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3">
                                <Badge variant={compra._count?.detalle_compras > 0 ? "default" : "secondary"}>
                                  {compra._count?.detalle_compras || 0} insumos
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
                                      <DropdownMenuItem onClick={() => handleEdit(compra)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDelete(compra, 'compra')}
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
                      {filteredCompras.map((compra) => (
                        <Card key={compra.compra_id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div>
                                    <Badge variant="secondary" className="font-mono">
                                      {compra.numero_compra}
                                    </Badge>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold">{compra.proveedor?.nombre_compañia}</h3>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span>
                                    {format(new Date(compra.fecha), "dd/MM/yyyy", { locale: es })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">
                                    ${calcularTotalCompra(compra).toFixed(2)}
                                  </span>
                                </div>
                                <Badge variant={compra._count?.detalle_compras > 0 ? "default" : "secondary"}>
                                  {compra._count?.detalle_compras || 0} insumos
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
                                  <DropdownMenuItem onClick={() => handleEdit(compra)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(compra, 'compra')}
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

                {filteredCompras.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No se encontraron compras que coincidan con la búsqueda' : 'No hay compras registradas'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detalles">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div>
                    <CardTitle>Todos los Detalles de Compra</CardTitle>
                    <CardDescription>
                      {filteredDetalles.length} de {(detalles || []).length} detalle(s) encontrado(s)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {filteredDetalles.length > 0 ? (
                      <>
                        <div className="hidden sm:block">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 font-medium">N° Compra</th>
                                <th className="text-left py-3 font-medium">Proveedor</th>
                                <th className="text-left py-3 font-medium">Insumo</th>
                                <th className="text-left py-3 font-medium">Precio Unitario</th>
                                <th className="text-left py-3 font-medium">Cantidad</th>
                                <th className="text-left py-3 font-medium">Subtotal</th>
                                {canManage && <th className="text-left py-3 font-medium">Acciones</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredDetalles.map((detalle) => (
                                <tr key={detalle.detalle_id} className="border-b hover:bg-gray-50">
                                  <td className="py-3">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="font-mono">
                                        {detalle.compra?.numero_compra}
                                      </Badge>
                                    </div>
                                  </td>
                                  <td className="py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">
                                        {detalle.compra?.proveedor?.nombre_compañia}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3">
                                    <div className="flex items-center gap-2">
                                      <div>
                                        <span className="font-medium">{detalle.insumo?.nombre}</span>
                                        <div className="text-xs text-gray-500">
                                          {detalle.insumo?.tipo_insumo?.nombre} - {detalle.insumo?.unidad?.nombre}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3">
                                    <span className="font-medium">
                                      ${parseFloat(detalle.precio).toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="py-3">
                                    <Badge variant="outline">
                                      {detalle.cantidad} {detalle.insumo?.unidad?.nombre}
                                    </Badge>
                                  </td>
                                  <td className="py-3">
                                    <span className="font-medium ">
                                      ${(parseFloat(detalle.precio) * detalle.cantidad).toFixed(2)}
                                    </span>
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
                                            onClick={() => handleDelete(detalle, 'detalle')}
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
                          {filteredDetalles.map((detalle) => (
                            <Card key={detalle.detalle_id} className="p-4">
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div>
                                        <Badge variant="secondary" className="font-mono">
                                          {detalle.compra?.numero_compra}
                                        </Badge>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="font-medium text-sm">
                                            {detalle.compra?.proveedor?.nombre_compañia}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <div>
                                        <h3 className="font-semibold">{detalle.insumo?.nombre}</h3>
                                        <div className="text-xs text-gray-500">
                                          {detalle.insumo?.tipo_insumo?.nombre} - {detalle.insumo?.unidad?.nombre}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-600">Precio:</span>
                                        <div className="font-medium">${parseFloat(detalle.precio).toFixed(2)}</div>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Cantidad:</span>
                                        <div>
                                          <Badge variant="outline">
                                            {detalle.cantidad} {detalle.insumo?.unidad?.nombre}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-2">
                                      <span className="text-gray-600">Subtotal:</span>
                                      <div className="font-medium ">
                                        ${(parseFloat(detalle.precio) * detalle.cantidad).toFixed(2)}
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
                                      <DropdownMenuItem 
                                        onClick={() => handleDelete(detalle, 'detalle')}
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
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        {searchTerm ? 'No se encontraron detalles que coincidan con la búsqueda' : 'No hay detalles de compra registrados'}
                      </div>
                    )}
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
            <CompraForm
              compra={editingItem}
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showDetalleForm} onOpenChange={setShowDetalleForm}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Agregar Insumo a Compra</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Seleccione la compra y agregue un insumo
              </DialogDescription>
            </DialogHeader>
            <DetalleCompraForm
              onSuccess={handleDetalleFormSuccess}
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

export default GestionComprasPage;
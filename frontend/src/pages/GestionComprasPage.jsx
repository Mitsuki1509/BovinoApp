import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCompraInsumoStore } from '@/store/compraInsumoStore';
import { useCompraAnimalStore } from '@/store/compraAnimalStore';
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
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Search, 
  Package
} from 'lucide-react';
import { FaCow } from 'react-icons/fa6';

import CompraInsumoForm from '@/components/compras/CompraInsumoForm';
import CompraAnimalForm from '@/components/compras/CompraAnimalForm';
import DetalleInsumo from "@/components/compras/DetalleInsumo";
import DetalleAnimal from "@/components/compras/DetalleAnimal";
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const GestionComprasPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { comprasInsumos, fetchComprasInsumos, deleteCompraInsumo, loading: loadingComprasInsumos } = useCompraInsumoStore();
  const { comprasAnimales, fetchComprasAnimales, deleteCompraAnimal, loading: loadingComprasAnimales } = useCompraAnimalStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('insumos');
  const [showInsumoForm, setShowInsumoForm] = useState(false);
  const [showAnimalForm, setShowAnimalForm] = useState(false);
  const [showInsumoDetail, setShowInsumoDetail] = useState(false);
  const [showAnimalDetail, setShowAnimalDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
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
          fetchComprasInsumos();
          fetchComprasAnimales();
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
  }, [checkAuth, navigate, fetchComprasInsumos, fetchComprasAnimales]);

  const handleCreateInsumo = () => setShowInsumoForm(true);
  const handleCreateAnimal = () => setShowAnimalForm(true);

  const handleViewDetail = (item, type) => {
    setSelectedItem(item);
    type === 'insumo' ? setShowInsumoDetail(true) : setShowAnimalDetail(true);
  };

  const handleDelete = (item, type) => {
    setItemToDelete({ item, type });
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      const { item, type } = itemToDelete;
      const result = type === 'insumo' 
        ? await deleteCompraInsumo(item.compra_insumo_id)
        : await deleteCompraAnimal(item.compra_animal_id);
            
      if (result?.success) {
        fetchComprasInsumos();
        fetchComprasAnimales();
        toast({
          title: "Eliminado correctamente",
          description: `La compra de ${type === 'insumo' ? 'insumos' : 'animales'} se eliminó exitosamente.`,
          variant: "default",
        });
      } else {
        const errorMessage = result?.error || 'Error desconocido al eliminar';
        toast({
          title: "Error al eliminar",
          description: errorMessage.includes('referencia') || errorMessage.includes('foreign key') 
            ? 'No se puede eliminar la compra porque tiene detalles asociados.'
            : `Error: ${errorMessage}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "Por favor, intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
      setShowConfirm(false);
    }
  };

  const handleFormSuccess = (type) => {
    type === 'insumo' ? setShowInsumoForm(false) : setShowAnimalForm(false);
    type === 'insumo' ? fetchComprasInsumos() : fetchComprasAnimales();
    toast({
      title: "Creado correctamente",
      description: `La compra de ${type} se creó exitosamente.`,
      variant: "default",
    });
  };

  const formatDateWithoutTZ = (dateString) => {
    try {
      if (!dateString) return 'Fecha inválida';
      const [year, month, day] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleDateString('es-ES');
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const canManage = user?.rol === 'admin' || user?.rol === 'contable';

  const filteredComprasInsumos = comprasInsumos.filter(compra => 
    !searchTerm.trim() || 
    compra.numero_compra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    compra.proveedor?.nombre_compañia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredComprasAnimales = comprasAnimales.filter(compra =>
    !searchTerm.trim() ||
    compra.numero_compra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    compra.proveedor?.nombre_compañia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loading = loadingComprasInsumos || loadingComprasAnimales;

  return (
    <MainLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Compras</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra compras de insumos y animales</p>
          </div>
          <div className="flex gap-2">
            {canManage && activeTab === 'insumos' && (
              <Button onClick={handleCreateInsumo} className="flex items-center gap-2" variant="inventario">
                <Plus className="h-4 w-4" />Comprar Insumos
              </Button>
            )}
            {canManage && activeTab === 'animales' && (
              <Button onClick={handleCreateAnimal} className="flex items-center gap-2" variant="inventario">
                <Plus className="h-4 w-4" />Comprar Animales
              </Button>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={activeTab === 'insumos' ? "Buscar compras de insumos..." : "Buscar compras de animales..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="insumos" className="flex items-center gap-2 text-xs sm:text-sm">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />Insumos ({comprasInsumos.length})
            </TabsTrigger>
            <TabsTrigger value="animales" className="flex items-center gap-2 text-xs sm:text-sm">
              <FaCow className="h-3 w-3 sm:h-4 sm:w-4" />Animales ({comprasAnimales.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insumos">
            <Card>
              <CardHeader>
                <CardTitle>Compras de Insumos</CardTitle>
                <CardDescription>{filteredComprasInsumos.length} de {comprasInsumos.length} compra(s) encontrada(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="hidden sm:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 font-medium">Número</th>
                          <th className="text-left py-3 font-medium">Proveedor</th>
                          <th className="text-left py-3 font-medium">Fecha</th>
                          <th className="text-left py-3 font-medium">Total</th>
                          <th className="text-left py-3 font-medium">Insumos</th>
                          {canManage && <th className="text-left py-3 font-medium">Acciones</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredComprasInsumos.map((compra) => (                        
                          <tr key={compra.compra_insumo_id} className="border-b hover:bg-gray-50">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-mono">
                                  {compra.numero_compra}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                {compra.proveedor?.nombre_compañia}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                {formatDateWithoutTZ(compra.fecha)}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">C${compra.total?.toFixed(2) || '0.00'}</span>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {compra.detalles?.length || 0} insumo(s)
                                </Badge>
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
                                    <DropdownMenuItem onClick={() => handleViewDetail(compra, 'insumo')}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Ver Detalle
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(compra, 'insumo')}
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
                    {filteredComprasInsumos.map((compra) => (
                      <Card key={compra.compra_insumo_id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="font-mono">
                                  {compra.numero_compra}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-600">{compra.proveedor?.nombre_compañia}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-600">{formatDateWithoutTZ(compra.fecha)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">C${compra.total?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline">
                                    {compra.detalles?.length || 0} insumo(s)
                                  </Badge>
                                </div>
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
                                  <DropdownMenuItem onClick={() => handleViewDetail(compra, 'insumo')}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Ver Detalle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(compra, 'insumo')}
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
                {filteredComprasInsumos.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No se encontraron compras que coincidan con la búsqueda' : 'No hay compras de insumos registradas'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="animales">
            <Card>
              <CardHeader>
                <CardTitle>Compras de Animales</CardTitle>
                <CardDescription>{filteredComprasAnimales.length} de {comprasAnimales.length} compra(s) encontrada(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="hidden sm:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 font-medium">Número</th>
                          <th className="text-left py-3 font-medium">Proveedor</th>
                          <th className="text-left py-3 font-medium">Fecha</th>
                          <th className="text-left py-3 font-medium">Total</th>
                          <th className="text-left py-3 font-medium">Animales</th>
                          {canManage && <th className="text-left py-3 font-medium">Acciones</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredComprasAnimales.map((compra) => (                        
                          <tr key={compra.compra_animal_id} className="border-b hover:bg-gray-50">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-mono">
                                  {compra.numero_compra}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                {compra.proveedor?.nombre_compañia}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                {formatDateWithoutTZ(compra.fecha)}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">C${compra.total?.toFixed(2) || '0.00'}</span>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {compra.detalles?.length || 0} animal(es)
                                </Badge>
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
                                    <DropdownMenuItem onClick={() => handleViewDetail(compra, 'animal')}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Ver Detalle
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(compra, 'animal')}
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
                    {filteredComprasAnimales.map((compra) => (
                      <Card key={compra.compra_animal_id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="font-mono">
                                  {compra.numero_compra}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-600">{compra.proveedor?.nombre_compañia}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-600">{formatDateWithoutTZ(compra.fecha)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">C${compra.total?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline">
                                    {compra.detalles?.length || 0} animal(es)
                                  </Badge>
                                </div>
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
                                  <DropdownMenuItem onClick={() => handleViewDetail(compra, 'animal')}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Ver Detalle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(compra, 'animal')}
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
                {filteredComprasAnimales.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No se encontraron compras que coincidan con la búsqueda' : 'No hay compras de animales registradas'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showInsumoForm} onOpenChange={setShowInsumoForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Comprar Insumos</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Complete la información para registrar una nueva compra de insumos
              </DialogDescription>
            </DialogHeader>
            <CompraInsumoForm onSuccess={() => handleFormSuccess('insumos')} />
          </DialogContent>
        </Dialog>

        <Dialog open={showAnimalForm} onOpenChange={setShowAnimalForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Comprar Animales</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Complete la información para registrar una nueva compra de animales
              </DialogDescription>
            </DialogHeader>
            <CompraAnimalForm onSuccess={() => handleFormSuccess('animales')} />
          </DialogContent>
        </Dialog>

        <Dialog open={showInsumoDetail} onOpenChange={setShowInsumoDetail}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DetalleInsumo compra={selectedItem} />
          </DialogContent>
        </Dialog>

        <Dialog open={showAnimalDetail} onOpenChange={setShowAnimalDetail}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DetalleAnimal compra={selectedItem} />
          </DialogContent>
        </Dialog>

        <Modal
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title={`Eliminar ${itemToDelete?.type === 'insumo' ? 'compra de insumos' : 'compra de animales'}`}
          description={`¿Está seguro de eliminar "${itemToDelete?.item?.numero_compra} - ${itemToDelete?.item?.proveedor?.nombre_compañia}"?`}
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
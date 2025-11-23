import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useDiagnosticoStore } from '../store/diagnosticoStore';
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
import { Plus, Edit, Trash2, Shield, MoreHorizontal, Search, Loader2, CheckCircle,
  XCircle, Calendar, Stethoscope
 } from 'lucide-react';
import DiagnosticoForm from '@/components/diagnosticos/DiagnosticoForm';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DiagnosticosPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { diagnosticos, fetchDiagnosticos, deleteDiagnostico, loading } = useDiagnosticoStore();
  const { fetchMontas } = useMontaStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [showForm, setShowForm] = useState(false);
  const [editingDiagnostico, setEditingDiagnostico] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasFetchedData, setHasFetchedData] = useState(false);

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
      fetchDiagnosticos();
      fetchMontas(); 
      setHasFetchedData(true);
    }
  }, [authStatus, user, fetchDiagnosticos, fetchMontas, hasFetchedData]);

  const handleCreate = useCallback(() => {
    setEditingDiagnostico(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((diagnosticoData) => {
    setEditingDiagnostico(diagnosticoData);
    setShowForm(true);
  }, []);

  const handleDeleteClick = useCallback((diagnosticoItem) => {
    setItemToDelete(diagnosticoItem);
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      const result = await deleteDiagnostico(itemToDelete.prenez_id);
      
      if (result.success) {
        await fetchDiagnosticos();
        
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Eliminado correctamente</span>
            </div>
          ),
          description: "El diagnóstico se eliminó exitosamente.",
          duration: 3000,
        });
      } else {
        if (result.error?.includes('partos') || result.error?.includes('asociados')) {
          toast({
            title: (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>Error al eliminar</span>
              </div>
            ),
            description: "No se puede eliminar porque este diagnóstico tiene partos asociados.",
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
            description: result.error || "Error desconocido al eliminar el diagnóstico.",
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
    setEditingDiagnostico(null);
    fetchDiagnosticos();
    
    toast({
      title: editingDiagnostico ?
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
      description: editingDiagnostico 
        ? "El diagnóstico se actualizó exitosamente." 
        : "El diagnóstico se creó exitosamente.",
      duration: 3000,
    });
  }, [fetchDiagnosticos, editingDiagnostico, toast]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingDiagnostico(null);
  }, []);

  const formatearNumeroMonta = (numeroMonta) => {
    if (!numeroMonta) return 'N/A';
    
    if (typeof numeroMonta === 'number') {
      return `MONTA-${numeroMonta.toString()}`;
    }
    
    return numeroMonta;
  };

  const filteredDiagnosticos = diagnosticos.filter(diagnosticoItem => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase().trim();
    const numeroMontaFormateado = formatearNumeroMonta(diagnosticoItem.monta?.numero_monta);
    
    return (
      diagnosticoItem.metodo?.toLowerCase().includes(searchLower) ||
      diagnosticoItem.monta?.hembra?.arete?.toLowerCase().includes(searchLower) ||
      diagnosticoItem.monta?.macho?.arete?.toLowerCase().includes(searchLower) ||
      numeroMontaFormateado.toLowerCase().includes(searchLower) ||
      (diagnosticoItem.resultado ? 'positivo' : 'negativo').includes(searchLower)
    );
  });

  
  const getItemName = () => {
    if (!itemToDelete) return '';
    
    const numeroMonta = itemToDelete.monta?.numero_monta;
    const numeroMontaFormateado = formatearNumeroMonta(numeroMonta);
    
    return `Diagnóstico de la ${numeroMontaFormateado}`;
  };
  const getResultadoBadge = (resultado) => {
    return resultado ? 
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        Positivo
      </Badge> :
      <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
        Negativo
      </Badge>;
  };

  const formatDateSafe = (dateString) => {
    try {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        
        const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        
        return format(adjustedDate, "dd/MM/yyyy", { locale: es });
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return 'N/A';
    }
};

  return (
    <MainLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Diagnósticos</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra los diagnósticos de preñez del sistema</p>
          </div>
          {(user?.rol === 'admin' || user?.rol === 'veterinario') && (
            <Button 
              onClick={handleCreate} 
              className="flex items-center gap-2 w-full sm:w-auto"
              type="button"
              variant="reproduccion"
            >
              <Plus className="h-4 w-4" />
              Nuevo Diagnóstico
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar diagnósticos por método, arete de animales, número de monta o resultado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Diagnósticos</CardTitle>
            <CardDescription>
              {filteredDiagnosticos.length} de {diagnosticos.length} diagnóstico(s) encontrado(s)
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
                        <th className="text-left py-3 font-medium">Macho</th>
                        <th className="text-left py-3 font-medium">Método</th>
                        <th className="text-left py-3 font-medium">Resultado</th>
                        <th className="text-left py-3 font-medium">Fecha Parto Probable</th>
                        <th className="text-left py-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDiagnosticos.map((diagnosticoItem) => (                        
                        <tr key={diagnosticoItem.prenez_id} className="border-b hover:bg-gray-50">
                          
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono">
                                {formatearNumeroMonta(diagnosticoItem.monta?.numero_monta)}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono">
                                {diagnosticoItem.monta?.hembra?.arete || 'N/A'}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono">
                                {diagnosticoItem.monta?.macho?.arete || 'N/A'}

                              </Badge>
                            </div>
                          </td>
                          <td className="py-3">
                            {diagnosticoItem.metodo || 'N/A'}
                          </td>
                          <td className="py-3">
                            {getResultadoBadge(diagnosticoItem.resultado)}
                          </td>
                          <td className="py-3">
                            {diagnosticoItem.fecha_probable_parto ? (
                              <div className="flex items-center gap-2">
                                <span>
                                    {formatDateSafe(diagnosticoItem.fecha_probable_parto)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
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
                               
                                {(user.rol === 'admin' || user.rol === 'veterinario')&& (
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(diagnosticoItem)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar diagnóstico
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
                  {filteredDiagnosticos.map((diagnosticoItem) => (
                    <Card key={diagnosticoItem.prenez_id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                       
                              {getResultadoBadge(diagnosticoItem.resultado)}
                            </div>
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {formatearNumeroMonta(diagnosticoItem.monta?.numero_monta)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{diagnosticoItem.metodo || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Hembra: {diagnosticoItem.monta?.hembra?.arete }</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Macho: {diagnosticoItem.monta?.macho?.arete || 'N/A'}</span>
                              </div>
                              {diagnosticoItem.fecha_probable_parto && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-600">
                                    Parto: {formatDateSafe(diagnosticoItem.fecha_probable_parto)}s
                                  </span>
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
                            
                              {(user.rol === 'admin' || user.rol === 'veterinario') &&(
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(diagnosticoItem)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar diagnóstico
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

            {filteredDiagnosticos.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No se encontraron diagnósticos que coincidan con la búsqueda' : 'No hay diagnósticos registrados'}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingDiagnostico ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico de Preñez'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {editingDiagnostico 
                  ? 'Actualiza la información del diagnóstico' 
                  : 'Complete la información para crear un nuevo diagnóstico de preñez'
                }
              </DialogDescription>
            </DialogHeader>
            <DiagnosticoForm
              diagnostico={editingDiagnostico}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        <Modal
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Eliminar Diagnóstico"
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

export default DiagnosticosPage;
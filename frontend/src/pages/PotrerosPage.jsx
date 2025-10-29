import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePotreroStore } from '@/store/potreroStore';
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
import { Loader2, Plus, Edit, Trash2, Shield, MoreHorizontal, Search, MapPin } from 'lucide-react';
import PotreroForm from '@/components/potreros/PotreroForm';

const PotrerosPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { potreros, fetchPotreros, deletePotrero, loading } = usePotreroStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [showForm, setShowForm] = useState(false);
  const [editingPotrero, setEditingPotrero] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasFetchedPotreros, setHasFetchedPotreros] = useState(false);

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
    if (authStatus === 'authenticated' && !hasFetchedPotreros) {
      console.log('Cargando potreros...');
      fetchPotreros();
      setHasFetchedPotreros(true);
    }
  }, [authStatus, fetchPotreros, hasFetchedPotreros]);

  const handleCreate = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingPotrero(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((potreroData) => {
    setEditingPotrero(potreroData);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (potreroId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este potrero?')) {
      const result = await deletePotrero(potreroId);
      if (result.success) {
        await fetchPotreros();
      } else {
        console.error('Error al eliminar potrero:', result.error);
        alert('Error al eliminar potrero: ' + result.error);
      }
    }
  }, [deletePotrero, fetchPotreros]);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditingPotrero(null);
    fetchPotreros();
  }, [fetchPotreros]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingPotrero(null);
  }, []);

  const canManagePotreros = user?.rol === 'admin' || user?.rol === 'operario';

  const filteredPotreros = potreros.filter(potrero => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return potrero.ubicacion?.toLowerCase().includes(searchLower);
  });

  
  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Potreros</h1>
            <p className="text-gray-600">Administra los potreros de la finca</p>
          </div>
          {canManagePotreros && (
            <Button 
              onClick={handleCreate} 
              className="flex items-center gap-2"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Crear Potrero
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar potreros por ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium">Ubicación</th>
                      {canManagePotreros }
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPotreros.map((potrero) => (
                      <tr key={potrero.potrero_id} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{potrero.ubicacion}</span>
                          </div>
                        </td>
                        {canManagePotreros && (
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
                                  Editar potrero
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(potrero.potrero_id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar potrero
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
            )}

            {filteredPotreros.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No se encontraron potreros que coincidan con la búsqueda' : 'No hay potreros registrados'}
              </div>
            )}
          </CardContent>
        </Card>

        {!canManagePotreros && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-blue-700">
                <Shield className="h-5 w-5" />
                <div>
                  <p className="font-medium">Modo de solo lectura</p>
                  <p className="text-sm text-blue-600">
                    Tu rol ({user.rol}) solo te permite ver los potreros. Para gestionarlos contacta a un administrador.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPotrero ? 'Editar Potrero' : 'Crear Nuevo Potrero'}
              </DialogTitle>
              <DialogDescription>
                {editingPotrero 
                  ? 'Actualiza la información del potrero' 
                  : 'Complete la información para crear un nuevo potrero'
                }
              </DialogDescription>
            </DialogHeader>
            <PotreroForm
              potrero={editingPotrero}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default PotrerosPage;
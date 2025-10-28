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
import { Loader2, Plus, Edit, Trash2, Shield, MoreHorizontal, Search, FolderTree } from 'lucide-react';
import TypeForm from '@/components/types/TypeForm';

const TypesPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { eventTypes, fetchEventTypes, deleteEventType, loading, fetchParentEventTypes } = useTypeStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasFetchedTypes, setHasFetchedTypes] = useState(false);

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

  const handleDelete = useCallback(async (typeId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este tipo de evento?')) {
      const result = await deleteEventType(typeId);
      if (result.success) {
        await fetchEventTypes();
        await fetchParentEventTypes();
      } else {
        console.error('Error al eliminar tipo de evento:', result.error);
        alert('Error al eliminar tipo de evento: ' + result.error);
      }
    }
  }, [deleteEventType, fetchEventTypes, fetchParentEventTypes]);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditingType(null);
    fetchEventTypes();
    fetchParentEventTypes();
  }, [fetchEventTypes, fetchParentEventTypes]);

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

 

  if (user.rol !== 'admin' && user.rol !== 'veterinario') {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
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
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Tipos de Evento</h1>
            <p className="text-gray-600">Administra los tipos y categorías de eventos del sistema</p>
          </div>
          <Button 
            onClick={handleCreate} 
            className="flex items-center gap-2"
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
            className="pl-10"
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
            {(
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium">Nombre</th>
                      <th className="text-left py-3 font-medium">Tipo Evento</th>
                      <th className="text-left py-3 font-medium">Sub-eventos</th>
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
                                  onClick={() => handleDelete(typeItem.tipo_evento_id)}
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
            )}

            {filteredTypes.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No se encontraron tipos que coincidan con la búsqueda' : 'No hay tipos de evento registrados'}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Editar Tipo de Evento' : 'Crear Nuevo Tipo de Evento'}
              </DialogTitle>
              <DialogDescription>
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
      </div>
    </MainLayout>
  );
};

export default TypesPage;
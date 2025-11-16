import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUserAdminStore } from '../store/userAdminStore';
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
  XCircle
 } from 'lucide-react';
import UserForm from '@/components/users/UserForm';
import Modal from '@/components/ui/modal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const UsersPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { users, fetchUsers, deleteUser, loading, roles, fetchRoles } = useUserAdminStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasFetchedUsers, setHasFetchedUsers] = useState(false);

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
    if (authStatus === 'authenticated' && user?.rol === 'admin' && !hasFetchedUsers) {
      fetchUsers();
      fetchRoles();
      setHasFetchedUsers(true);
    }
  }, [authStatus, user, fetchUsers, fetchRoles, hasFetchedUsers]);

  const handleCreate = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingUser(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((userData) => {
    setEditingUser(userData);
    setShowForm(true);
  }, []);

  const handleDeleteClick = useCallback((userItem) => {
    setItemToDelete(userItem);
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      const result = await deleteUser(itemToDelete.usuario_id);
      
      if (result.success) {
        await fetchUsers();
        
        toast({
          title: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>Eliminado correctamente</span>
        </div>
      ),
          description: "El usuario se eliminó exitosamente.",
          duration: 3000,
        });
      } else {
        toast({
          title:  (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>Error al eliminar</span>
              </div>
            ),
          description: result.error || "Error desconocido al eliminar el usuario.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title:  (
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
    setEditingUser(null);
    fetchUsers();
    
    toast({
      title: editingUser ?  (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>Actualizado correctamente</span>
        </div>
      )
       :  (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>Creado correctamente</span>
        </div>
      ),
      description: editingUser 
        ? "El usuario se actualizó exitosamente." 
        : "El usuario se creó exitosamente.",
      duration: 3000,
    });
  }, [fetchUsers, editingUser, toast]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingUser(null);
  }, []);

  const getRolNombre = useCallback((userItem) => {
    if (userItem.rol && userItem.rol.nombre) {
      return userItem.rol.nombre;
    }
    
    if (userItem.rol_id && roles && roles.length > 0) {
      const rolEncontrado = roles.find(rol => rol.rol_id === userItem.rol_id);
      return rolEncontrado?.nombre || 'Sin rol';
    }
    
    return 'Sin rol';
  }, [roles]);

  const filteredUsers = users.filter(userItem => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase().trim();
    const rolNombre = getRolNombre(userItem).toLowerCase();
    
    return (
      userItem.nombre?.toLowerCase().includes(searchLower) ||
      userItem.correo?.toLowerCase().includes(searchLower) ||
      rolNombre.includes(searchLower)
    );
  });

  const getItemName = () => {
    if (!itemToDelete) return '';
    return itemToDelete.nombre || itemToDelete.correo || 'Usuario';
  };

  if (user.rol !== 'admin') {
    return (
      <MainLayout>
        <div className="container mx-auto p-4 sm:p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold">Acceso Restringido</h3>
                <p className="text-gray-500 mt-2">
                  No tienes permisos para acceder a la gestión de usuarios.
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
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Usuarios</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra los usuarios del sistema</p>
          </div>
          <Button 
            onClick={handleCreate} 
            className="flex items-center gap-2 w-full sm:w-auto"
            type="button"
            variant="finca"
          >
            <Plus className="h-4 w-4" />
            Crear Usuario
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar usuarios por nombre, correo o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              {filteredUsers.length} de {users.length} usuario(s) encontrado(s)
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
                        <th className="text-left py-3 font-medium">Correo</th>
                        <th className="text-left py-3 font-medium">Rol</th>
                        <th className="text-left py-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((userItem) => {
                        const rolNombre = getRolNombre(userItem);
                        const isCurrentUser = userItem.usuario_id === user?.usuario_id;
                        
                        return (
                          <tr key={userItem.usuario_id} className="border-b hover:bg-gray-50">
                            <td className="py-3 font-medium">{userItem.nombre}</td>
                            <td className="py-3">{userItem.correo}</td>
                            <td className="py-3">
                              <Badge variant={rolNombre === 'admin' ? 'finca' : 'secondary'}>
                                {rolNombre}
                              </Badge>
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
                                  <DropdownMenuItem onClick={() => handleEdit(userItem)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar usuario
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(userItem)}
                                    disabled={isCurrentUser}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {isCurrentUser ? 'No puedes eliminarte' : 'Eliminar usuario'}
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
                  {filteredUsers.map((userItem) => {
                    const rolNombre = getRolNombre(userItem);
                    const isCurrentUser = userItem.usuario_id === user?.usuario_id;
                    
                    return (
                      <Card key={userItem.usuario_id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{userItem.nombre}</h3>
                              <p className="text-gray-600 text-sm">{userItem.correo}</p>
                              <Badge 
                                variant={rolNombre === 'admin' ? 'finca' : 'secondary'}
                                className="mt-1"
                              >
                                {rolNombre}
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
                                <DropdownMenuItem onClick={() => handleEdit(userItem)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar usuario
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(userItem)}
                                  disabled={isCurrentUser}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {isCurrentUser ? 'No puedes eliminarte' : 'Eliminar usuario'}
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

            {filteredUsers.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {editingUser 
                  ? 'Actualiza la información del usuario' 
                  : 'Complete la información para crear un nuevo usuario'
                }
              </DialogDescription>
            </DialogHeader>
            <UserForm
              user={editingUser}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        <Modal
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Eliminar Usuario"
          description={`¿Está seguro de eliminar al usuario "${getItemName()}"? Esta acción no se puede deshacer.`}
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

export default UsersPage;
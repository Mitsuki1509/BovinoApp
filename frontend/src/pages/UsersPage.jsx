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
import { Loader2, Plus, Edit, Trash2, Shield, MoreHorizontal, Search } from 'lucide-react';
import UserForm from '@/components/users/UserForm';

const UsersPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { users, fetchUsers, deleteUser, loading, roles, fetchRoles } = useUserAdminStore(); // 🔥 Agregar fetchRoles aquí
  const [authStatus, setAuthStatus] = useState('checking');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasFetchedUsers, setHasFetchedUsers] = useState(false);

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
      console.log('Cargando usuarios y roles...');
      fetchUsers();
      fetchRoles(); 
      setHasFetchedUsers(true);
    }
  }, [authStatus, user, fetchUsers, fetchRoles, hasFetchedUsers]); // 🔥 Agregar fetchRoles aquí

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

  const handleDelete = useCallback(async (userId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      const result = await deleteUser(userId);
      if (result.success) {
        await fetchUsers();
      } else {
        console.error('Error al eliminar usuario:', result.error);
        alert('Error al eliminar usuario: ' + result.error);
      }
    }
  }, [deleteUser, fetchUsers]);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditingUser(null);
    fetchUsers();
  }, [fetchUsers]);

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

  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated' || !user) {
    return null;
  }

  if (user.rol !== 'admin') {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
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
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            <p className="text-gray-600">Administra los usuarios del sistema</p>
          </div>
          <Button 
            onClick={handleCreate} 
            className="flex items-center gap-2"
            type="button"
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
            className="pl-10"
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
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium">Nombre</th>
                      <th className="text-left py-3 font-medium">Correo</th>
                      <th className="text-left py-3 font-medium">Rol</th>
                    
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((userItem) => {
                      const rolNombre = getRolNombre(userItem);
                      return (
                        <tr key={userItem.usuario_id} className="border-b hover:bg-gray-50">
                          <td className="py-3 font-medium">{userItem.nombre}</td>
                          <td className="py-3">{userItem.correo}</td>
                          <td className="py-3">
                            <Badge variant={rolNombre === 'admin' ? 'default' : 'secondary'}>
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
                                  onClick={() => handleDelete(userItem.usuario_id)}
                                  disabled={userItem.usuario_id === user?.usuario_id}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar usuario
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

            {filteredUsers.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </DialogTitle>
              <DialogDescription>
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
      </div>
    </MainLayout>
  );
};

export default UsersPage;
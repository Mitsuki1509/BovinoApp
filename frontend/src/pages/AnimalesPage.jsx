import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAnimalStore } from '../store/animalStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AnimalCard from '@/components/animales/AnimalCard';
import AnimalDetails from '@/components/animales/AnimalDetails';
import AnimalForm from '@/components/animales/AnimalForm';
import Modal from '@/components/ui/modal'; 
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Search, Plus, Loader2 } from 'lucide-react';
import { FaCow } from 'react-icons/fa6';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AnimalesPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const { animales, fetchAnimales, deleteAnimal, loading } = useAnimalStore(); 
  const [authStatus, setAuthStatus] = useState('checking');
  const [busqueda, setBusqueda] = useState('');
  const [filtroSexo, setFiltroSexo] = useState('todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const [animalesPorPagina] = useState(8);
  
  const [showForm, setShowForm] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  
  const [vistaDetalle, setVistaDetalle] = useState(false);
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [animalToDelete, setAnimalToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const isAuthenticated = await checkAuth();
        if (isAuthenticated) {
          setAuthStatus('authenticated');
          fetchAnimales();
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
  }, [checkAuth, navigate, fetchAnimales]);

  const canManage = ['admin', 'veterinario', 'operario', 'contable'].includes(user?.rol);

  const handleCreate = useCallback((e) => {
    setEditingAnimal(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((animalData) => {
    setEditingAnimal(animalData);
    setShowForm(true);
    setVistaDetalle(false);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditingAnimal(null);
    fetchAnimales();
    
    toast({
      title: editingAnimal ? "Animal actualizado" : "Animal creado",
      description: editingAnimal 
        ? "El animal se actualizó exitosamente." 
        : "El animal se creó exitosamente.",
      variant: "default",
    });
  }, [fetchAnimales, editingAnimal, toast]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingAnimal(null);
  }, []);

  const verDetalles = useCallback((animal) => {
    setAnimalSeleccionado(animal);
    setVistaDetalle(true);
  }, []);

  const cerrarDetalles = useCallback(() => {
    setVistaDetalle(false);
    setAnimalSeleccionado(null);
  }, []);

  const handleDeleteClick = useCallback((animal) => {
    setAnimalToDelete(animal);
    setShowDeleteModal(true);
    setVistaDetalle(false);
  }, []);

  const handleConfirmDelete = async () => {
    if (!animalToDelete) return;
    
    setDeleteLoading(true);
    try {
      await deleteAnimal(animalToDelete.animal_id);
      
      await fetchAnimales();
      
      setShowDeleteModal(false);
      setAnimalToDelete(null);
      
      toast({
        title: "Animal eliminado",
        description: "El animal se eliminó exitosamente.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error al eliminar animal:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el animal.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const animalesFiltrados = animales.filter(animal => {
    const coincideBusqueda =
      (animal.arete || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (animal.raza?.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (animal.lote?.descripcion || "").toLowerCase().includes(busqueda.toLowerCase());
    const coincideSexo = filtroSexo === 'todos' || animal.sexo === filtroSexo;
    return coincideBusqueda && coincideSexo;
  });

  const indiceUltimoAnimal = paginaActual * animalesPorPagina;
  const indicePrimerAnimal = indiceUltimoAnimal - animalesPorPagina;
  const animalesActuales = animalesFiltrados.slice(indicePrimerAnimal, indiceUltimoAnimal);
  const totalPaginas = Math.ceil(animalesFiltrados.length / animalesPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
    window.scrollTo(0, 0);
  };

  const totalAnimales = animales.length;
  const totalMachos = animales.filter(a => a.sexo === 'M').length;
  const totalHembras = animales.filter(a => a.sexo === 'H').length;

  return (
    <MainLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Animales</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra el inventario de animales del sistema</p>
          </div>
          {canManage && (
            <Button 
              onClick={handleCreate} 
              className="flex items-center gap-2 w-full sm:w-auto"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Crear Animal
            </Button>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Animales</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAnimales}</p>
                </div>
                <FaCow className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Machos</p>
                  <p className="text-2xl font-bold text-gray-900">{totalMachos}</p>
                </div>
                <FaCow className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hembras</p>
                  <p className="text-2xl font-bold text-gray-900">{totalHembras}</p>
                </div>
                <FaCow className="h-8 w-8 text-pink-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Búsqueda */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="busqueda" className="block text-sm mb-1">
                  Buscar animal
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    id="busqueda"
                    placeholder="Buscar por arete, raza o lote..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10"
                  />
                </div>
              </div>

              <div className="w-full md:w-48">
                <Label htmlFor="filtro-sexo" className="text-sm mb-2">
                  Filtrar por sexo
                </Label>
                <Select value={filtroSexo} onValueChange={setFiltroSexo}>
                  <SelectTrigger id="filtro-sexo" className="w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="M">Machos</SelectItem>
                    <SelectItem value="H">Hembras</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Animales</CardTitle>
            <CardDescription>
              {animalesFiltrados.length} de {animales.length} animal(es) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {animalesFiltrados.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {animalesActuales.map(animal => (
                    <AnimalCard
                      key={animal.animal_id}
                      animal={animal}
                      onVerDetalles={verDetalles}
                      onEditar={handleEdit}
                      onEliminar={handleDeleteClick}
                      canManage={canManage}
                    />
                  ))}
                </div>

                {totalPaginas > 1 && (
                  <div className="flex justify-center items-center space-x-2">
                    <button
                      onClick={() => cambiarPagina(paginaActual - 1)}
                      disabled={paginaActual === 1}
                      className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Anterior
                    </button>

                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(numero => (
                      <button
                        key={numero}
                        onClick={() => cambiarPagina(numero)}
                        className={`px-3 py-1 rounded-lg ${paginaActual === numero ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                      >
                        {numero}
                      </button>
                    ))}

                    <button
                      onClick={() => cambiarPagina(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                      className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <FaCow className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {busqueda ? 'No se encontraron animales' : 'No hay animales registrados'}
                </h3>
                <p className="text-gray-500">
                  {busqueda 
                    ? 'Intenta con otros términos de búsqueda' 
                    : 'Comienza agregando el primer animal al sistema'
                  }
                </p>
                {canManage && !busqueda && (
                  <Button onClick={handleCreate} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Animal
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingAnimal ? 'Editar Animal' : 'Crear Nuevo Animal'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {editingAnimal 
                  ? 'Actualiza la información del animal' 
                  : 'Complete la información para crear un nuevo animal'
                }
              </DialogDescription>
            </DialogHeader>
            <AnimalForm
              animal={editingAnimal}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={vistaDetalle} onOpenChange={cerrarDetalles}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Detalles del Animal</DialogTitle>
              <DialogDescription>
                Información completa del animal seleccionado
              </DialogDescription>
            </DialogHeader>
            <AnimalDetails
              animal={animalSeleccionado}
              onCerrar={cerrarDetalles}
              onEditar={handleEdit}
              onEliminar={handleDeleteClick}
              canManage={canManage}
            />
          </DialogContent>
        </Dialog>

        <Modal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          title="Eliminar Animal"
          description={`¿Está seguro de eliminar el animal "${animalToDelete?.arete}"? Esta acción no se puede deshacer.`}
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

export default AnimalesPage;
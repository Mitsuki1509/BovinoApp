import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useProduccionCarneStore } from '@/store/produccionCarneStore';
import { useAnimalStore } from '@/store/animalStore';
import { useMataderoStore } from '@/store/mataderoStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const ProduccionCarneForm = ({ 
  produccion = null, 
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [unidades, setUnidades] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const { 
    createProduccion, 
    updateProduccion,
    fetchUnidades
  } = useProduccionCarneStore();

  const { animales, fetchAnimales } = useAnimalStore();
  const { mataderos, fetchMataderos } = useMataderoStore();

  const form = useForm({
    defaultValues: {
      animal_id: '',
      matadero_id: '',
      unidad_id: '',
      peso_canal: '',
      fecha: new Date().toISOString().split('T')[0]
    }
  });

  // Cargar datos necesarios usando stores
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        
        // Cargar datos en paralelo
        await Promise.all([
          fetchAnimales(),
          fetchMataderos(),
          fetchUnidades().then(setUnidades)
        ]);

      } catch (error) {
        console.error('Error al cargar datos:', error);
        setFormError('Error al cargar los datos necesarios');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [fetchAnimales, fetchMataderos, fetchUnidades]);

  // Establecer valores iniciales si es edición
  useEffect(() => {
    if (produccion) {
      setIsEditing(true);
      form.reset({
        animal_id: produccion.animal_id?.toString() || '',
        matadero_id: produccion.matadero_id?.toString() || '',
        unidad_id: produccion.unidad_id?.toString() || '',
        peso_canal: produccion.peso_canal || '',
        fecha: produccion.fecha ? new Date(produccion.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setIsEditing(false);
      form.reset({
        animal_id: '',
        matadero_id: '',
        unidad_id: '',
        peso_canal: '',
        fecha: new Date().toISOString().split('T')[0]
      });
    }
  }, [produccion, form]);

  const onSubmit = async (data) => {
    setFormError('');
    setFieldErrors({});
    setLoading(true);
    
    try {
      // Validar que los campos requeridos no estén vacíos
      if (!data.animal_id || !data.matadero_id || !data.unidad_id || !data.peso_canal || !data.fecha) {
        throw new Error('Todos los campos marcados con * son requeridos');
      }

      // Preparar datos para enviar
      const formData = {
        animal_id: parseInt(data.animal_id),
        matadero_id: parseInt(data.matadero_id),
        unidad_id: parseInt(data.unidad_id),
        peso_canal: parseFloat(data.peso_canal),
        fecha: new Date(data.fecha).toISOString()
      };

      let result;
      if (isEditing) {
        result = await updateProduccion(produccion.produccion_id, formData);
      } else {
        result = await createProduccion(formData);
      }

      if (result?.success) {
        form.reset();
        onSuccess?.();
      } else {
        throw new Error(result?.error || 'Error desconocido al procesar la solicitud');
      }
    } catch (error) {
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Preparar opciones para los combobox
  const animalOptions = (animales || [])
    .filter(animal => animal && animal.animal_id && animal.animal_id.toString().trim() !== '')
    .map(animal => ({
      value: animal.animal_id.toString(),
      label: `${animal.arete} ${animal.nombre ? `- ${animal.nombre}` : ''}`
    }));

  const mataderoOptions = (mataderos || [])
    .filter(matadero => matadero && matadero.matadero_id && matadero.matadero_id.toString().trim() !== '')
    .map(matadero => ({
      value: matadero.matadero_id.toString(),
      label: matadero.ubicacion
    }));

  const unidadOptions = (unidades || [])
    .filter(unidad => unidad && unidad.unidad_id && unidad.unidad_id.toString().trim() !== '')
    .map(unidad => ({
      value: unidad.unidad_id.toString(),
      label: unidad.nombre
    }));

  if (loadingData) {
    return (
      <Card className="w-full border-0 shadow-none">
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando datos...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {formError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="animal_id"
                rules={{ 
                  required: "El animal es obligatorio"
                }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Animal</FormLabel>
                    <FormControl>
                      <Combobox
                        options={animalOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar animal"
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.animal_id || form.formState.errors.animal_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="matadero_id"
                rules={{ 
                  required: "El matadero es obligatorio"
                }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Matadero</FormLabel>
                    <FormControl>
                      <Combobox
                        options={mataderoOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar matadero"
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.matadero_id || form.formState.errors.matadero_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unidad_id"
                rules={{ 
                  required: "La unidad de medida es obligatoria"
                }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Unidad de Medida</FormLabel>
                    <FormControl>
                      <Combobox
                        options={unidadOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar unidad"
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.unidad_id || form.formState.errors.unidad_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="peso_canal"
                rules={{ 
                  required: "El peso de la canal es obligatorio",
                  min: {
                    value: 0.1,
                    message: "El peso debe ser mayor a 0"
                  },
                  max: {
                    value: 1000,
                    message: "El peso no puede ser mayor a 1000 kg"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso de Canal (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="Ej: 120.50"
                        {...field} 
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.peso_canal || form.formState.errors.peso_canal?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha"
                rules={{ 
                  required: "La fecha es obligatoria"
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Producción</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        {...field} 
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.fecha || form.formState.errors.fecha?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-2 sm:pt-4 flex">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
                variant="produccion"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Producción' : 'Registrar Producción'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProduccionCarneForm;
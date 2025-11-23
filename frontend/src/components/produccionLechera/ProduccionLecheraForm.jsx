import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useProduccionLecheraStore } from '@/store/produccionLecheraStore';
import { useAnimalStore } from '@/store/animalStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Milk } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const ProduccionLecheraForm = ({ 
  produccion = null, 
  onSuccess,
  onCancel 
}) => {
  const { createProduccion, updateProduccion, loading, fetchUnidades } = useProduccionLecheraStore();
  const { animales, fetchAnimales } = useAnimalStore();
  const [unidades, setUnidades] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const form = useForm({
    defaultValues: {
      animal_id: '',
      unidad_id: '',
      cantidad: '',
      fecha: getCurrentDate(), 
    }
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchAnimales();
      const result = await fetchUnidades();
      if (result.success) {
        setUnidades(result.data);
      } else {
        console.error('Error cargando unidades:', result.error);
      }
    };
    loadData();
  }, [fetchAnimales, fetchUnidades]);

  useEffect(() => {
    if (produccion) {
      setIsEditing(true);
      
      const fechaProduccion = produccion.fecha || getCurrentDate();
      
      form.reset({
        animal_id: produccion.animal_id ? produccion.animal_id.toString() : '',
        unidad_id: produccion.unidad_id ? produccion.unidad_id.toString() : '',
        cantidad: produccion.cantidad ? parseInt(produccion.cantidad).toString() : '',
        fecha: fechaProduccion,
        descripcion: produccion.descripcion || ''
      });
    } else {
      setIsEditing(false);
      form.reset({
        animal_id: '',
        unidad_id: '',
        cantidad: '',
        fecha: getCurrentDate(),
        descripcion: ''
      });
    }
  }, [produccion, form]);

  const onSubmit = async (data) => {
    setFormError('');
    setFieldErrors({});
    
    try {
      if (!data.animal_id || !data.cantidad || !data.unidad_id) {
        setFormError('Todos los campos marcados con * son obligatorios');
        return;
      }

      const produccionData = {
        animal_id: parseInt(data.animal_id),
        unidad_id: parseInt(data.unidad_id),
        cantidad: parseInt(data.cantidad),
        fecha: data.fecha, 
        descripcion: data.descripcion || null
      };

      console.log('Datos a enviar a la BD:', produccionData);

      let result;
      if (isEditing) {
        result = await updateProduccion(produccion.produccion_id, produccionData);
      } else {
        result = await createProduccion(produccionData);
      }

      if (result?.success) {
        form.reset({
          animal_id: '',
          unidad_id: '',
          cantidad: '',
          fecha: getCurrentDate(),
          descripcion: ''
        });
        onSuccess?.();
      } else {
        const errorMsg = result?.error || 'Error al procesar la solicitud';
        setFormError(errorMsg);

        if (result.error?.includes('animal')) {
          setFieldErrors(prev => ({ ...prev, animal_id: 'Animal no válido' }));
        }
        if (result.error?.includes('unidad')) {
          setFieldErrors(prev => ({ ...prev, unidad_id: 'Unidad no válida' }));
        }
        if (result.error?.includes('cantidad')) {
          setFieldErrors(prev => ({ ...prev, cantidad: 'Cantidad no válida' }));
        }
        if (result.error?.includes('fecha')) {
          setFieldErrors(prev => ({ ...prev, fecha: 'Fecha no válida' }));
        }
        if (result.error?.includes('hembra')) {
          setFieldErrors(prev => ({ ...prev, animal_id: 'Solo animales hembra pueden tener producción lechera' }));
        }
      }
    } catch (error) {
      console.error('Error en onSubmit:', error);
      setFormError('Error de conexión. Por favor, intente nuevamente.');
    }
  };

  const animalesOptions = animales
    .filter(animal => !animal.deleted_at && animal.sexo === 'H')
    .map(animal => ({
      value: animal.animal_id.toString(),
      label: `${animal.arete} `
    }));

  const unidadesOptions = unidades
    .filter(unidad => !unidad.deleted_at)
    .map(unidad => ({
      value: unidad.unidad_id.toString(),
      label: `${unidad.nombre} (${unidad.abreviatura || unidad.nombre})`
    }));

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
                    <FormLabel>Animal (Hembra) </FormLabel>
                    <FormControl>
                      <Combobox
                        options={animalesOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar animal hembra"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control}
                  name="cantidad"
                  rules={{ 
                    required: "La cantidad es obligatoria",
                    min: {
                      value: 1,
                      message: "La cantidad debe ser mayor a 0"
                    },
                    pattern: {
                      value: /^\d+$/,
                      message: "La cantidad debe ser un número entero válido"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem className="flex flex-col h-full">
                      <FormLabel>Cantidad </FormLabel>
                      <FormControl>
                        <div className="relative flex-1">
                          <Input
                            {...field}
                            type="number"
                            step="1"
                            min="1"
                            placeholder="0"
                            disabled={loading}
                            className="w-full"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="min-h-[20px]">
                        {fieldErrors.cantidad || form.formState.errors.cantidad?.message}
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
                    <FormItem className="flex flex-col h-full">
                      <FormLabel>Unidad de Medida </FormLabel>
                      <FormControl>
                        <div className="flex-1">
                          <Combobox
                            options={unidadesOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Seleccionar unidad"
                            disabled={loading}
                            className="w-full"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="min-h-[20px]">
                        {fieldErrors.unidad_id || form.formState.errors.unidad_id?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="fecha"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input
                        type="hidden"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Observaciones o detalles adicionales..."
                        disabled={loading}
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-2 sm:pt-4 flex gap-3">
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

export default ProduccionLecheraForm;
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePesajeStore } from '@/store/pesajeStore';
import { useAnimalStore } from '@/store/animalStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CalendarIcon, Scale } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const PesajeForm = ({ 
  pesaje = null, 
  onSuccess,
}) => {
  const { createPesaje, updatePesaje, loading, fetchUnidades } = usePesajeStore();
  const { animales, fetchAnimales } = useAnimalStore();
  const [unidades, setUnidades] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const form = useForm({
    defaultValues: {
      animal_id: '',
      unidad_id: '',
      peso: '',
      fecha: new Date()
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
    if (pesaje) {
      setIsEditing(true);
      form.reset({
        animal_id: pesaje.animal_id ? pesaje.animal_id.toString() : '',
        unidad_id: pesaje.unidad_id ? pesaje.unidad_id.toString() : '',
        peso: pesaje.peso ? parseFloat(pesaje.peso).toString() : '',
        fecha: pesaje.fecha ? new Date(pesaje.fecha) : new Date()
      });
    } else {
      setIsEditing(false);
      form.reset({
        animal_id: '',
        unidad_id: '',
        peso: '',
        fecha: new Date()
      });
    }
  }, [pesaje, form]);

  const onSubmit = async (data) => {
    setFormError('');
    setFieldErrors({});
    
    try {
      console.log('Datos del formulario:', data);

      // Validar que todos los campos estén completos
      if (!data.animal_id || !data.unidad_id || !data.peso || !data.fecha) {
        setFormError('Todos los campos son obligatorios');
        return;
      }

      const pesajeData = {
        animal_id: parseInt(data.animal_id),
        unidad_id: parseInt(data.unidad_id),
        peso: parseFloat(data.peso),
        fecha: data.fecha.toISOString().split('T')[0]
      };

      console.log('Enviando datos al servidor:', pesajeData);

      let result;
      if (isEditing) {
        result = await updatePesaje(pesaje.pesaje_id, pesajeData);
      } else {
        result = await createPesaje(pesajeData);
      }

      console.log('Respuesta del servidor:', result);

      if (result?.success) {
        form.reset();
        onSuccess?.();
      } else {
        const errorMsg = result?.error || 'Error al procesar la solicitud';
        setFormError(errorMsg);

        // Mapear errores específicos por campo
        if (result.error?.includes('animal')) {
          setFieldErrors(prev => ({ ...prev, animal_id: 'Animal no válido' }));
        }
        if (result.error?.includes('unidad')) {
          setFieldErrors(prev => ({ ...prev, unidad_id: 'Unidad no válida' }));
        }
        if (result.error?.includes('peso')) {
          setFieldErrors(prev => ({ ...prev, peso: 'Peso no válido' }));
        }
        if (result.error?.includes('fecha')) {
          setFieldErrors(prev => ({ ...prev, fecha: 'Fecha no válida' }));
        }
      }
    } catch (error) {
      console.error('Error en onSubmit:', error);
      setFormError('Error de conexión. Por favor, intente nuevamente.');
    }
  };

  const animalesOptions = animales
    .filter(animal => !animal.deleted_at)
    .map(animal => ({
      value: animal.animal_id.toString(),
      label: `${animal.arete} - ${animal.sexo || 'Sin nombre'}`
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
                    <FormLabel>Animal</FormLabel>
                    <FormControl>
                      <Combobox
                        options={animalesOptions}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control}
                  name="peso"
                  rules={{ 
                    required: "El peso es obligatorio",
                    min: {
                      value: 0.01,
                      message: "El peso debe ser mayor a 0"
                    },
                    pattern: {
                      value: /^\d*\.?\d+$/,
                      message: "El peso debe ser un número válido"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem className="flex flex-col h-full">
                      <FormLabel>Peso</FormLabel>
                      <FormControl>
                        <div className="relative flex-1">
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            disabled={loading}
                            className="w-full "
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="min-h-[20px]">
                        {fieldErrors.peso || form.formState.errors.peso?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unidad_id"
                  rules={{ 
                    required: "La unidad es obligatoria"
                  }}
                  render={({ field }) => (
                    <FormItem className="flex flex-col h-full">
                      <FormLabel>Unidad de Medida</FormLabel>
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
                rules={{ 
                  required: "La fecha del pesaje es requerida"
                }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha del Pesaje</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={loading}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          locale={es}
                          toDate={new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage>
                      {fieldErrors.fecha || form.formState.errors.fecha?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-2 sm:pt-4 flex gap-3">
            
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
                variant="ganado"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Pesaje' : 'Registrar Pesaje'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PesajeForm;
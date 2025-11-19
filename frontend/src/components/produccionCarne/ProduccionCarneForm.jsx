import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useProduccionCarneStore } from '@/store/produccionCarneStore';
import { useAnimalStore } from '@/store/animalStore';
import { useMataderoStore } from '@/store/mataderoStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CalendarIcon } from 'lucide-react';
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const ProduccionCarneForm = ({ 
  produccion = null, 
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [unidades, setUnidades] = useState([]);
  const [pesajes, setPesajes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const { 
    createProduccion, 
    updateProduccion,
    fetchUnidades,
    fetchPesajesDisponibles
  } = useProduccionCarneStore();

  const { animales, fetchAnimales } = useAnimalStore();
  const { mataderos, fetchMataderos } = useMataderoStore();

  const form = useForm({
    defaultValues: {
      animal_id: '',
      matadero_id: '',
      pesaje_id: '',
      unidad_id: '',
      peso_canal: '',
      fecha: new Date()
    }
  });

  const getLocalDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const formatDateToLocalISO = (date) => {
    if (!date) return '';
    const localDate = new Date(date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date, onChange) => {
    if (date) {
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      onChange(localDate);
    }
  };

  const isDateDisabled = (date) => {
    const today = getLocalDate();
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return compareDate > today;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        setFormError('');
        
        const [animalesData, mataderosData, unidadesData] = await Promise.all([
          fetchAnimales().catch(error => {
            console.error('Error cargando animales:', error);
            return [];
          }),
          fetchMataderos().catch(error => {
            console.error('Error cargando mataderos:', error);
            return [];
          }),
          fetchUnidades().catch(error => {
            console.error('Error cargando unidades:', error);
            return [];
          })
        ]);

        setUnidades(unidadesData);

        try {
          const pesajesData = await fetchPesajesDisponibles();
          setPesajes(pesajesData);
        } catch (error) {
          console.warn('No se pudieron cargar los pesajes disponibles:', error.message);
          setPesajes([]);
        }

      } catch (error) {
        console.error('Error crítico al cargar datos:', error);
        setFormError('Error al cargar algunos datos necesarios. Puede continuar sin pesajes disponibles.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [fetchAnimales, fetchMataderos, fetchUnidades, fetchPesajesDisponibles]);

  useEffect(() => {
    if (produccion) {
      setIsEditing(true);
      form.reset({
        animal_id: produccion.animal_id?.toString() || '',
        matadero_id: produccion.matadero_id?.toString() || '',
        pesaje_id: produccion.pesaje_id?.toString() || '',
        unidad_id: produccion.unidad_id?.toString() || '',
        peso_canal: produccion.peso_canal || '',
        fecha: produccion.fecha ? new Date(produccion.fecha) : getLocalDate()
      });
    } else {
      setIsEditing(false);
      form.reset({
        animal_id: '',
        matadero_id: '',
        pesaje_id: '',
        unidad_id: '',
        peso_canal: '',
        fecha: getLocalDate()
      });
    }
  }, [produccion, form]);

  const onSubmit = async (data) => {
    setFormError('');
    setFieldErrors({});
    setLoading(true);
    
    try {
      if (!data.animal_id || !data.matadero_id || !data.unidad_id || !data.peso_canal || !data.fecha) {
        throw new Error('Todos los campos marcados con * son requeridos');
      }

      const formData = {
        animal_id: parseInt(data.animal_id),
        matadero_id: parseInt(data.matadero_id),
        pesaje_id: data.pesaje_id ? parseInt(data.pesaje_id) : null,
        unidad_id: parseInt(data.unidad_id),
        peso_canal: parseFloat(data.peso_canal),
        fecha: formatDateToLocalISO(data.fecha)
      };

      console.log('Datos a enviar:', formData);

      let result;
      if (isEditing) {
        result = await updateProduccion(produccion.produccion_id, formData);
      } else {
        result = await createProduccion(formData);
      }

      if (result?.success) {
        form.reset({
          animal_id: '',
          matadero_id: '',
          pesaje_id: '',
          unidad_id: '',
          peso_canal: '',
          fecha: getLocalDate()
        });
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

  const pesajeOptions = (pesajes || [])
    .filter(pesaje => pesaje && pesaje.pesaje_id && pesaje.pesaje_id.toString().trim() !== '')
    .map(pesaje => ({
      value: pesaje.pesaje_id.toString(),
      label: `${pesaje.numero_pesaje || `PES-${pesaje.pesaje_id}`} - ${pesaje.animal?.arete} - ${parseFloat(pesaje.peso).toFixed(2)} ${pesaje.unidad?.abreviatura || pesaje.unidad?.nombre || ''}`
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
                    <FormLabel>Animal *</FormLabel>
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
                    <FormLabel>Matadero *</FormLabel>
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
                name="pesaje_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Pesaje (Opcional)</FormLabel>
                    <FormControl>
                      <Combobox
                        options={pesajeOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={
                          pesajes.length === 0 
                            ? "No hay pesajes disponibles" 
                            : "Seleccionar pesaje existente"
                        }
                        disabled={loading || pesajes.length === 0}
                        className="w-full"
                      />
                    </FormControl>
                    <div className="text-sm text-gray-500">
                      {pesajes.length === 0 
                        ? "No hay pesajes disponibles. Se creará uno automáticamente."
                        : "Si no selecciona un pesaje, se creará uno automáticamente"
                      }
                    </div>
                    <FormMessage>
                      {fieldErrors.pesaje_id || form.formState.errors.pesaje_id?.message}
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
                    <FormLabel>Unidad de Medida *</FormLabel>
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
                    <FormLabel>Peso de Canal (kg) *</FormLabel>
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
                  required: "La fecha es obligatoria",
                  validate: {
                    notFuture: (value) => {
                      return !isDateDisabled(value) || "La fecha no puede ser futura"
                    }
                  }
                }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Producción *</FormLabel>
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
                            type="button"
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
                          onSelect={(date) => handleDateSelect(date, field.onChange)}
                          disabled={isDateDisabled}
                          initialFocus
                          locale={es}
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
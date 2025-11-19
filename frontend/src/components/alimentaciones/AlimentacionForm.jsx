import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAlimentacionStore } from '@/store/alimentacionStore';
import { useAnimalStore } from '@/store/animalStore';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const AlimentacionForm = ({ 
  alimentacion = null, 
  onSuccess,
  onCancel 
}) => {
  const { 
    createAlimentacion, 
    updateAlimentacion, 
    loading
  } = useAlimentacionStore();
  
  const { animales, fetchAnimales } = useAnimalStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [insumos, setInsumos] = useState([]);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);

  const form = useForm({
    defaultValues: {
      animal_id: '',
      insumo_id: '',
      cantidad: '',
      fecha: new Date()
    }
  });

  useEffect(() => {
    fetchAnimales();
    // Cargar insumos directamente desde la API
    fetchInsumos();
  }, []);

  const fetchInsumos = async () => {
    try {
      const response = await fetch('/api/insumos');
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setInsumos(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error cargando insumos:', error);
    }
  };

  useEffect(() => {
    if (alimentacion) {
      setIsEditing(true);
      form.reset({
        animal_id: alimentacion.animal_id ? alimentacion.animal_id.toString() : '',
        insumo_id: alimentacion.insumo_id ? alimentacion.insumo_id.toString() : '',
        cantidad: alimentacion.cantidad ? alimentacion.cantidad.toString() : '',
        fecha: alimentacion.fecha ? new Date(alimentacion.fecha) : new Date()
      });
      // Buscar el insumo seleccionado
      const insumo = insumos.find(i => i.insumo_id === alimentacion.insumo_id);
      setInsumoSeleccionado(insumo);
    } else {
      setIsEditing(false);
      form.reset({
        animal_id: '',
        insumo_id: '',
        cantidad: '',
        fecha: new Date()
      });
      setInsumoSeleccionado(null);
    }
  }, [alimentacion, form, insumos]);

  const onSubmit = async (data) => {
    setFormError('');
    
    try {
      console.log('Datos del formulario:', data);
      
      // Validación adicional
      if (!data.animal_id || !data.insumo_id || !data.cantidad || !data.fecha) {
        setFormError('Todos los campos son obligatorios');
        return;
      }

      const alimentacionData = {
        animal_id: parseInt(data.animal_id),
        insumo_id: parseInt(data.insumo_id),
        cantidad: parseInt(data.cantidad),
        fecha: data.fecha.toISOString().split('T')[0] // Formato YYYY-MM-DD
      };

      console.log('Datos a enviar:', alimentacionData);

      let result;
      if (isEditing) {
        result = await updateAlimentacion(alimentacion.alimentacion_id, alimentacionData);
      } else {
        result = await createAlimentacion(alimentacionData);
      }

      if (result?.success) {
        form.reset({
          animal_id: '',
          insumo_id: '',
          cantidad: '',
          fecha: new Date()
        });
        setInsumoSeleccionado(null);
        onSuccess?.();
      } else {
        setFormError(result?.error || 'Error al procesar la solicitud');
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
      label: `${animal.arete} - ${animal.nombre || 'Sin nombre'}`
    }));

  const insumosOptions = insumos && insumos.length > 0 
    ? insumos
        .filter(insumo => !insumo.deleted_at && insumo.cantidad > 0)
        .map(insumo => ({
          value: insumo.insumo_id.toString(),
          label: `${insumo.nombre} - Stock: ${insumo.cantidad} ${insumo.unidad?.nombre || ''}`
        }))
    : [];

  const handleInsumoChange = (insumoId) => {
    const insumo = insumos.find(i => i.insumo_id.toString() === insumoId);
    setInsumoSeleccionado(insumo);
  };

  // Función corregida para deshabilitar solo fechas futuras
  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate > today;
  };

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
                rules={{ required: "El animal es obligatorio" }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Animal *</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insumo_id"
                rules={{ required: "El insumo es obligatorio" }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Insumo *</FormLabel>
                    <FormControl>
                      <Combobox
                        options={insumosOptions}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleInsumoChange(value);
                        }}
                        placeholder="Seleccionar insumo"
                        disabled={loading || insumos.length === 0}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cantidad"
                rules={{ 
                  required: "La cantidad es obligatoria",
                  min: { value: 1, message: "La cantidad debe ser mayor a 0" },
                  validate: (value) => {
                    if (insumoSeleccionado && parseInt(value) > insumoSeleccionado.cantidad) {
                      return `La cantidad no puede ser mayor al stock disponible (${insumoSeleccionado.cantidad})`;
                    }
                    return true;
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max={insumoSeleccionado?.cantidad}
                        placeholder="Cantidad a utilizar"
                        {...field}
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    {insumoSeleccionado && (
                      <div className="text-sm text-gray-500">
                        Stock disponible: {insumoSeleccionado.cantidad} {insumoSeleccionado.unidad?.nombre || ''}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha"
                rules={{ required: "La fecha es requerida" }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Alimentación *</FormLabel>
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
                          onSelect={field.onChange}
                          initialFocus
                          locale={es}
                          disabled={isDateDisabled}
                        />
                      </PopoverContent>
                    </Popover>
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
                variant="ganado"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Alimentación' : 'Registrar Alimentación'}
              </Button>
              
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AlimentacionForm;
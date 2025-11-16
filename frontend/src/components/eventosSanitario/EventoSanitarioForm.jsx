import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEventoSanitarioStore } from '@/store/eventoSanitarioStore';
import { useAnimalStore } from '@/store/animalStore';
import { useTypeStore } from '@/store/typeStore';
import { useInsumoStore } from '@/store/insumoStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Trash2, CalendarIcon } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const EventoSanitarioForm = ({ 
  eventoSanitario = null, 
  onSuccess,
}) => {
  const { createEventoSanitario, updateEventoSanitario, loading } = useEventoSanitarioStore();
  const { animales, fetchAnimales } = useAnimalStore();
  const { eventTypes, fetchEventTypes } = useTypeStore();
  const { insumos, fetchInsumos, loading: loadingInsumos } = useInsumoStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [insumosSeleccionados, setInsumosSeleccionados] = useState([]);
  const [estadoEvento, setEstadoEvento] = useState(1);

  const form = useForm({
    defaultValues: {
      animal_id: '',
      tipo_evento_id: '',
      estado: '',
      diagnostico: '',
      tratamiento: '',
      fecha: new Date()
    }
  });

  useEffect(() => {
    fetchAnimales();
    fetchEventTypes();
    fetchInsumos();
  }, [fetchAnimales, fetchEventTypes, fetchInsumos]);

  useEffect(() => {
    if (eventoSanitario) {
      setIsEditing(true);
      setEstadoEvento(eventoSanitario.estado === 'Completado' ? 1 : 0);
      form.reset({
        animal_id: eventoSanitario.animal_id ? eventoSanitario.animal_id.toString() : '',
        tipo_evento_id: eventoSanitario.tipo_evento_id ? eventoSanitario.tipo_evento_id.toString() : '',
        estado: eventoSanitario.estado || '',
        diagnostico: eventoSanitario.diagnostico || '',
        tratamiento: eventoSanitario.tratamiento || '',
        fecha: eventoSanitario.fecha ? new Date(eventoSanitario.fecha) : new Date()
      });

      if (eventoSanitario.evento_insumo) {
        setInsumosSeleccionados(
          eventoSanitario.evento_insumo.map(ei => ({
            insumo_id: ei.insumo.insumo_id.toString(),
            cantidad: ei.cantidad,
            nombre: ei.insumo.nombre,
            stock: ei.insumo.cantidad
          }))
        );
      }
    } else {
      setIsEditing(false);
      setEstadoEvento(1);
      form.reset({
        animal_id: '',
        tipo_evento_id: '',
        estado: '',
        diagnostico: '',
        tratamiento: '',
        fecha: new Date()
      });
      setInsumosSeleccionados([]);
    }
  }, [eventoSanitario, form]);

  const onSubmit = async (data) => {
    setFormError('');
    
    try {
      const fechaSeleccionada = new Date(data.fecha);
      const fechaFormateada = fechaSeleccionada.toISOString().split('T')[0];
      
      const eventoSanitarioData = isEditing 
        ? {
            estado: estadoEvento === 1 ? 'Completado' : 'Pendiente'
          }
        : {
            animal_id: parseInt(data.animal_id),
            tipo_evento_id: parseInt(data.tipo_evento_id),
            estado: estadoEvento === 1 ? 'Completado' : 'Pendiente',
            diagnostico: data.diagnostico || null,
            tratamiento: data.tratamiento || null,
            fecha: fechaFormateada,
            insumos: insumosSeleccionados.map(insumo => ({
              insumo_id: parseInt(insumo.insumo_id),
              cantidad: parseInt(insumo.cantidad)
            }))
          };

      let result;
      if (isEditing) {
        result = await updateEventoSanitario(eventoSanitario.evento_sanitario_id, eventoSanitarioData);
      } else {
        result = await createEventoSanitario(eventoSanitarioData);
      }

      if (result?.success) {
        form.reset();
        setInsumosSeleccionados([]);
        setEstadoEvento(1);
        onSuccess?.();
      } else {
        setFormError(result?.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      setFormError('Error de conexión. Por favor, intente nuevamente.');
    }
  };

  const toggleEstado = () => {
    setEstadoEvento(prev => prev === 1 ? 0 : 1);
  };

  const agregarInsumo = () => {
    setInsumosSeleccionados([...insumosSeleccionados, { insumo_id: '', cantidad: 1 }]);
  };

  const actualizarInsumo = (index, field, value) => {
    const nuevosInsumos = [...insumosSeleccionados];
    nuevosInsumos[index][field] = value;
    setInsumosSeleccionados(nuevosInsumos);
  };

  const eliminarInsumo = (index) => {
    const nuevosInsumos = insumosSeleccionados.filter((_, i) => i !== index);
    setInsumosSeleccionados(nuevosInsumos);
  };

  const animalesOptions = animales
    .filter(animal => !animal.deleted_at)
    .map(animal => ({
      value: animal.animal_id.toString(),
      label: `${animal.arete} `
    }));

  const tipoEventoOptions = eventTypes
    .filter(tipo => !tipo.deleted_at)
    .map(tipo => ({
      value: tipo.tipo_evento_id.toString(),
      label: tipo.nombre
    }));

  const insumosOptions = insumos && insumos.length > 0 
    ? insumos
        .filter(insumo => !insumo.deleted_at)
        .map(insumo => ({
          value: insumo.insumo_id.toString(),
          label: `${insumo.nombre}` 
        }))
    : [{ value: 'no-data', label: 'No hay insumos disponibles', disabled: true }];

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today;
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-0">
        <Form {...form}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit)(e);
            }} 
            className="space-y-6"
          >
            {formError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              {!isEditing && (
                <>
                  <FormField
                    control={form.control}
                    name="animal_id"
                    rules={{ required: "El animal es obligatorio" }}
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tipo_evento_id"
                    rules={{ required: "El tipo de evento es obligatorio" }}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tipo de Evento Sanitario</FormLabel>
                        <FormControl>
                          <Combobox
                            options={tipoEventoOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Seleccionar tipo de evento"
                            disabled={loading}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="estado-evento">Estado del Evento</Label>
                  <div className="text-sm text-muted-foreground">
                    {estadoEvento === 1 ? 'Completado' : 'Pendiente'}
                  </div>
                </div>
                <Switch
                  id="estado-evento"
                  checked={estadoEvento === 1}
                  onCheckedChange={toggleEstado}
                  disabled={loading}
                />
              </div>

              {!isEditing && (
                <FormField
                  control={form.control}
                  name="fecha"
                  rules={{ 
                    required: "La fecha es requerida",
                    validate: {
                      futureDate: (value) => {
                        const selectedDate = new Date(value);
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(0, 0, 0, 0);
                        return selectedDate >= tomorrow || "La fecha debe ser futura (a partir de mañana)";
                      }
                    }
                  }}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha del Evento</FormLabel>
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
                            initialFocus
                            locale={es}
                            disabled={(date) => date <= new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!isEditing && (
                <>
                  <FormField
                    control={form.control}
                    name="diagnostico"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnóstico (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Descripción del diagnóstico..."
                            disabled={loading}
                            className="w-full resize-none"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tratamiento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tratamiento (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Descripción del tratamiento aplicado..."
                            disabled={loading}
                            className="w-full resize-none"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {!isEditing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Insumos Utilizados (Opcional)
                    </label>
                    <div className="flex gap-2">
                      {loadingInsumos && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      )}
                      <Button
                        type="button"
                        onClick={agregarInsumo}
                        variant="outline"
                        size="sm"
                        disabled={loading || loadingInsumos}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar Insumo
                      </Button>
                    </div>
                  </div>

                  {insumosOptions.length === 1 && insumosOptions[0].value === 'no-data' && (
                    <div className="p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
                      No hay insumos disponibles en el sistema. 
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-amber-700 ml-1"
                        onClick={() => fetchInsumos()}
                      >
                        Reintentar
                      </Button>
                    </div>
                  )}

                  {insumosSeleccionados.map((insumo, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Insumo</label>
                          <Combobox
                            options={insumosOptions}
                            value={insumo.insumo_id}
                            onValueChange={(value) => actualizarInsumo(index, 'insumo_id', value)}
                            placeholder={
                              loadingInsumos 
                                ? "Cargando insumos..." 
                                : "Seleccionar insumo"
                            }
                            disabled={loading || loadingInsumos}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Cantidad</label>
                          <Input
                            type="number"
                            min="1"
                            value={insumo.cantidad}
                            onChange={(e) => actualizarInsumo(index, 'cantidad', e.target.value)}
                            placeholder="Cantidad"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => eliminarInsumo(index)}
                        variant="ghost"
                        size="icon"
                        disabled={loading}
                        className="mt-6"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 sm:pt-4 flex gap-3">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
                variant="sanidad"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Estado' : 'Crear Evento'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EventoSanitarioForm;
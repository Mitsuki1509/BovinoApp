import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEventoSanitarioStore } from '@/store/eventoSanitarioStore';
import { useAnimalStore } from '@/store/animalStore';
import { useTypeStore } from '@/store/typeStore';
import { useInsumoStore } from '@/store/insumoStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Trash2, CalendarIcon} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const ReadOnlyBox = ({ children, className = '' }) => (
  <div className={cn('p-2 border rounded-md bg-gray-50', className)}>{children}</div>
);

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
  const [estadoEvento, setEstadoEvento] = useState(0);
  const [noInsumosDisponibles, setNoInsumosDisponibles] = useState(false);
  const STOCK_MINIMO = 10;

  const form = useForm({
    defaultValues: {
      animal_id: '',
      tipo_evento_id: '',
      diagnostico: '',
      tratamiento: '',
      fecha: new Date()
    }
  });

  const truncarTexto = (texto, maxCaracteres = 30) => {
    if (!texto || typeof texto !== 'string') return '';
    if (texto.length <= maxCaracteres) return texto;
    return texto.substring(0, maxCaracteres) + '...';
  };

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
            stock: ei.insumo.cantidad,
            unidad: ei.insumo.unidad?.nombre || ''
          }))
        );
      }
    } else {
      setIsEditing(false);
      setEstadoEvento(0);
      form.reset({
        animal_id: '',
        tipo_evento_id: '',
        diagnostico: '',
        tratamiento: '',
        fecha: new Date()
      });
      setInsumosSeleccionados([]);
    }
  }, [eventoSanitario, form]);

  useEffect(() => {
    if (insumos.length > 0 && !isEditing) {
      const insumosDisponibles = insumos.filter(insumo => 
        !insumo.deleted_at && insumo.cantidad > STOCK_MINIMO
      );
      setNoInsumosDisponibles(insumosDisponibles.length === 0);
    }
  }, [insumos, isEditing]);

  const onSubmit = async (data) => {
    setFormError('');
    
    try {
      if (isEditing) {
        const result = await updateEventoSanitario(eventoSanitario.evento_sanitario_id, {
          estado: estadoEvento === 1 ? 'Completado' : 'Pendiente'
        });

        if (result?.success) {
          onSuccess?.();
        } else {
          setFormError(result?.error || 'Error al procesar la solicitud');
        }
      } else {
        const fechaSeleccionada = new Date(data.fecha);
        const fechaFormateada = fechaSeleccionada.toISOString().split('T')[0];
        
        const eventoSanitarioData = {
          animal_id: parseInt(data.animal_id),
          tipo_evento_id: parseInt(data.tipo_evento_id),
          estado: 'Pendiente',
          diagnostico: data.diagnostico || null,
          tratamiento: data.tratamiento || null,
          fecha: fechaFormateada,
          insumos: insumosSeleccionados
            .filter(insumo => insumo.insumo_id && insumo.cantidad)
            .map(insumo => ({
              insumo_id: parseInt(insumo.insumo_id),
              cantidad: parseInt(insumo.cantidad)
            }))
        };

        const result = await createEventoSanitario(eventoSanitarioData);

        if (result?.success) {
          form.reset();
          setInsumosSeleccionados([]);
          setEstadoEvento(0);
          onSuccess?.();
        } else {
          const errorMsg = result?.error || '';
          if (errorMsg.includes('duplicado') || 
              errorMsg.includes('duplicate') || 
              errorMsg.includes('ya existe') ||
              errorMsg.includes('mismo tipo')) {
            setFormError('Ya existe un evento sanitario del mismo tipo para este animal en la fecha seleccionada.');
          } else if (errorMsg.includes('Stock insuficiente') || 
                     errorMsg.includes('No se puede utilizar') ||
                     errorMsg.includes('stock mínimo')) {
            setFormError(errorMsg);
          } else {
            setFormError(errorMsg || 'Error al procesar la solicitud');
          }
        }
      }
    } catch (error) {
      console.error('Error en onSubmit:', error);
      setFormError('Error de conexión. Por favor, intente nuevamente.');
    }
  };

  const toggleEstado = () => {
    setEstadoEvento(prev => prev === 1 ? 0 : 1);
  };

  const agregarInsumo = () => {
    setInsumosSeleccionados([...insumosSeleccionados, { 
      insumo_id: '', 
      cantidad: '',
      nombre: '',
      stock: 0,
      unidad: ''
    }]);
  };

  const actualizarInsumo = (index, field, value) => {
    const nuevosInsumos = [...insumosSeleccionados];
    
    if (field === 'insumo_id') {
      if (value) {
        const insumoSeleccionado = insumos.find(i => i.insumo_id.toString() === value);
        if (insumoSeleccionado) {
          nuevosInsumos[index].stock = insumoSeleccionado.cantidad;
          nuevosInsumos[index].nombre = insumoSeleccionado.nombre;
          nuevosInsumos[index].unidad = insumoSeleccionado.unidad?.nombre || '';
          if (!nuevosInsumos[index].cantidad) {
            nuevosInsumos[index].cantidad = 1;
          }
        }
      } else {
        nuevosInsumos[index].stock = 0;
        nuevosInsumos[index].nombre = '';
        nuevosInsumos[index].unidad = '';
        nuevosInsumos[index].cantidad = '';
      }
    }
    
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
      label: `${animal.arete}${animal.nombre ? ` - ${animal.nombre}` : ''}`
    }));

  const tipoEventoOptions = eventTypes
    .filter(tipo => !tipo.deleted_at)
    .map(tipo => ({
      value: tipo.tipo_evento_id.toString(),
      label: tipo.nombre
    }));

  const obtenerTodosInsumos = () => {
    if (!insumos || insumos.length === 0) {
      return [{ value: 'no-data', label: 'No hay insumos disponibles', disabled: true }];
    }
    
    return insumos
      .filter(insumo => {
        if (insumo.deleted_at) return false;
        if (!isEditing && insumo.cantidad <= STOCK_MINIMO) return false;
        return true;
      })
      .map(insumo => {
        const textoCompleto = `${insumo.nombre}`;
        return {
          value: insumo.insumo_id.toString(),
          label: truncarTexto(textoCompleto, 40),
          fullLabel: textoCompleto,
          disabled: !isEditing && insumo.cantidad <= STOCK_MINIMO
        };
      });
  };

  const getOpcionesFiltradas = (insumoIndex) => {
    const todosLosInsumos = obtenerTodosInsumos();
    const insumoActual = insumosSeleccionados[insumoIndex];
    
    if (isEditing) {
      return todosLosInsumos;
    }
    
    return todosLosInsumos.filter(option => {
      if (option.value === insumoActual?.insumo_id) {
        return true;
      }
      
      const estaSeleccionadoEnOtroCampo = insumosSeleccionados.some((insumo, idx) => 
        idx !== insumoIndex && insumo.insumo_id === option.value
      );
      
      return !estaSeleccionadoEnOtroCampo;
    });
  };

  const validarCantidad = (cantidad, stock) => {
    const cantidadStr = cantidad === null || cantidad === undefined ? '' : String(cantidad);
    
    if (!cantidadStr || cantidadStr.trim() === '') return "Cantidad requerida";
    
    const cantidadNum = parseInt(cantidadStr);
    if (isNaN(cantidadNum) || cantidadNum <= 0) return "La cantidad debe ser mayor a 0";
    if (cantidadNum > stock) return `No puede exceder el stock (${stock})`;
    if (stock - cantidadNum < STOCK_MINIMO) {
      return `Stock mínimo requerido: ${STOCK_MINIMO}. Quedarían ${stock - cantidadNum}`;
    }
    return true;
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
                rules={{ required: !isEditing ? "El animal es obligatorio" : false }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Animal</FormLabel>
                      {isEditing ? (
                      <ReadOnlyBox>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {animales.find(a => a.animal_id.toString() === field.value)?.arete || 'N/A'}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {animales.find(a => a.animal_id.toString() === field.value)?.nombre || ''}
                          </span>
                        </div>
                      </ReadOnlyBox>
                    ) : (
                      <Combobox
                        options={animalesOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar animal"
                        disabled={loading}
                        className="w-full"
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_evento_id"
                rules={{ required: !isEditing ? "El tipo de evento es obligatorio" : false }}
                render={({ field }) => {
                  const selectedLabel = eventTypes.find(t => t.tipo_evento_id.toString() === field.value)?.nombre;
                  
                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tipo de Evento Sanitario</FormLabel>
                      {isEditing ? (
                        <ReadOnlyBox>
                          <span className="text-sm">{selectedLabel || 'N/A'}</span>
                        </ReadOnlyBox>
                      ) : (
                        <Combobox
                          options={tipoEventoOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Seleccionar tipo de evento"
                          disabled={loading}
                          className="w-full text-sm sm:text-base"
                          truncate={true}
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="fecha"
                rules={{ 
                  required: !isEditing ? "La fecha es requerida" : false,
                  validate: {
                    futureDate: (value) => {
                      if (isEditing) return true;
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
                    <FormLabel className="text-sm">Fecha del Evento</FormLabel>
                    {isEditing ? (
                      <ReadOnlyBox className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : 'Fecha no especificada'}
                        </span>
                      </ReadOnlyBox>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn("w-full justify-start text-left font-normal h-9", !field.value && "text-muted-foreground")}
                              disabled={loading}
                            >
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar fecha'}
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
                    )}
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="diagnostico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico</FormLabel>
                    {isEditing ? (
                      <ReadOnlyBox className="min-h-[80px]">
                        <p className="text-sm whitespace-pre-line">{field.value || 'No se especificó diagnóstico'}</p>
                      </ReadOnlyBox>
                    ) : (
                      <Textarea
                        {...field}
                        placeholder="Descripción del diagnóstico..."
                        disabled={loading}
                        className="w-full resize-none"
                        rows={3}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tratamiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tratamiento</FormLabel>
                    {isEditing ? (
                      <ReadOnlyBox className="min-h-[80px]">
                        <p className="text-sm whitespace-pre-line">{field.value || 'No se especificó tratamiento'}</p>
                      </ReadOnlyBox>
                    ) : (
                      <Textarea
                        {...field}
                        placeholder="Descripción del tratamiento aplicado..."
                        disabled={loading}
                        className="w-full resize-none"
                        rows={3}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  disabled={loading || !isEditing}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Insumos Utilizados {isEditing ? '' : '(Opcional)'}</label>
                  {!isEditing && (
                    <Button
                      type="button"
                      onClick={agregarInsumo}
                      variant="outline"
                      size="sm"
                      disabled={loading || loadingInsumos || noInsumosDisponibles}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Insumo
                    </Button>
                  )}
                </div>

                {noInsumosDisponibles && !isEditing && (
                  <div className="p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
                    No hay insumos disponibles con stock suficiente (mínimo {STOCK_MINIMO} unidades)
                  </div>
                )}

                {insumosSeleccionados.map((insumo, index) => {
                  const cantidadValida = insumo.cantidad && insumo.stock ? 
                    validarCantidad(insumo.cantidad, insumo.stock) === true : true;
                  
                  return (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Insumo</label>
                          {isEditing ? (
                            <ReadOnlyBox className="rounded">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{insumo.nombre || 'Sin nombre'}</span>
                              </div>
                            </ReadOnlyBox>
                          ) : (
                            <Combobox
                              options={getOpcionesFiltradas(index)}
                              value={insumo.insumo_id}
                              onValueChange={(value) => actualizarInsumo(index, 'insumo_id', value)}
                              placeholder="Seleccionar insumo"
                              disabled={loading || loadingInsumos}
                              className="w-full text-sm sm:text-base"
                              truncate={true}
                            />
                          )}
                          {insumo.nombre && (
                            <div className="text-xs space-y-1">
                              <p className="text-muted-foreground">Stock: {insumo.stock} {insumo.unidad}</p>
                              {!isEditing && (
                                <p className="text-gray-600">
                                  Máximo: {Math.max(0, insumo.stock - STOCK_MINIMO)} {insumo.unidad}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium">Cantidad</label>
                          {isEditing ? (
                            <ReadOnlyBox className="flex justify-between items-center">
                              <span className="text-sm font-medium">{insumo.cantidad} {insumo.unidad}</span>
                            </ReadOnlyBox>
                          ) : (
                            <div className="space-y-1">
                              <Input
                                type="number"
                                min="1"
                                max={insumo.stock ? Math.max(1, Math.min(insumo.stock - STOCK_MINIMO, insumo.stock)) : undefined}
                                value={insumo.cantidad}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || /^\d*$/.test(value)) {
                                    actualizarInsumo(index, 'cantidad', value);
                                  }
                                }}
                                placeholder="Cantidad"
                                disabled={loading || !insumo.insumo_id}
                              />
                              {insumo.cantidad && insumo.stock && (
                                <div>
                                  {(() => {
                                    const validacion = validarCantidad(insumo.cantidad, insumo.stock);
                                    if (validacion !== true) {
                                      return <p className="text-xs text-red-500">{validacion}</p>;
                                    }
                                    const stockDespues = insumo.stock - parseInt(insumo.cantidad);
                                    return (
                                      <p className={`text-xs ${stockDespues < STOCK_MINIMO ? 'text-gray-600' : 'text-gray-600'}`}>
                                        Stock después: {stockDespues} {insumo.unidad}
                                        {stockDespues < STOCK_MINIMO && ' (Stock bajo)'}
                                      </p>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {!isEditing && (
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
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 sm:pt-4 flex gap-3">
              <Button 
                type="submit" 
                disabled={loading || (!isEditing && noInsumosDisponibles)}
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
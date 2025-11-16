import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMontaStore } from '@/store/montaStore' // ← AÑADE ESTA LÍNEA
import { useAnimalStore } from '@/store/animalStore'
import { useTypeStore } from '@/store/typeStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CalendarIcon } from 'lucide-react'
import { Combobox } from '@/components/ui/combobox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
const MontaForm = ({ 
  monta = null, 
  onSuccess,
}) => {
  const { createMonta, updateMonta, loading } = useMontaStore()
  const { animales, fetchAnimales } = useAnimalStore()
  const { eventTypes, fetchEventTypes } = useTypeStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [estadoMonta, setEstadoMonta] = useState(1)

  const form = useForm({
    defaultValues: {
      animal_hembra_id: '',
      animal_macho_id: '',
      tipo_evento_id: '',
      descripcion: '',
      fecha: new Date()
    }
  })

  useEffect(() => {
    fetchAnimales()
    fetchEventTypes()
  }, [fetchAnimales, fetchEventTypes])

  useEffect(() => {
    if (monta) {
      setIsEditing(true)
      setEstadoMonta(monta.estado ? 1 : 0)
      
      const fechaMonta = monta.fecha 
        ? new Date(monta.fecha)
        : new Date();
      
      form.reset({
        animal_hembra_id: monta.animal_hembra_id ? monta.animal_hembra_id.toString() : '',
        animal_macho_id: monta.animal_macho_id ? monta.animal_macho_id.toString() : '',
        tipo_evento_id: monta.tipo_evento_id ? monta.tipo_evento_id.toString() : '',
        descripcion: monta.descripcion || '',
        fecha: fechaMonta
      })
    } else {
      setIsEditing(false)
      setEstadoMonta(1)
      form.reset({
        animal_hembra_id: '',
        animal_macho_id: '',
        tipo_evento_id: '',
        descripcion: '',
        fecha: new Date()
      })
    }
  }, [monta, form])

  const onSubmit = async (data) => {
    setFormError('')
    setFieldErrors({})
    
    try {
      // SOLUCIÓN FECHAS: Formatear manualmente sin problemas de huso horario
      const fechaSeleccionada = new Date(data.fecha);
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;

      // EN MODO EDICIÓN: Solo enviar el estado
      const montaData = isEditing 
        ? {
            estado: estadoMonta === 1 // true para Completada, false para Pendiente
          }
        : {
            animal_hembra_id: parseInt(data.animal_hembra_id),
            animal_macho_id: data.animal_macho_id ? parseInt(data.animal_macho_id) : null,
            tipo_evento_id: parseInt(data.tipo_evento_id),
            descripcion: data.descripcion || null,
            estado: estadoMonta === 1,
            fecha: fechaFormateada
          }

      let result
      if (isEditing) {
        result = await updateMonta(monta.monta_id, montaData)
      } else {
        result = await createMonta(montaData)
      }

      if (result?.success) {
        form.reset()
        setEstadoMonta(1)
        onSuccess?.()
      } else {
        const errorMsg = result?.error || 'Error al procesar la solicitud'
        setFormError(errorMsg)
      }
    } catch (error) {
      setFormError('Error de conexión. Por favor, intente nuevamente.')
    }
  }

  const toggleEstado = () => {
    setEstadoMonta(prev => prev === 1 ? 0 : 1)
  }

  const calcularEdadEnMeses = (fechaNacimiento) => {
    const fechaNac = new Date(fechaNacimiento);
    const fechaActual = new Date();
    const diferenciaMeses = (fechaActual.getFullYear() - fechaNac.getFullYear()) * 12 + 
                           (fechaActual.getMonth() - fechaNac.getMonth());
    return diferenciaMeses;
  }

  const hembrasOptions = animales
    .filter(animal => 
      animal.sexo === 'H' && 
      !animal.deleted_at &&
      calcularEdadEnMeses(animal.fecha_nacimiento) >= 15
    )
    .map(animal => ({
      value: animal.animal_id.toString(),
      label: `${animal.arete} - ${animal.nombre || 'Sin nombre'} (${calcularEdadEnMeses(animal.fecha_nacimiento)} meses)`
    }))

  const machosOptions = animales
    .filter(animal => 
      animal.sexo === 'M' && 
      !animal.deleted_at &&
      calcularEdadEnMeses(animal.fecha_nacimiento) >= 18
    )
    .map(animal => ({
      value: animal.animal_id.toString(),
      label: `${animal.arete} - ${animal.nombre || 'Sin nombre'} (${calcularEdadEnMeses(animal.fecha_nacimiento)} meses)`
    }))

  const tipoEventoOptions = eventTypes
    .filter(tipo => !tipo.deleted_at)
    .map(tipo => ({
      value: tipo.tipo_evento_id.toString(),
      label: tipo.nombre
    }))

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-0">
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-6"
          >
            {formError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              {/* SOLO MOSTRAR CAMPOS COMPLETOS EN CREACIÓN */}
              {!isEditing && (
                <>
                  {/* Campo de Fecha con Calendario */}
                  <FormField
                    control={form.control}
                    name="fecha"
                    rules={{ 
                      required: "La fecha de la monta es obligatoria"
                    }}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha Programada de la Monta</FormLabel>
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
                                  <span>Seleccionar fecha programada</span>
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
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return date < today;
                              }}
                              initialFocus
                              locale={es}
                              fromDate={new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage>
                          {form.formState.errors.fecha?.message}
                        </FormMessage>
                        <div className="text-xs text-muted-foreground mt-1">
                          Seleccione la fecha programada para la monta (desde hoy en adelante)
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="animal_hembra_id"
                    rules={{ 
                      required: "La hembra es obligatoria"
                    }}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Hembra (Mínimo 15 meses)</FormLabel>
                        <FormControl>
                          <Combobox
                            options={hembrasOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Seleccionar hembra"
                            disabled={loading}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage>
                          {fieldErrors.animal_hembra_id || form.formState.errors.animal_hembra_id?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="animal_macho_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Macho (Opcional - Mínimo 18 meses)</FormLabel>
                        <FormControl>
                          <Combobox
                            options={machosOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Seleccionar macho (opcional)"
                            disabled={loading}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage>
                          {fieldErrors.animal_macho_id || form.formState.errors.animal_macho_id?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tipo_evento_id"
                    rules={{ 
                      required: "El tipo de evento es obligatorio"
                    }}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tipo de Evento</FormLabel>
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
                        <FormMessage>
                          {fieldErrors.tipo_evento_id || form.formState.errors.tipo_evento_id?.message}
                        </FormMessage>
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
                            placeholder="Observaciones o detalles adicionales de la monta programada..."
                            disabled={loading}
                            className="w-full resize-none"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage>
                          {form.formState.errors.descripcion?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="estado-monta">Estado de la Monta</Label>
                  <div className="text-sm text-muted-foreground">
                    {estadoMonta === 1 ? 'Completada' : 'Pendiente'}
                  </div>
                </div>
                <Switch
                  id="estado-monta"
                  checked={estadoMonta === 1}
                  onCheckedChange={toggleEstado}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="pt-2 sm:pt-4 flex">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
                variant="reproduccion"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Estado' : 'Programar Monta'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default MontaForm
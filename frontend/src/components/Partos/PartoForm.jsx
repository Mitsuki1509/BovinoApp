import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { usePartoStore } from '@/store/partoStore'
import { useDiagnosticoStore } from '@/store/diagnosticoStore'
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
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const PartoForm = ({ 
  parto = null, 
  onSuccess,
}) => {
  const { createParto, updateParto, loading } = usePartoStore()
  const { diagnosticos, fetchDiagnosticos } = useDiagnosticoStore()
  const { eventTypes, fetchEventTypes } = useTypeStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const form = useForm({
    defaultValues: {
      prenez_id: '',
      tipo_evento_id: '',
      descripcion: '',
      fecha: new Date()
    }
  })

  useEffect(() => {
    fetchDiagnosticos()
    fetchEventTypes()
  }, [fetchDiagnosticos, fetchEventTypes])

  useEffect(() => {
    if (parto) {
      setIsEditing(true)
      form.reset({
        prenez_id: parto.prenez_id ? parto.prenez_id.toString() : '',
        tipo_evento_id: parto.tipo_evento_id ? parto.tipo_evento_id.toString() : '',
        descripcion: parto.descripcion || '',
        fecha: parto.fecha ? new Date(parto.fecha) : new Date()
      })
    } else {
      setIsEditing(false)
      form.reset({
        prenez_id: '',
        tipo_evento_id: '',
        descripcion: '',
        fecha: new Date()
      })
    }
  }, [parto, form])

  const onSubmit = async (data) => {
    setFormError('')
    setFieldErrors({})
    
    try {
    const fechaParto = new Date(data.fecha);
    const year = fechaParto.getFullYear();
    const month = String(fechaParto.getMonth() + 1).padStart(2, '0');
    const day = String(fechaParto.getDate()).padStart(2, '0');
    const fechaFormateada = `${year}-${month}-${day}`; 
    
      const partoData = {
        prenez_id: parseInt(data.prenez_id),
        tipo_evento_id: parseInt(data.tipo_evento_id),
        descripcion: data.descripcion || null,
        fecha: fechaFormateada
      }
      let result
      if (isEditing) {
        result = await updateParto(parto.evento_id, partoData)
      } else {
        result = await createParto(partoData)
      }

      console.log('Respuesta del servidor:', result)

      if (result?.success) {
        form.reset()
        onSuccess?.()
      } else {
        const errorMsg = result?.error || 'Error al procesar la solicitud'
        setFormError(errorMsg)

        if (result.error?.includes('diagnóstico') || result.error?.includes('diagnostico')) {
          setFieldErrors(prev => ({ ...prev, prenez_id: 'Diagnóstico no válido' }))
        }
        if (result.error?.includes('tipo de evento')) {
          setFieldErrors(prev => ({ ...prev, tipo_evento_id: 'Tipo de evento no válido' }))
        }
        if (result.error?.includes('fecha')) {
          setFieldErrors(prev => ({ ...prev, fecha: 'Fecha no válida' }))
        }
      }
    } catch (error) {
      console.error('Error en onSubmit:', error)
      setFormError('Error de conexión. Por favor, intente nuevamente.')
    }
  }

  const diagnosticosPositivos = diagnosticos.filter(diagnostico => 
    diagnostico.resultado === true && !diagnostico.deleted_at
  )

  const diagnosticosOptions = diagnosticosPositivos.map(diagnostico => ({
  value: diagnostico.prenez_id.toString(),
  label: `${diagnostico.monta?.numero_monta} - Hembra: ${diagnostico.monta?.hembra?.arete || 'N/A'}`
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
              <FormField
                control={form.control}
                name="prenez_id"
                rules={{ 
                  required: "El diagnóstico es obligatorio"
                }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Diagnóstico de Preñez Positivo</FormLabel>
                    <FormControl>
                      <Combobox
                        options={diagnosticosOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar diagnóstico positivo"
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.ponez_id || form.formState.errors.ponez_id?.message}
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
                name="fecha"
                rules={{ 
                  required: "La fecha del parto es requerida"
                }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha del Parto</FormLabel>
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
                      {fieldErrors.fecha || form.formState.errors.fecha?.message}
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
                        placeholder="Observaciones o detalles del parto..."
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
            </div>

            <div className="pt-2 sm:pt-4 flex gap-3">
            
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
                variant="reproduccion"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Parto' : 'Registrar Parto'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default PartoForm
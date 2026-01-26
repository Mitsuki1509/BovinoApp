import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDiagnosticoStore } from '@/store/diagnosticoStore'
import { useMontaStore } from '@/store/montaStore'
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
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const DiagnosticoForm = ({ 
  diagnostico = null, 
  onSuccess,
}) => {
  const { createDiagnostico, updateDiagnostico, loading } = useDiagnosticoStore()
  const { montas, fetchMontas } = useMontaStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const form = useForm({
    defaultValues: {
      monta_id: '',
      metodo: '',
      resultado: false,
      fecha_probable_parto: undefined
    }
  })

  const resultado = form.watch('resultado')
  const fechaProbableParto = form.watch('fecha_probable_parto')

  useEffect(() => {
    fetchMontas()
  }, [fetchMontas])

  useEffect(() => {
    if (diagnostico) {
      setIsEditing(true)
      const fechaParto = diagnostico.fecha_probable_parto ? 
        new Date(diagnostico.fecha_probable_parto) : undefined
      
      form.reset({
        monta_id: diagnostico.monta_id ? diagnostico.monta_id.toString() : '',
        metodo: diagnostico.metodo || '',
        resultado: diagnostico.resultado || false,
        fecha_probable_parto: fechaParto
      })
    } else {
      setIsEditing(false)
      form.reset({
        monta_id: '',
        metodo: '',
        resultado: false,
        fecha_probable_parto: undefined
      })
    }
  }, [diagnostico, form])

  useEffect(() => {
    if (resultado && !fechaProbableParto) {
      const fechaCalculada = calcularFechaParto()
      form.setValue('fecha_probable_parto', fechaCalculada)
    }
  }, [resultado, fechaProbableParto, form])

  const onSubmit = async (data) => {
    setFormError('')
    setFieldErrors({})
    
    try {
        
        let fechaPartoFormateada = null;
        
        if (!data.monta_id) {
            setFormError('La monta es requerida')
            return
        }

        if (!data.metodo || data.metodo.trim() === '') {
            setFormError('El método de diagnóstico es requerido')
            return
        }

        if (data.resultado) {
            if (!data.fecha_probable_parto) {
                setFormError('La fecha probable de parto es requerida para diagnósticos positivos')
                return
            }
            
            const fecha = new Date(data.fecha_probable_parto);
            if (isNaN(fecha.getTime())) {
                setFormError('La fecha probable de parto no es válida')
                return
            }
            
            fechaPartoFormateada = fecha.toISOString().split('T')[0];
        }

        const diagnosticoData = {
            monta_id: parseInt(data.monta_id),
            metodo: data.metodo.trim(),
            resultado: data.resultado,
            fecha_probable_parto: fechaPartoFormateada
        }

        let result
        if (isEditing) {
            result = await updateDiagnostico(diagnostico.prenez_id, diagnosticoData)
        } else {
            result = await createDiagnostico(diagnosticoData)
        }

        if (result?.success) {
            form.reset()
            onSuccess?.()
        } else {
            const errorMsg = result?.error || 'Error al procesar la solicitud'
            setFormError(errorMsg)
        }
    } catch (error) {
        setFormError('Error de conexión. Por favor, intente nuevamente.')
    }
}

  const calcularFechaParto = () => {
    const hoy = new Date();
    const fechaParto = new Date(hoy);
    fechaParto.setDate(hoy.getDate() + 283); 
    return fechaParto;
  }

  const montasOptions = montas
    .filter(monta => 
      !monta.deleted_at &&
      monta.estado === true &&
      (!monta.diagnosticos || monta.diagnosticos.length === 0) 
    )
    .map(monta => ({
      value: monta.monta_id.toString(),
      label: `${monta.numero_monta} - Hembra: ${monta.hembra?.arete || 'N/A'} ${monta.macho ? `- Macho: ${monta.macho?.arete}` : ''}`
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
                name="monta_id"
                rules={{ 
                  required: "La monta es obligatoria"
                }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Monta</FormLabel>
                    <FormControl>
                      <Combobox
                        options={montasOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar monta"
                        disabled={loading || isEditing} 
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.monta_id || form.formState.errors.monta_id?.message}
                    </FormMessage>
                    <div className="text-xs text-muted-foreground mt-1">
                      {isEditing 
                        ? "No se puede cambiar la monta en edición" 
                        : "Solo se muestran montas activas sin diagnóstico previo"
                      }
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metodo"
                rules={{ 
                  required: "El método de diagnóstico es obligatorio",
                  minLength: {
                    value: 2,
                    message: "El método debe tener al menos 2 caracteres"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Diagnóstico</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: Palpación rectal, Ultrasonido, etc."
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.metodo || form.formState.errors.metodo?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resultado"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Resultado del Diagnóstico
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? 'Preñez Positiva' : 'Preñez Negativa'}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {resultado && (
                <FormField
                  control={form.control}
                  name="fecha_probable_parto"
                  rules={{ 
                    required: resultado ? "La fecha probable de parto es requerida" : false,
                    validate: {
                      isFuture: (value) => {
                        if (!value) return true;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const selectedDate = new Date(value);
                        selectedDate.setHours(0, 0, 0, 0);
                        return selectedDate >= today || "La fecha debe ser hoy o en el futuro"
                      }
                    }
                  }}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha Probable de Parto</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn("w-full justify-start text-left font-normal h-9", !field.value && "text-muted-foreground")}
                              disabled={loading}
                            >
                              <CalendarIcon className="mr-2 h-3 w-3"/>
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date)
                            }}
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
                      <div className="text-xs text-muted-foreground mt-1">
                        {field.value ? (
                          `Fecha seleccionada: ${format(field.value, "dd/MM/yyyy")}`
                        ) : (
                          "Fecha calculada automáticamente (283 días de gestación)"
                        )}
                      </div>
                      <FormMessage>
                        {fieldErrors.fecha_probable_parto || form.formState.errors.fecha_probable_parto?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="pt-2 sm:pt-4 flex gap-3">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
                variant="reproduccion"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Diagnóstico' : 'Crear Diagnóstico'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default DiagnosticoForm
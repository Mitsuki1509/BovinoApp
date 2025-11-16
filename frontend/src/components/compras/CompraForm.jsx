import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCompraStore } from '@/store/compraStore'
import { useProveedorStore } from '@/store/proveedorStore'
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
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const CompraForm = ({ 
  compra = null, 
  onSuccess,
}) => {
  const { createCompra, updateCompra, loading } = useCompraStore()
  const { proveedores, fetchProveedores } = useProveedorStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const form = useForm({
    defaultValues: {
      proveedor_id: '',
      fecha: new Date()
    }
  })

  useEffect(() => {
    fetchProveedores()
  }, [fetchProveedores])

  useEffect(() => {
    if (compra) {
      setIsEditing(true)
      form.reset({
        proveedor_id: compra.proveedor_id ? compra.proveedor_id.toString() : '',
        fecha: compra.fecha ? new Date(compra.fecha) : new Date()
      })
    } else {
      setIsEditing(false)
      form.reset({
        proveedor_id: '',
        fecha: new Date()
      })
    }
  }, [compra, form])

  const onSubmit = async (data) => {
    setFormError('')
    setFieldErrors({})
    
    try {
      const compraData = {
        proveedor_id: parseInt(data.proveedor_id),
        fecha: data.fecha.toISOString().split('T')[0] 
      }

      let result
      if (isEditing) {
        result = await updateCompra(compra.compra_id, compraData)
      } else {
        result = await createCompra(compraData)
      }

      if (result?.success) {
        form.reset()
        onSuccess?.()
      } else {
        const errorMsg = result?.error || 'Error al procesar la solicitud'
        
        if (errorMsg.includes('validación') || errorMsg.includes('validacion')) {
          setFormError('Por favor, verifique que todos los campos estén completos correctamente.')
        } else if (errorMsg.includes('proveedor') || errorMsg.includes('Proveedor')) {
          setFieldErrors({
            proveedor_id: 'El proveedor es requerido'
          })
        } else if (errorMsg.includes('fecha') || errorMsg.includes('Fecha')) {
          setFieldErrors({
            fecha: 'La fecha es requerida y no puede ser futura'
          })
        } else if (errorMsg.includes('permisos') || errorMsg.includes('permiso')) {
          setFormError('No tiene permisos para realizar esta acción. Solo administradores y contables pueden gestionar compras.')
        } else if (errorMsg.includes('número') || errorMsg.includes('numero')) {
          setFormError('Error al generar el número de compra. Por favor, intente nuevamente.')
        } else {
          setFormError(`Error: ${errorMsg}. Por favor, verifique los datos e intente nuevamente.`)
        }
      }
    } catch (error) {
      setFormError('Error de conexión. Por favor, intente nuevamente.')
    }
  }

  // Función para comparar fechas sin considerar la hora
  const isDateFuture = (date) => {
    const today = new Date();
    const selectedDate = new Date(date);
    
    // Establecer ambas fechas a medianoche para comparar solo la fecha
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    return selectedDate > today;
  };

  const proveedorOptions = proveedores.map(proveedor => ({
    value: proveedor.proveedor_id.toString(),
    label: `${proveedor.nombre_compañia} - ${proveedor.nombre_contacto || 'Sin contacto'}`
  }))

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
                name="proveedor_id"
                rules={{ 
                  required: "El proveedor es obligatorio"
                }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Proveedor </FormLabel>
                    <FormControl>
                      <Combobox
                        options={proveedorOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar proveedor"
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.proveedor_id || form.formState.errors.proveedor_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha"
                rules={{ 
                  required: "La fecha es requerida",
                  validate: {
                    notFuture: (value) => {
                      return !isDateFuture(value) || "La fecha no puede ser futura"
                    }
                  }
                }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Compra </FormLabel>
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
                          disabled={(date) => isDateFuture(date)}
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
                variant="inventario"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Compra' : 'Crear Compra'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default CompraForm
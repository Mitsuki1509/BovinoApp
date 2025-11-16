import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDetalleCompraStore } from '@/store/detalleCompraStore'
import { useInsumoStore } from '@/store/insumoStore'
import { useCompraStore } from '@/store/compraStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { Combobox } from '@/components/ui/combobox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const DetalleCompraForm = ({ 
  onSuccess,
}) => {
  const { createDetalleCompra, loading } = useDetalleCompraStore()
  const { insumos, fetchInsumos } = useInsumoStore()
  const { compras, fetchCompras } = useCompraStore()
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const form = useForm({
    defaultValues: {
      compra_id: '',
      insumo_id: '',
      precio: '',
      cantidad: ''
    }
  })

  useEffect(() => {
    fetchInsumos()
    fetchCompras()
  }, [fetchInsumos, fetchCompras])

  const onSubmit = async (data) => {
    setFormError('')
    setFieldErrors({})
    
    try {
      const detalleData = {
        compra_id: parseInt(data.compra_id),
        insumo_id: parseInt(data.insumo_id),
        precio: parseFloat(data.precio),
        cantidad: parseInt(data.cantidad)
      }

      const result = await createDetalleCompra(detalleData)

      if (result?.success) {
        form.reset()
        onSuccess?.()
      } else {
        const errorMsg = result?.error || 'Error al procesar la solicitud'
        
        if (errorMsg.includes('validación') || errorMsg.includes('validacion')) {
          setFormError('Por favor, verifique que todos los campos estén completos correctamente.')
        } else if (errorMsg.includes('compra') || errorMsg.includes('Compra')) {
          setFieldErrors({
            compra_id: 'La compra es requerida'
          })
        } else if (errorMsg.includes('insumo') || errorMsg.includes('Insumo')) {
          setFieldErrors({
            insumo_id: 'El insumo es requerido'
          })
        } else if (errorMsg.includes('precio') || errorMsg.includes('Precio')) {
          setFieldErrors({
            precio: 'El precio debe ser mayor a 0'
          })
        } else if (errorMsg.includes('cantidad') || errorMsg.includes('Cantidad')) {
          setFieldErrors({
            cantidad: 'La cantidad debe ser mayor a 0'
          })
        } else if (errorMsg.includes('permisos') || errorMsg.includes('permiso')) {
          setFormError('No tiene permisos para realizar esta acción. Solo administradores y contables pueden gestionar detalles de compra.')
        } else if (errorMsg.includes('existe') || errorMsg.includes('duplicado')) {
          setFieldErrors({
            insumo_id: 'Ya existe un detalle para este insumo en la compra'
          })
        } else {
          setFormError(`Error: ${errorMsg}. Por favor, verifique los datos e intente nuevamente.`)
        }
      }
    } catch (error) {
      setFormError('Error de conexión. Por favor, intente nuevamente.')
    }
  }

  const compraOptions = compras.map(compra => ({
    value: compra.compra_id.toString(),
    label: `${compra.numero_compra} - ${compra.proveedor?.nombre_compañia || 'Sin proveedor'}`
  }))

  const insumoOptions = insumos.map(insumo => ({
    value: insumo.insumo_id.toString(),
    label: `${insumo.nombre} - ${insumo.tipo_insumo?.nombre || 'Sin tipo'} - ${insumo.unidad?.nombre || 'Sin unidad'}`
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
                name="compra_id"
                rules={{ 
                  required: "La compra es obligatoria"
                }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Número de Compra </FormLabel>
                    <FormControl>
                      <Combobox
                        options={compraOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar compra"
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.compra_id || form.formState.errors.compra_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insumo_id"
                rules={{ 
                  required: "El insumo es obligatorio"
                }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Insumo </FormLabel>
                    <FormControl>
                      <Combobox
                        options={insumoOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar insumo"
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.insumo_id || form.formState.errors.insumo_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="precio"
                  rules={{ 
                    required: "El precio es requerido",
                    min: {
                      value: 0.01,
                      message: "El precio debe ser mayor a 0"
                    },
                    pattern: {
                      value: /^\d+(\.\d{1,2})?$/,
                      message: "El precio debe ser un número válido (ej: 10.50)"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Unitario </FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          {...field} 
                          disabled={loading}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage>
                        {fieldErrors.precio || form.formState.errors.precio?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cantidad"
                  rules={{ 
                    required: "La cantidad es requerida",
                    min: {
                      value: 1,
                      message: "La cantidad debe ser mayor a 0"
                    },
                    pattern: {
                      value: /^\d+$/,
                      message: "La cantidad debe ser un número entero"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad </FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          placeholder="0"
                          {...field} 
                          disabled={loading}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage>
                        {fieldErrors.cantidad || form.formState.errors.cantidad?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="pt-2 sm:pt-4 flex">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
                variant="inventario"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Agregar Insumo
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default DetalleCompraForm
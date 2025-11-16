import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLoteStore } from '@/store/loteStore'
import { usePotreroStore } from '@/store/potreroStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

const LoteForm = ({ 
  lote = null, 
  onSuccess,
}) => {
  const { createLote, updateLote, loading } = useLoteStore()
  const { potreros, fetchPotreros } = usePotreroStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const form = useForm({
    defaultValues: {
      codigo: '',
      descripcion: '',
      potrero_id: ''
    }
  })

  useEffect(() => {
    fetchPotreros()
  }, [fetchPotreros])

  useEffect(() => {
    if (lote) {
      setIsEditing(true)
      form.reset({
        codigo: lote.codigo || '',
        descripcion: lote.descripcion || '',
        potrero_id: lote.potrero_id ? lote.potrero_id.toString() : ''
      })
    } else {
      setIsEditing(false)
      form.reset({
        codigo: '',
        descripcion: '',
        potrero_id: ''
      })
    }
  }, [lote, form])

  const onSubmit = async (data) => {
    setFormError('')
    setFieldErrors({})
    
    try {
      const loteData = {
        codigo: data.codigo.trim(),
        descripcion: data.descripcion.trim(),
        potrero_id: parseInt(data.potrero_id)
      }

      let result
      if (isEditing) {
        result = await updateLote(lote.lote_id, loteData)
      } else {
        result = await createLote(loteData)
      }

      if (result?.success) {
        form.reset()
        onSuccess?.()
      } else {
        const errorMsg = result?.error || 'Error al procesar la solicitud'
        
        if (errorMsg.includes('validación') || errorMsg.includes('validacion')) {
          setFormError('Por favor, verifique que todos los campos estén completos correctamente.')
        } else if (errorMsg.includes('código') || errorMsg.includes('codigo') || errorMsg.includes('existe')) {
          setFieldErrors({
            codigo: 'Ya existe un lote con este código. Por favor, use un código diferente.'
          })
        } else if (errorMsg.includes('descripción') || errorMsg.includes('descripcion')) {
          setFieldErrors({
            descripcion: 'La descripción es requerida'
          })
        } else if (errorMsg.includes('potrero') || errorMsg.includes('Potrero')) {
          setFieldErrors({
            potrero_id: 'El potrero es requerido'
          })
        } else if (errorMsg.includes('permisos') || errorMsg.includes('permiso')) {
          setFormError('No tiene permisos para realizar esta acción. Solo administradores y operarios pueden gestionar lotes.')
        } else {
          setFormError(`Error: ${errorMsg}. Por favor, verifique los datos e intente nuevamente.`)
        }
      }
    } catch (error) {
      setFormError('Error de conexión. Por favor, intente nuevamente.')
    }
  }

  const potreroOptions = potreros.map(potrero => ({
    value: potrero.potrero_id.toString(),
    label: potrero.ubicacion
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
                name="codigo"
                rules={{ 
                  required: "El código del lote es obligatorio",
                  minLength: {
                    value: 1,
                    message: "El código del lote es requerido"
                  },
                  maxLength: {
                    value: 50,
                    message: "El código no puede tener más de 50 caracteres"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel >Código del Lote </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: LOTE-001" 
                        {...field} 
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.codigo || form.formState.errors.codigo?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descripcion"
                rules={{ 
                  required: "La descripción es requerida",
                  minLength: {
                    value: 1,
                    message: "La descripción es requerida"
                  },
                  maxLength: {
                    value: 1000,
                    message: "La descripción no puede tener más de 1000 caracteres"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción del Lote</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ingrese la descripción del lote" 
                        {...field} 
                        disabled={loading}
                        className="w-full min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.descripcion || form.formState.errors.descripcion?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="potrero_id"
                rules={{ 
                  required: "El potrero es requerido"
                }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Potrero Asociado </FormLabel>
                    <FormControl>
                      <Combobox
                        options={potreroOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar potrero"
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.potrero_id || form.formState.errors.potrero_id?.message}
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
                variant="ganado"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Lote' : 'Crear Lote'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default LoteForm
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLoteStore } from '@/store/loteStore'
import { usePotreroStore } from '@/store/potreroStore'
import { Button } from '@/components/ui/button'
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
        descripcion: lote.descripcion || '',
        potrero_id: lote.potrero_id ? lote.potrero_id.toString() : ''
      })
    } else {
      setIsEditing(false)
      form.reset({
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
        descripcion: data.descripcion.trim(),
      }

      if (data.potrero_id && data.potrero_id !== '') {
        loteData.potrero_id = parseInt(data.potrero_id)
      } else {
        loteData.potrero_id = null
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
        } else if (errorMsg.includes('descripción') || errorMsg.includes('descripcion')) {
          setFieldErrors({
            descripcion: 'La descripción es requerida'
          })
        } else if (errorMsg.includes('potrero') || errorMsg.includes('Potrero')) {
          setFieldErrors({
            potrero_id: 'El potrero especificado no existe'
          })
        } else if (errorMsg.includes('permisos') || errorMsg.includes('permiso')) {
          setFormError('No tiene permisos para realizar esta acción. Solo administradores y operarios pueden gestionar lotes.')
        } else if (errorMsg.includes('animales')) {
          setFormError('No se puede eliminar el lote porque tiene animales asignados.')
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

  const allPotreroOptions = [
    { value: '', label: 'Sin potrero asignado' },
    ...potreroOptions
  ]

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-none">
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
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Potrero Asociado (Opcional)</FormLabel>
                    <FormControl>
                      <Combobox
                        options={allPotreroOptions}
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

            <div className="flex pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
                size="lg"
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
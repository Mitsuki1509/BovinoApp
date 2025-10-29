import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTypeStore } from '@/store/typeStore'
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

const TypeForm = ({ 
  type = null, 
  onSuccess,
}) => {
  const { createEventType, updateEventType, parentEventTypes, fetchParentEventTypes, loading } = useTypeStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const form = useForm({
    defaultValues: {
      nombre: '',
      padre_id: ''
    }
  })

  useEffect(() => {
    fetchParentEventTypes();
  }, [fetchParentEventTypes])

  useEffect(() => {
    if (type) {
      setIsEditing(true);
      const padreIdValue = type.padre_id ? type.padre_id.toString() : 
                          type.padre?.tipo_evento_id ? type.padre.tipo_evento_id.toString() : '';
      
      form.reset({
        nombre: type.nombre || '',
        padre_id: padreIdValue
      })
    } else {
      setIsEditing(false);
      form.reset({
        nombre: '',
        padre_id: ''
      })
    }
  }, [type, form])

  const onSubmit = async (data) => {
    setFormError('');
    setFieldErrors({});
    
    try {
      const typeData = {
        nombre: data.nombre.trim(),
      };

      if (data.padre_id && data.padre_id !== '') {
        typeData.padre_id = parseInt(data.padre_id);
      } else {
        typeData.padre_id = null;
      }


      let result;
      if (isEditing) {
        result = await updateEventType(type.tipo_evento_id, typeData);
      } else {
        result = await createEventType(typeData);
      }

      if (result?.success) {
        form.reset();
        onSuccess?.();
      } else {
        const errorMsg = result?.error || 'Error al procesar la solicitud';
        
        if (errorMsg.includes('validación') || errorMsg.includes('validacion')) {
          setFormError('Por favor, verifique que todos los campos estén completos correctamente.');
        } else if (errorMsg.includes('nombre') || errorMsg.includes('Nombre') || errorMsg.includes('existe')) {
          setFieldErrors({
            nombre: 'Ya existe un tipo de evento con este nombre. Por favor, use un nombre diferente.'
          });
        } else if (errorMsg.includes('padre') || errorMsg.includes('Padre') || errorMsg.includes('jerarquía')) {
          setFieldErrors({
            padre_id: errorMsg
          });
        } else {
          setFormError(`Error: ${errorMsg}. Por favor, verifique los datos e intente nuevamente.`);
        }
      }
    } catch (error) {
      setFormError('Error de conexión. Por favor, intente nuevamente.');
    }
  }

  const parentTypeOptions = parentEventTypes.map(type => ({
    value: type.tipo_evento_id.toString(),
    label: type.nombre
  }))

  const allParentOptions = [
    { value: '', label: 'Sin evento asociado (categoría principal)' },
    ...parentTypeOptions
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
                name="nombre"
                rules={{ 
                  required: "El nombre es requerido",
                  minLength: {
                    value: 1,
                    message: "El nombre es requerido"
                  },
                  maxLength: {
                    value: 255,
                    message: "El nombre no puede tener más de 255 caracteres"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Evento</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ingrese el nombre del tipo de evento" 
                        {...field} 
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.nombre || form.formState.errors.nombre?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="padre_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tipo asociado (Opcional)</FormLabel>
                    <FormControl>
                      <Combobox
                        options={allParentOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar evento asociado"
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.padre_id || form.formState.errors.padre_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex  pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
                size="lg"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Tipo' : 'Crear Tipo'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default TypeForm
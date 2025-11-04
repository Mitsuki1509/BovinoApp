import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRazaStore } from '@/store/razaStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const RazaForm = ({ 
  raza = null, 
  onSuccess
}) => {
  const { createRaza, updateRaza, loading } = useRazaStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const form = useForm({
    defaultValues: {
      nombre: '',
      descripcion: ''
    }
  })

  useEffect(() => {
    if (raza) {
      setIsEditing(true);
      form.reset({
        nombre: raza.nombre || '',
        descripcion: raza.descripcion || ''
      })
    } else {
      setIsEditing(false);
      form.reset({
        nombre: '',
        descripcion: ''
      })
    }
  }, [raza, form])

  const onSubmit = async (data) => {
    setFormError('');
    setFieldErrors({});
    
    try {
      const razaData = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null
      };

      let result;
      if (isEditing) {
        result = await updateRaza(raza.raza_id, razaData);
      } else {
        result = await createRaza(razaData);
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
            nombre: 'Ya existe una raza con este nombre. Por favor, use un nombre diferente.'
          });
        } else {
          setFormError(`Error: ${errorMsg}. Por favor, verifique los datos e intente nuevamente.`);
        }
      }
    } catch (error) {
      setFormError('Error de conexión. Por favor, intente nuevamente.');
    }
  }

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {formError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {formError}
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              <FormField
                control={form.control}
                name="nombre"
                rules={{ 
                  required: "El nombre es requerido",
                  minLength: {
                    value: 2,
                    message: "El nombre debe tener al menos 2 caracteres"
                  },
                  maxLength: {
                    value: 100,
                    message: "El nombre no puede tener más de 100 caracteres"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Nombre de la Raza</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ingrese el nombre de la raza" 
                        {...field} 
                        disabled={loading}
                        className="w-full text-sm sm:text-base"
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm">
                      {fieldErrors.nombre || form.formState.errors.nombre?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descripcion"
                rules={{
                  maxLength: {
                    value: 500,
                    message: "La descripción no puede tener más de 500 caracteres"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ingrese una descripción para la raza (características, origen, etc.)"
                        {...field} 
                        disabled={loading}
                        className="w-full text-sm sm:text-base min-h-[100px] resize-vertical"
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm">
                      {fieldErrors.descripcion || form.formState.errors.descripcion?.message}
                    </FormMessage>
                    <div className="text-xs text-gray-500">
                      {field.value?.length || 0}/500 caracteres
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-2 sm:pt-4 flex">
            
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1 text-sm sm:text-base"
                size="lg"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Raza' : 'Crear Raza'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default RazaForm
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { usePotreroStore } from '@/store/potreroStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const PotreroForm = ({ 
  potrero = null, 
  onSuccess,
}) => {
  const { createPotrero, updatePotrero, loading } = usePotreroStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const form = useForm({
    defaultValues: {
      ubicacion: ''
    }
  })

  useEffect(() => {
    if (potrero) {
      setIsEditing(true);
      form.reset({
        ubicacion: potrero.ubicacion || ''
      })
    } else {
      setIsEditing(false);
      form.reset({
        ubicacion: ''
      })
    }
  }, [potrero, form])

  const onSubmit = async (data) => {
    setFormError('');
    setFieldErrors({});
    
    try {
      const potreroData = {
        ubicacion: data.ubicacion.trim()
      };

      let result;
      if (isEditing) {
        result = await updatePotrero(potrero.potrero_id, potreroData);
      } else {
        result = await createPotrero(potreroData);
      }

      if (result?.success) {
        form.reset();
        onSuccess?.();
      } else {
        const errorMsg = result?.error || 'Error al procesar la solicitud';
        
        if (errorMsg.includes('validación') || errorMsg.includes('validacion')) {
          setFormError('Por favor, verifique que todos los campos estén completos correctamente.');
        } else if (errorMsg.includes('ubicación') || errorMsg.includes('ubicacion') || errorMsg.includes('existe')) {
          setFieldErrors({
            ubicacion: 'Ya existe un potrero con esta ubicación. Por favor, use una ubicación diferente.'
          });
        } else if (errorMsg.includes('permisos') || errorMsg.includes('permiso')) {
          setFormError('No tiene permisos para realizar esta acción. Solo administradores y operarios pueden gestionar potreros.');
        } else if (errorMsg.includes('lotes')) {
          setFormError('No se puede eliminar el potrero porque está asignado a uno o más lotes.');
        } else {
          setFormError(`Error: ${errorMsg}. Por favor, verifique los datos e intente nuevamente.`);
        }
      }
    } catch (error) {
      setFormError('Error de conexión. Por favor, intente nuevamente.');
    }
  }

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
                name="ubicacion"
                rules={{ 
                  required: "La ubicación es requerida",
                  minLength: {
                    value: 1,
                    message: "La ubicación es requerida"
                  },
                  maxLength: {
                    value: 255,
                    message: "La ubicación no puede tener más de 255 caracteres"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación del Potrero</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ingrese la ubicación del potrero" 
                        {...field} 
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.ubicacion || form.formState.errors.ubicacion?.message}
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
                {isEditing ? 'Actualizar Potrero' : 'Crear Potrero'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default PotreroForm
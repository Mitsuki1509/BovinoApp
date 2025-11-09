import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useProveedorStore } from '@/store/proveedorStore'
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

const ProveedorForm = ({ 
  proveedor = null, 
  onSuccess
}) => {
  const { createProveedor, updateProveedor, loading } = useProveedorStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const form = useForm({
    defaultValues: {
      nombre_compañia: '',
      nombre_contacto: '',
      telefono_local: ''
    }
  })

  useEffect(() => {
    if (proveedor) {
      setIsEditing(true);
      form.reset({
        nombre_compañia: proveedor.nombre_compañia || '',
        nombre_contacto: proveedor.nombre_contacto || '',
        telefono_local: proveedor.telefono_local || ''
      })
    } else {
      setIsEditing(false);
      form.reset({
        nombre_compañia: '',
        nombre_contacto: '',
        telefono_local: ''
      })
    }
  }, [proveedor, form])

  const onSubmit = async (data) => {
    setFormError('');
    setFieldErrors({});
    
    try {
      const proveedorData = {
        nombre_compañia: data.nombre_compañia.trim(),
        nombre_contacto: data.nombre_contacto.trim(),
        telefono_local: data.telefono_local.trim()
      };

      let result;
      if (isEditing) {
        result = await updateProveedor(proveedor.proveedor_id, proveedorData);
      } else {
        result = await createProveedor(proveedorData);
      }

      if (result?.success) {
        form.reset();
        onSuccess?.();
      } else {
        const errorMsg = result?.error || 'Error al procesar la solicitud';
        
        if (errorMsg.includes('validación') || errorMsg.includes('validacion')) {
          setFormError('Por favor, verifique que todos los campos estén completos correctamente.');
        } else if (errorMsg.includes('compañía') || errorMsg.includes('compañia') || errorMsg.includes('existe')) {
          setFieldErrors({
            nombre_compañia: 'Ya existe un proveedor con este nombre. Por favor, use un nombre diferente.'
          });
        } else if (errorMsg.includes('teléfono') || errorMsg.includes('telefono') || errorMsg.includes('8 dígitos')) {
          setFieldErrors({
            telefono_local: 'El teléfono debe tener exactamente 8 dígitos numéricos.'
          });
        } else {
          setFormError(`Error: ${errorMsg}. Por favor, verifique los datos e intente nuevamente.`);
        }
      }
    } catch (error) {
      setFormError('Error de conexión. Por favor, intente nuevamente.');
    }
  }

  const formatTelefono = (value) => {
    return value.replace(/\D/g, '').slice(0, 8);
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
                name="nombre_compañia"
                rules={{ 
                  required: "El nombre de la compañía es requerido",
                  minLength: {
                    value: 2,
                    message: "El nombre debe tener al menos 2 caracteres"
                  },
                  maxLength: {
                    value: 255,
                    message: "El nombre no puede tener más de 255 caracteres"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Nombre de la Compañía</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ingrese el nombre de la compañía" 
                        {...field} 
                        disabled={loading}
                        className="w-full text-sm sm:text-base"
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm">
                      {fieldErrors.nombre_compañia || form.formState.errors.nombre_compañia?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nombre_contacto"
                rules={{ 
                  required: "El nombre del contacto es requerido",
                  minLength: {
                    value: 2,
                    message: "El nombre debe tener al menos 2 caracteres"
                  },
                  maxLength: {
                    value: 255,
                    message: "El nombre no puede tener más de 255 caracteres"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Nombre del Contacto</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ingrese el nombre de la persona de contacto" 
                        {...field} 
                        disabled={loading}
                        className="w-full text-sm sm:text-base"
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm">
                      {fieldErrors.nombre_contacto || form.formState.errors.nombre_contacto?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono_local"
                rules={{ 
                  required: "El teléfono es requerido",
                  pattern: {
                    value: /^[0-9]{8}$/,
                    message: "El teléfono debe tener exactamente 8 dígitos"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Teléfono (8 dígitos)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500 text-sm">505</span>
                        </div>
                        <Input 
                          placeholder="12345678"
                          {...field}
                          onChange={(e) => {
                            const formattedValue = formatTelefono(e.target.value);
                            field.onChange(formattedValue);
                          }}
                          disabled={loading}
                          className="w-full text-sm sm:text-base pl-12"
                          maxLength={8}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm">
                      {fieldErrors.telefono_local || form.formState.errors.telefono_local?.message}
                    </FormMessage>
                    <div className="text-xs text-gray-500">
                      Teléfono completo: 505{field.value || 'XXXXXXX'}
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
                {isEditing ? 'Actualizar Proveedor' : 'Crear Proveedor'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default ProveedorForm
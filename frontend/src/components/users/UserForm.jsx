import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useUserAdminStore } from '@/store/userAdminStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent} from '@/components/ui/card'
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

const UserForm = ({ 
  user = null, 
  onSuccess, 
}) => {
  const { createUser, updateUser, roles, fetchRoles, loading } = useUserAdminStore()
  const { formData, setFormData } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const form = useForm({
    defaultValues: {
      nombre: '',
      correo: '',
      password: '',
      rol_id: '',
      finca_id: '1'
    }
  })

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles])

  useEffect(() => {
    if (user) {
      setIsEditing(true);
      form.reset({
        nombre: user.nombre || '',
        correo: user.correo || '',
        password: '',
        rol_id: user.rol_id?.toString() || user.rol?.rol_id?.toString() || '',
        finca_id: user.finca_id?.toString() || '1'
      })
    } else {
      setIsEditing(false);
      form.reset({
        nombre: '',
        correo: '',
        password: formData.password || '',
        rol_id: '',
        finca_id: '1'
      })
    }
  }, [user, form])

  useEffect(() => {
    // Mantener sincronizado el valor de password con el store de auth
    form.setValue('password', formData.password || '')
  }, [form, formData.password])

  const onSubmit = async (data) => {
    setFormError('');
    setFieldErrors({});
    
    try {
      const userData = {
        nombre: data.nombre.trim(),
        correo: data.correo.trim().toLowerCase(),
        rol_id: parseInt(data.rol_id),
        finca_id: parseInt(data.finca_id)
      };

      if (data.password && data.password.trim()) {
        userData.password = data.password;
      }

      let result;
      if (isEditing) {
        result = await updateUser(user.usuario_id, userData);
      } else {
        result = await createUser(userData);
      }

      if (result?.success) {
        form.reset();
        onSuccess?.();
      } else {
        const errorMsg = result?.error || 'Error al procesar la solicitud';
        
        if (errorMsg.includes('correo') || errorMsg.includes('email') || errorMsg.includes('registrado') || errorMsg.includes('ya está')) {
          setFieldErrors({
            correo: 'Este correo electrónico ya está registrado. Por favor, use un correo diferente.'
          });
        } else if (errorMsg.includes('contraseña') || errorMsg.includes('password') || errorMsg.includes('6 caracteres')) {
          setFieldErrors({
            password: 'La contraseña debe tener al menos 6 caracteres.'
          });
        } else if (errorMsg.includes('rol') || errorMsg.includes('Rol')) {
          setFieldErrors({
            rol_id: 'Debe seleccionar un rol válido.'
          });
        } else if (errorMsg.includes('nombre') || errorMsg.includes('Nombre')) {
          setFieldErrors({
            nombre: 'El nombre es requerido.'
          });
        } else {
          setFormError(`Error: ${errorMsg}. Por favor, verifique los datos e intente nuevamente.`);
        }
      }
    } catch (error) {
      setFormError('Error de conexión. Por favor, intente nuevamente.');
    }
  }

  const roleOptions = roles.map(role => ({
    value: role.rol_id.toString(),
    label: role.nombre
  }))

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
                rules={{ required: "El nombre es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Nombre Completo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ingrese el nombre completo" 
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
                name="correo"
                rules={{ 
                  required: "El correo es requerido",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Correo electrónico inválido"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="usuario@ejemplo.com" 
                        {...field}
                        disabled={isEditing || loading}
                        className="w-full text-sm sm:text-base"
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm">
                      {fieldErrors.correo || form.formState.errors.correo?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {!isEditing && (
                <FormField
                  control={form.control}
                  name="password"
                  rules={{ 
                    required: "La contraseña es requerida",
                    minLength: {
                      value: 6,
                      message: "La contraseña debe tener al menos 6 caracteres"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Mínimo 6 caracteres" 
                          {...field}
                          disabled={loading}
                          className="w-full text-sm sm:text-base"
                          onChange={(e) => {
                            field.onChange(e)
                            setFormData('password', e.target.value)
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-xs sm:text-sm">
                        {fieldErrors.password || form.formState.errors.password?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="rol_id"
                rules={{ required: "El rol es requerido" }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm sm:text-base">Rol</FormLabel>
                    <FormControl>
                      <Combobox
                        options={roleOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar rol"
                        disabled={loading || roleOptions.length === 0}
                        className="w-full text-sm sm:text-base"
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm">
                      {fieldErrors.rol_id || form.formState.errors.rol_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="finca_id"
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />
            </div>

            <div className="pt-2 sm:pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full text-sm sm:text-base"
                size="lg"
                variant="finca"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default UserForm
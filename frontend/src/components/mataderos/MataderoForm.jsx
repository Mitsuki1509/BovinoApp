import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMataderoStore } from '@/store/mataderoStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const MataderoForm = ({ 
  matadero = null, 
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const { createMatadero, updateMatadero } = useMataderoStore();

  const form = useForm({
    defaultValues: {
      ubicacion: ''
    }
  });

  useEffect(() => {
    if (matadero) {
      setIsEditing(true);
      form.reset({
        ubicacion: matadero.ubicacion || ''
      });
    } else {
      setIsEditing(false);
      form.reset({
        ubicacion: ''
      });
    }
  }, [matadero, form]);

  const onSubmit = async (data) => {
    setFormError('');
    setFieldErrors({});
    setLoading(true);
    
    try {
      const mataderoData = {
        ubicacion: data.ubicacion.trim()
      };

      let result;
      if (isEditing) {
        result = await updateMatadero(matadero.matadero_id, mataderoData);
      } else {
        result = await createMatadero(mataderoData);
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
            ubicacion: 'Ya existe un matadero con esta ubicación. Por favor, use una ubicación diferente.'
          });
        } else if (errorMsg.includes('permisos') || errorMsg.includes('permiso')) {
          setFormError('No tiene permisos para realizar esta acción. Solo administradores y operarios pueden gestionar mataderos.');
        } else {
          setFormError(`Error: ${errorMsg}. Por favor, verifique los datos e intente nuevamente.`);
        }
      }
    } catch (error) {
      setFormError('Error de conexión. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

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
                name="ubicacion"
                rules={{ 
                  required: "La ubicación es obligatoria",
                  minLength: {
                    value: 2,
                    message: "La ubicación debe tener al menos 2 caracteres"
                  },
                  maxLength: {
                    value: 255,
                    message: "La ubicación no puede tener más de 255 caracteres"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación del Matadero</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Matadero Central, Matadero Norte..." 
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

            <div className="pt-2 sm:pt-4 flex">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
                variant="produccion"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Matadero' : 'Crear Matadero'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MataderoForm;
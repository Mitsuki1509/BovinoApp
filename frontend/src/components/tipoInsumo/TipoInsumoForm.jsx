import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Tag, AlertCircle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useTipoInsumoStore } from '@/store/tipoInsumoStore';

const TipoInsumoForm = ({ 
  tipoInsumo = null, 
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const { 
    createTipoInsumo, 
    updateTipoInsumo
  } = useTipoInsumoStore();

  const form = useForm({
    defaultValues: {
      nombre: ''
    }
  });

  useEffect(() => {
    if (tipoInsumo) {
      setIsEditing(true);
      form.reset({
        nombre: tipoInsumo.nombre || ''
      });
    } else {
      setIsEditing(false);
      form.reset({
        nombre: ''
      });
    }
  }, [tipoInsumo, form]);

  const onSubmit = async (data) => {
    setLoading(true);
    setFormError('');
    
    try {
      let result;
      
      if (isEditing) {
        result = await updateTipoInsumo(tipoInsumo.tipo_insumo_id, data);
      } else {
        result = await createTipoInsumo(data);
      }

      if (result?.success) {
        onSuccess?.();
      } else {
        const errorMessage = result?.error || 'Error al guardar el tipo de insumo';
        setFormError(errorMessage);
      }
    } catch (error) {
      setFormError(error.message || 'Error de conexión. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p>{formError}</p>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="nombre"
          rules={{ 
            required: "El nombre es obligatorio",
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
              <FormLabel className="text-sm">Nombre del Tipo *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Alimentos, Medicamentos, etc."
                  {...field}
                  disabled={loading}
                  className="text-sm h-9"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-2 font-semibold"
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Actualizar Tipo' : 'Crear Tipo'}
        </Button>
      </form>
    </Form>
  );
};

export default TipoInsumoForm;
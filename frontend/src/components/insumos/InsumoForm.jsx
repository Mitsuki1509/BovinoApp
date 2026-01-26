import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X, AlertCircle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useInsumoStore } from '@/store/insumoStore';
import { useTipoInsumoStore } from '@/store/tipoInsumoStore';
import { Combobox } from '@/components/ui/combobox';

const InsumoForm = ({ 
  insumo = null, 
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [formError, setFormError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [unidades, setUnidades] = useState([]);
  
  const { 
    createInsumo, 
    updateInsumo,
    fetchUnidades
  } = useInsumoStore();
  
  const { 
    tiposInsumo, 
    fetchTiposInsumo 
  } = useTipoInsumoStore();

  const form = useForm({
    defaultValues: {
      nombre: '',
      tipo_insumo_id: '',
      cantidad: '',
      unidad_id: '',
      descripcion: '',
      imagen: null
    }
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchTiposInsumo();
        
        const unidadesResult = await fetchUnidades();
        
        if (unidadesResult.success) {
          setUnidades(unidadesResult.data || []);
        } else {
          setFormError('Error al cargar las unidades de medida');
        }

        if (insumo) {
          setIsEditing(true);
          form.reset({
            nombre: insumo.nombre || '',
            tipo_insumo_id: insumo.tipo_insumo_id ? insumo.tipo_insumo_id.toString() : '',
            cantidad: insumo.cantidad ? insumo.cantidad.toString() : '',
            unidad_id: insumo.unidad_id ? insumo.unidad_id.toString() : '',
            descripcion: insumo.descripcion || '',
            imagen: null
          });
          
          if (insumo.imagen) {
            setImagenPreview(insumo.imagen);
          }
        } else {
          setIsEditing(false);
          form.reset({
            nombre: '',
            tipo_insumo_id: '',
            cantidad: '',
            unidad_id: '',
            descripcion: '',
            imagen: null
          });
        }
      } catch (error) {
        setFormError('Error al cargar los datos necesarios');
      }
    };

    loadInitialData();
  }, [insumo, form, fetchTiposInsumo, fetchUnidades]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      form.setValue('imagen', file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagenPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    form.setValue('imagen', null);
    setImagenPreview(null);
  };

  const tipoInsumoOptions = [
    ...(tiposInsumo || []).map(tipo => ({
      value: tipo.tipo_insumo_id.toString(),
      label: tipo.nombre
    }))
  ];

  const unidadOptions = [
    ...(unidades || []).map(unidad => ({
      value: unidad.unidad_id.toString(),
      label: unidad.nombre
    }))
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    setFormError('');
    setFieldErrors({});
    
    try {
      const errors = {};
      
      if (!data.nombre || data.nombre.trim() === '') {
        errors.nombre = 'El nombre es requerido';
      }
      
      if (!data.tipo_insumo_id || data.tipo_insumo_id === '') {
        errors.tipo_insumo_id = 'El tipo de insumo es requerido';
      }
      
      if (!data.cantidad || data.cantidad === '' || parseInt(data.cantidad) < 0) {
        errors.cantidad = 'La cantidad es requerida y debe ser mayor o igual a 0';
      }

      if (!data.unidad_id || data.unidad_id === '') {
        errors.unidad_id = 'La unidad de medida es requerida';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        throw new Error('Por favor, complete todos los campos requeridos');
      }

      const formData = {
        nombre: data.nombre.trim(),
        tipo_insumo_id: data.tipo_insumo_id,
        cantidad: parseInt(data.cantidad),
        unidad_id: data.unidad_id,
        descripcion: data.descripcion || '',
        imagen: data.imagen
      };

      let result;
      
      if (isEditing) {
        result = await updateInsumo(insumo.insumo_id, formData);
      } else {
        result = await createInsumo(formData);
      }

      if (result?.success) {
        onSuccess?.();
      } else {
        const errorMessage = result?.error || 'Error al guardar el insumo';
        
        if (errorMessage.includes('validación') || errorMessage.includes('validacion')) {
          setFormError('Por favor, verifique que todos los campos estén completos correctamente.');
        } else if (errorMessage.includes('nombre') || errorMessage.includes('Nombre') || errorMessage.includes('existe')) {
          setFieldErrors({
            nombre: 'Ya existe un insumo con este nombre. Por favor, use un nombre diferente.'
          });
        } else if (errorMessage.includes('cantidad') || errorMessage.includes('Cantidad')) {
          setFieldErrors({
            cantidad: 'La cantidad es requerida y debe ser mayor o igual a 0'
          });
        } else if (errorMessage.includes('tipo_insumo') || errorMessage.includes('tipo')) {
          setFieldErrors({
            tipo_insumo_id: 'El tipo de insumo especificado no existe'
          });
        } else if (errorMessage.includes('unidad') || errorMessage.includes('Unidad')) {
          setFieldErrors({
            unidad_id: 'La unidad especificada no existe'
          });
        } else {
          setFormError(`Error: ${errorMessage}. Por favor, verifique los datos e intente nuevamente.`);
        }
      }
    } catch (error) {
      if (error.message.includes('nombre')) {
        setFieldErrors({
          nombre: 'El nombre es requerido'
        });
      } else if (error.message.includes('cantidad')) {
        setFieldErrors({
          cantidad: 'La cantidad es requerida y debe ser mayor o igual a 0'
        });
      } else if (error.message.includes('tipo_insumo_id')) {
        setFieldErrors({
          tipo_insumo_id: 'El tipo de insumo es requerido'
        });
      } else if (error.message.includes('unidad_id')) {
        setFieldErrors({
          unidad_id: 'La unidad de medida es requerida'
        });
      } else {
        setFormError(error.message || 'Error de conexión. Por favor, intente nuevamente.');
      }
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
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Error de validación</p>
                  <p>{formError}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
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
                    <FormLabel>Nombre del Insumo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Concentrado para ganado, Vacuna, etc."
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
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción detallada del insumo..."
                        {...field}
                        disabled={loading}
                        className="w-full min-h-[80px] resize-none"
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.descripcion?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_insumo_id"
                rules={{
                  required: "El tipo de insumo es obligatorio"
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Insumo</FormLabel>
                    <FormControl>
                      <Combobox
                        options={tipoInsumoOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={tiposInsumo.length === 0 ? "Cargando tipos..." : "Seleccionar tipo..."}
                        disabled={loading || tiposInsumo.length === 0}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage>
                      {fieldErrors.tipo_insumo_id || form.formState.errors.tipo_insumo_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cantidad"
                  rules={{ 
                    required: "La cantidad es obligatoria",
                    min: {
                      value: 0,
                      message: "La cantidad debe ser mayor o igual a 0"
                    },
                    validate: value => {
                      const numValue = parseInt(value);
                      if (isNaN(numValue)) return "La cantidad debe ser un número válido";
                      if (numValue < 0) return "La cantidad no puede ser negativa";
                      return true;
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad en Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
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

                <FormField
                  control={form.control}
                  name="unidad_id"
                  rules={{
                    required: "La unidad de medida es obligatoria"
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad de Medida</FormLabel>
                      <FormControl>
                        <Combobox
                          options={unidadOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={unidades.length === 0 ? "Cargando unidades..." : "Seleccionar unidad..."}
                          disabled={loading || unidades.length === 0}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage>
                        {fieldErrors.unidad_id || form.formState.errors.unidad_id?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2">
                  <Upload className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-semibold text-gray-800">
                    Fotografía (opcional)
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Seleccionar imagen
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer w-full h-9"
                    />
                  </div>

                  {imagenPreview && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Vista previa
                      </label>
                      <div className="relative inline-block">
                        <img
                          src={imagenPreview}
                          alt="Preview"
                          className="h-28 w-28 object-cover rounded-lg border-2 border-gray-300"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={removeImage}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                variant="inventario"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Insumo' : 'Crear Insumo'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default InsumoForm;
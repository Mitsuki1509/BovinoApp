import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAlimentacionStore } from '@/store/alimentacionStore';
import { useAnimalStore } from '@/store/animalStore';
import { useInsumoStore } from '@/store/insumoStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const AlimentacionForm = ({ 
  alimentacion = null, 
  onSuccess,
}) => {
  const { 
    createAlimentacion, 
    updateAlimentacion, 
    loading: loadingAlimentacion
  } = useAlimentacionStore();
  
  const { animales, fetchAnimales, loading: loadingAnimales } = useAnimalStore();
  const { insumos, fetchInsumos, loading: loadingInsumos } = useInsumoStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);
  const [noInsumosDisponibles, setNoInsumosDisponibles] = useState(false);
  const STOCK_MINIMO = 10;

  const form = useForm({
    defaultValues: {
      animal_id: '',
      insumo_id: '',
      cantidad: ''
    }
  });

  useEffect(() => {
    fetchAnimales();
    fetchInsumos();
  }, [fetchAnimales, fetchInsumos]);

  useEffect(() => {
    if (alimentacion) {
      setIsEditing(true);
      form.reset({
        animal_id: alimentacion.animal_id ? alimentacion.animal_id.toString() : '',
        insumo_id: alimentacion.insumo_id ? alimentacion.insumo_id.toString() : '',
        cantidad: alimentacion.cantidad ? alimentacion.cantidad.toString() : ''
      });
      const insumo = insumos.find(i => i.insumo_id === alimentacion.insumo_id);
      setInsumoSeleccionado(insumo);
    } else {
      setIsEditing(false);
      form.reset({
        animal_id: '',
        insumo_id: '',
        cantidad: ''
      });
      setInsumoSeleccionado(null);
    }
  }, [alimentacion, form, insumos]);

  useEffect(() => {
    if (insumos.length > 0) {
      const insumosDisponibles = insumos.filter(insumo => 
        !insumo.deleted_at && insumo.cantidad > STOCK_MINIMO
      );
      setNoInsumosDisponibles(insumosDisponibles.length === 0);
    }
  }, [insumos]);

  const onSubmit = async (data) => {
    setFormError('');
    
    try {
      if (!data.animal_id || !data.insumo_id || !data.cantidad) {
        setFormError('Todos los campos son obligatorios');
        return;
      }

      const alimentacionData = {
        animal_id: parseInt(data.animal_id),
        insumo_id: parseInt(data.insumo_id),
        cantidad: parseInt(data.cantidad)
      };

      let result;
      if (isEditing) {
        result = await updateAlimentacion(alimentacion.alimentacion_id, alimentacionData);
      } else {
        result = await createAlimentacion(alimentacionData);
      }

      if (result?.success) {
        form.reset({
          animal_id: '',
          insumo_id: '',
          cantidad: ''
        });
        setInsumoSeleccionado(null);
        onSuccess?.();
      } else {
        setFormError(result?.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error en onSubmit:', error);
      setFormError('Error de conexión. Por favor, intente nuevamente.');
    }
  };

  const validateCantidad = (value) => {
    const cantidadValue = parseInt(value);
    
    if (!cantidadValue || cantidadValue <= 0) {
      return "La cantidad debe ser mayor a 0";
    }
    
    if (insumoSeleccionado) {
      if (cantidadValue > insumoSeleccionado.cantidad) {
        return `La cantidad no puede ser mayor al stock disponible (${insumoSeleccionado.cantidad})`;
      }
      
      const stockDespues = insumoSeleccionado.cantidad - cantidadValue;
      if (stockDespues < STOCK_MINIMO) {
        return `No se puede utilizar esta cantidad. Quedarían ${stockDespues} unidades (mínimo requerido: ${STOCK_MINIMO})`;
      }
    }
    
    return true;
  };

  const animalesOptions = animales
    .filter(animal => !animal.deleted_at)
    .map(animal => ({
      value: animal.animal_id.toString(),
      label: `${animal.arete}`
    }));

  const insumosOptions = insumos && insumos.length > 0 
    ? insumos
        .filter(insumo => 
          !insumo.deleted_at && 
          insumo.cantidad > STOCK_MINIMO  
        )
        .map(insumo => ({
          value: insumo.insumo_id.toString(),
          label: `${insumo.nombre} - Stock: ${insumo.cantidad} ${insumo.unidad?.nombre || ''}`
        }))
    : [];

  const handleInsumoChange = (insumoId) => {
    const insumo = insumos.find(i => i.insumo_id.toString() === insumoId);
    setInsumoSeleccionado(insumo);
  };

  const loading = loadingAlimentacion || loadingAnimales || loadingInsumos;

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

            {noInsumosDisponibles && !isEditing && (
              <div className="p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
                No hay insumos disponibles con stock suficiente. 
                Todos los insumos tienen {STOCK_MINIMO} unidades o menos.
              </div>
            )}

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="animal_id"
                rules={{ required: "El animal es obligatorio" }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Animal</FormLabel>
                    <FormControl>
                      <Combobox
                        options={animalesOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar animal"
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insumo_id"
                rules={{ required: "El insumo es obligatorio" }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Insumo</FormLabel>
                    <FormControl>
                      <Combobox
                        options={insumosOptions}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleInsumoChange(value);
                        }}
                        placeholder="Seleccionar insumo"
                        disabled={loading || insumos.length === 0}
                        className="w-full"
                      />
                    </FormControl>
                    <div className="text-sm text-gray-500">
                      Solo se muestran insumos con más de {STOCK_MINIMO} unidades en stock
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {insumoSeleccionado && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium mb-1">Información del insumo seleccionado:</div>
                    <div>Stock disponible: {insumoSeleccionado.cantidad} {insumoSeleccionado.unidad?.nombre || ''}</div>
                    <div>Máximo para cargar: {insumoSeleccionado.cantidad - STOCK_MINIMO} {insumoSeleccionado.unidad?.nombre || ''}</div>
                    <div className="text-xs mt-1">Se reservan {STOCK_MINIMO} unidades como stock mínimo</div>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="cantidad"
                rules={{ 
                  required: "La cantidad es obligatoria",
                  validate: validateCantidad
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max={insumoSeleccionado ? insumoSeleccionado.cantidad - STOCK_MINIMO : undefined}
                        placeholder="0"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-2 sm:pt-4 flex gap-3">
              <Button 
                type="submit" 
                className="flex-1"
                variant="ganado"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Alimentación' : 'Registrar Alimentación'}
              </Button>
              
             
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AlimentacionForm;
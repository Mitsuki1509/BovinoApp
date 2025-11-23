import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCompraAnimalStore } from '@/store/compraAnimalStore';
import { useProveedorStore } from '@/store/proveedorStore';
import { useAnimalStore } from '@/store/animalStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Trash2} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

const CompraAnimalForm = ({ 
  onSuccess,
}) => {
  const { createCompraAnimal, loading, comprasAnimales } = useCompraAnimalStore();
  const { proveedores, fetchProveedores } = useProveedorStore();
  const { animales, fetchAnimales } = useAnimalStore();
  const [formError, setFormError] = useState('');
  const [detalles, setDetalles] = useState([]);
  const [total, setTotal] = useState(0);
  const [animalesDisponibles, setAnimalesDisponibles] = useState([]);
  const [animalesEnCompras, setAnimalesEnCompras] = useState(new Set());

  const form = useForm({
    defaultValues: {
      proveedor_id: '',
      fecha: new Date()
    }
  });

  useEffect(() => {
    fetchProveedores();
    fetchAnimales();
  }, [fetchProveedores, fetchAnimales]);

  useEffect(() => {
    if (comprasAnimales && comprasAnimales.length > 0) {
      const animalesComprados = new Set();
      comprasAnimales.forEach(compra => {
        if (compra.detalles) {
          compra.detalles.forEach(detalle => {
            if (detalle.animal_id) {
              animalesComprados.add(detalle.animal_id);
            }
          });
        }
      });
      setAnimalesEnCompras(animalesComprados);
    }
  }, [comprasAnimales]);

  useEffect(() => {
    if (animales && animales.length > 0) {
      const disponibles = animales.filter(animal => {
        const noNacioEnFinca = !animal.animal_padre_id && !animal.animal_madre_id;
        const noTieneCompra = !animalesEnCompras.has(animal.animal_id);
        const noEstaEliminado = !animal.deleted_at;
        return noNacioEnFinca && noTieneCompra && noEstaEliminado;
      });
      setAnimalesDisponibles(disponibles);
    }
  }, [animales, animalesEnCompras]);

  useEffect(() => {
    const nuevoTotal = detalles.reduce((sum, detalle) => {
      return sum + parseFloat(detalle.precio || 0);
    }, 0);
    setTotal(nuevoTotal);
  }, [detalles]);

  const formatDateToLocalISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const onSubmit = async (data) => {
    setFormError('');
    
    try {
      if (detalles.length === 0) {
        setFormError('Debe agregar al menos un animal a la compra');
        return;
      }

      for (const detalle of detalles) {
        if (!detalle.animal_id || !detalle.precio) {
          setFormError('Todos los animales deben tener animal y precio completos');
          return;
        }

        if (parseFloat(detalle.precio) <= 0) {
          setFormError('El precio debe ser mayor a 0');
          return;
        }

        const animalSeleccionado = animalesDisponibles.find(a => 
          a.animal_id.toString() === detalle.animal_id
        );
        
        if (!animalSeleccionado) {
          setFormError(`El animal seleccionado ya no está disponible para compra.`);
          return;
        }
      }

      const compraData = {
        proveedor_id: parseInt(data.proveedor_id),
        fecha: formatDateToLocalISO(data.fecha),
        detalles: detalles.map(detalle => ({
          animal_id: parseInt(detalle.animal_id),
          precio: parseFloat(detalle.precio),
          observaciones: detalle.observaciones || null
        }))
      };

      const result = await createCompraAnimal(compraData);

      if (result?.success) {
        form.reset();
        setDetalles([]);
        setTotal(0);
        onSuccess?.();
      } else {
        const errorMsg = result?.error || 'Error al procesar la solicitud';
        setFormError(errorMsg);
      }
    } catch (error) {
      setFormError('Error de conexión. Por favor, intente nuevamente.');
    }
  };

  const isDateFuture = (date) => {
    const today = new Date();
    const selectedDate = new Date(date);
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate > today;
  };

  const agregarDetalle = () => {
    setDetalles([...detalles, { animal_id: '', precio: 0, observaciones: '' }]);
  };

  const actualizarDetalle = (index, field, value) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index][field] = value;
    
    if (field === 'animal_id' && value) {
      const animalSeleccionado = animalesDisponibles.find(a => a.animal_id.toString() === value);
      if (animalSeleccionado) {
        nuevosDetalles[index].nombre = animalSeleccionado.arete;
        nuevosDetalles[index].raza = animalSeleccionado.raza?.nombre || 'Sin raza';
        nuevosDetalles[index].sexo = animalSeleccionado.sexo === 'M' ? 'Macho' : 'Hembra';
      }
    }
    
    setDetalles(nuevosDetalles);
  };

  const eliminarDetalle = (index) => {
    const nuevosDetalles = detalles.filter((_, i) => i !== index);
    setDetalles(nuevosDetalles);
  };

  const proveedorOptions = proveedores
    .filter(proveedor => !proveedor.deleted_at)
    .map(proveedor => ({
      value: proveedor.proveedor_id.toString(),
      label: `${proveedor.nombre_compañia} - ${proveedor.nombre_contacto || 'Sin contacto'}`
    }));

  const animalesOptions = animalesDisponibles && animalesDisponibles.length > 0 
    ? animalesDisponibles.map(animal => ({
        value: animal.animal_id.toString(),
        label: `${animal.arete} `
      }))
    : [{ value: 'no-data', label: 'No hay animales disponibles para compra', disabled: true }];

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
                name="proveedor_id"
                rules={{ required: "El proveedor es obligatorio" }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Proveedor</FormLabel>
                    <FormControl>
                      <Combobox
                        options={proveedorOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar proveedor"
                        disabled={loading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Animales de la Compra</label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Solo animales que no nacieron en la finca
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={agregarDetalle}
                    variant="outline"
                    size="sm"
                    disabled={loading || animalesOptions.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Animal
                  </Button>
                </div>

                {animalesOptions.length === 0 && (
                  <div className="p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
                    No hay animales disponibles para compra.
                  </div>
                )}

                {detalles.map((detalle, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Animal</label>
                        <Combobox
                          options={animalesOptions}
                          value={detalle.animal_id}
                          onValueChange={(value) => actualizarDetalle(index, 'animal_id', value)}
                          placeholder="Seleccionar animal"
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">Precio (C$)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={detalle.precio}
                          onChange={(e) => actualizarDetalle(index, 'precio', e.target.value)}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">Observaciones (Opcional)</label>
                        <Textarea
                          value={detalle.observaciones}
                          onChange={(e) => actualizarDetalle(index, 'observaciones', e.target.value)}
                          placeholder="Observaciones sobre este animal..."
                          disabled={loading}
                          className="resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      onClick={() => eliminarDetalle(index)}
                      variant="ghost"
                      size="icon"
                      disabled={loading}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}

              </div>
            </div>

            <div className="pt-2 sm:pt-4 flex">
              <Button 
                type="submit" 
                disabled={loading }
                className="flex-1"
                variant="inventario"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear Compra de Animales
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CompraAnimalForm;
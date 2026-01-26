import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCompraInsumoStore } from '@/store/compraInsumoStore';
import { useProveedorStore } from '@/store/proveedorStore';
import { useInsumoStore } from '@/store/insumoStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Trash2 } from 'lucide-react';
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

const truncateText = (text, maxLength = 25) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const CompraInsumoForm = ({ 
  onSuccess,
}) => {
  const { createCompraInsumo, loading } = useCompraInsumoStore();
  const { proveedores, fetchProveedores } = useProveedorStore();
  const { insumos, fetchInsumos, loading: loadingInsumos } = useInsumoStore();
  const [formError, setFormError] = useState('');
  const [detalles, setDetalles] = useState([]);
  const [total, setTotal] = useState(0);

  const form = useForm({
    defaultValues: {
      proveedor_id: '',
      fecha: new Date()
    }
  });

  useEffect(() => {
    fetchProveedores();
    fetchInsumos();
  }, [fetchProveedores, fetchInsumos]);

  useEffect(() => {
    const nuevoTotal = detalles.reduce((sum, detalle) => {
      return sum + (parseFloat(detalle.precio || 0) * parseInt(detalle.cantidad || 0));
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
        setFormError('Debe agregar al menos un insumo a la compra');
        return;
      }

      for (const detalle of detalles) {
        if (!detalle.insumo_id || !detalle.cantidad || !detalle.precio) {
          setFormError('Todos los insumos deben tener insumo, cantidad y precio completos');
          return;
        }

        if (parseInt(detalle.cantidad) <= 0 || parseFloat(detalle.precio) <= 0) {
          setFormError('La cantidad y el precio deben ser mayores a 0');
          return;
        }
      }

      const compraData = {
        proveedor_id: parseInt(data.proveedor_id),
        fecha: formatDateToLocalISO(data.fecha),
        detalles: detalles.map(detalle => ({
          insumo_id: parseInt(detalle.insumo_id),
          cantidad: parseInt(detalle.cantidad),
          precio: parseFloat(detalle.precio)
        }))
      };

      const result = await createCompraInsumo(compraData);

      if (result?.success) {
        form.reset();
        setDetalles([]);
        setTotal(0);
        onSuccess?.();
      } else {
        setFormError(result?.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      setFormError('Error de conexión. Por favor, intente nuevamente.');
    }
  };

  const agregarDetalle = () => {
    setDetalles([...detalles, { insumo_id: '', cantidad: 1, precio: 0 }]);
  };

  const actualizarDetalle = (index, field, value) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index][field] = value;
    
    if (field === 'insumo_id' && value) {
      const insumoSeleccionado = insumos.find(i => i.insumo_id.toString() === value);
      if (insumoSeleccionado) {
        nuevosDetalles[index].nombre = insumoSeleccionado.nombre;
        nuevosDetalles[index].unidad = insumoSeleccionado.unidad?.nombre || 'unidad';
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
      label: `${truncateText(proveedor.nombre_compañia, 20)} - ${proveedor.nombre_contacto ? truncateText(proveedor.nombre_contacto, 15) : 'Sin contacto'}`
    }));

  const insumosOptions = insumos && insumos.length > 0 
    ? insumos
        .filter(insumo => !insumo.deleted_at)
        .map(insumo => {
          const nombreTruncado = truncateText(insumo.nombre, 25);
          const unidadNombre = insumo.unidad?.nombre || 'unidad';
          
          return {
            value: insumo.insumo_id.toString(),
            label: `${nombreTruncado} (${unidadNombre})`,
            fullLabel: `${insumo.nombre} (${unidadNombre})`
          };
        })
    : [{ value: 'no-data', label: 'No hay insumos disponibles', disabled: true }];

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
                  <label className="text-sm font-medium">Insumos de la Compra</label>
                  <Button
                    type="button"
                    onClick={agregarDetalle}
                    variant="outline"
                    size="sm"
                    disabled={loading || loadingInsumos}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Insumo
                  </Button>
                </div>

                {insumosOptions.length === 1 && insumosOptions[0].value === 'no-data' && (
                  <div className="p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
                    No hay insumos disponibles en el sistema.
                  </div>
                )}

                {detalles.map((detalle, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Insumo</label>
                        <Combobox
                          options={insumosOptions}
                          value={detalle.insumo_id}
                          onValueChange={(value) => actualizarDetalle(index, 'insumo_id', value)}
                          placeholder="Seleccionar insumo"
                          disabled={loading || loadingInsumos}
                          renderOption={(option) => (
                            <div 
                              className="truncate" 
                              title={option.fullLabel || option.label}
                            >
                              {option.label}
                            </div>
                          )}
                        />
                      
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">Cantidad</label>
                        <Input
                          type="number"
                          min="1"
                          value={detalle.cantidad}
                          onChange={(e) => actualizarDetalle(index, 'cantidad', e.target.value)}
                          placeholder="Cantidad"
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">Precio Unitario (C$)</label>
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

            <div className="sm:pt-4 flex">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
                variant="inventario"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear Compra
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CompraInsumoForm;
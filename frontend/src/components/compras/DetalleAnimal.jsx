import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const DetalleAnimal = ({ compra }) => {
  if (!compra) return null;

  const formatDateWithoutTZ = (dateString) => {
    try {
      if (!dateString) return 'Fecha inválida';
      const [year, month, day] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-ES');
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '0.00';
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-lg sm:text-xl font-semibold">Detalle de Compra</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Información completa de la compra de animales seleccionada
        </p>
      </div>

      <Card className="w-full border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_compra">Número de Compra</Label>
                  <Input
                    id="numero_compra"
                    value={compra.numero_compra}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha de Compra</Label>
                  <Input
                    id="fecha"
                    value={formatDateWithoutTZ(compra.fecha)}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="proveedor">Proveedor</Label>
                  <Input
                    id="proveedor"
                    value={compra.proveedor?.nombre_compañia || 'No especificado'}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="total">Total de la Compra</Label>
                  <Input
                    id="total"
                    value={`C$${formatPrice(compra.total)}`}
                    disabled
                    className="bg-gray-50 font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Animales Comprados ({compra.detalles?.length || 0})
                </Label>
              </div>

              <div className="space-y-4">
                {compra.detalles?.map((detalle, index) => (
                  <div
                    key={index}
                    className="space-y-3 p-3 border rounded-lg bg-gray-50/50"
                  >
                    <div className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Arete</Label>
                          <Input
                            value={detalle.animal?.arete || 'Sin arete'}
                            disabled
                            className="bg-white text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Raza</Label>
                          <Input
                            value={detalle.animal?.raza?.nombre || 'Sin raza'}
                            disabled
                            className="bg-white text-sm capitalize"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Sexo</Label>
                          <Input
                            value={detalle.animal?.sexo === 'M' ? 'Macho' : 'Hembra'}
                            disabled
                            className="bg-white text-sm capitalize"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Precio</Label>
                          <Input
                            value={`C$${formatPrice(detalle.precio)}`}
                            disabled
                            className="bg-white text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {detalle.observaciones && (
                      <div className="space-y-2 pt-2 border-t">
                        <Label className="text-xs font-medium">Observaciones</Label>
                        <div className="relative">
                          <Textarea
                            value={detalle.observaciones}
                            disabled
                            className="bg-white text-sm min-h-[80px] resize-none w-full pr-8"
                            readOnly
                          />
                          <div className="absolute right-2 top-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {detalle.observaciones.length} caracteres
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {(!compra.detalles || compra.detalles.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    No hay detalles de animales disponibles
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">Resumen</Label>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 border rounded-md">
                  <span className="text-sm text-muted-foreground">Total de Animales:</span>
                  <span className="font-medium">{compra.detalles?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 border rounded-md">
                  <span className="text-sm text-muted-foreground">Machos:</span>
                  <span className="font-medium">
                    {compra.detalles?.filter(d => d.animal?.sexo === 'M').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 border rounded-md">
                  <span className="text-sm text-muted-foreground">Hembras:</span>
                  <span className="font-medium">
                    {compra.detalles?.filter(d => d.animal?.sexo === 'H').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 border rounded-md">
                  <span className="text-sm font-semibold">Total General:</span>
                  <span className="text-sm font-bold">
                    C${formatPrice(compra.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetalleAnimal;
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DetalleInsumo = ({ compra }) => {
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

  const calculateSubtotal = (precio, cantidad) => {
    const numPrecio = parseFloat(precio) || 0;
    const numCantidad = parseInt(cantidad) || 0;
    return (numPrecio * numCantidad).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-lg sm:text-xl font-semibold">Detalle de Compra</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Información completa de la compra de insumos seleccionada
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
                  Insumos Comprados ({compra.detalles?.length || 0})
                </Label>
              </div>

              <div className="space-y-3">
                {compra.detalles?.map((detalle, index) => {
                  const precio = detalle.precio;
                  const cantidad = detalle.cantidad;
                  const subtotal = calculateSubtotal(precio, cantidad);
                  
                  return (
                    <div
                      key={index}
                      className="flex gap-2 items-start p-3 border rounded-lg bg-gray-50/50"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Insumo</Label>
                          <Input
                            value={detalle.insumo?.nombre || 'Insumo no disponible'}
                            disabled
                            className="bg-white text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            {detalle.insumo?.unidad?.nombre || 'unidad'}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Cantidad</Label>
                          <Input
                            value={`${cantidad || 0} unidades`}
                            disabled
                            className="bg-white text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Precio Unitario</Label>
                          <Input
                            value={`C$${formatPrice(precio)}`}
                            disabled
                            className="bg-white text-sm"
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <Label className="text-xs font-medium">Subtotal:</Label>
                            <Badge variant="secondary" className="text-xs">
                              C${subtotal}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {(!compra.detalles || compra.detalles.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    No hay detalles de insumos disponibles
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">Resumen</Label>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 border rounded-md">
                  <span className="text-sm text-muted-foreground">Total de Insumos:</span>
                  <span className="font-medium">{compra.detalles?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 border rounded-md">
                  <span className="text-sm text-muted-foreground">Cantidad Total:</span>
                  <span className="font-medium">
                    {compra.detalles?.reduce((sum, detalle) => sum + (parseInt(detalle.cantidad) || 0), 0)} unidades
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

export default DetalleInsumo;
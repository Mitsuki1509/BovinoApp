import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Scale, Tag, Edit, Trash2, AlertCircle, Info } from 'lucide-react';

const FALLBACK_IMG = "/placeholder-insumo.jpg";

const InsumoDetails = ({ insumo, onEditar, onEliminar, canManage }) => {
  if (!insumo) return null;

  const getStockColor = (cantidad) => {
    if (cantidad === 0) return 'bg-red-100 text-red-800';
    if (cantidad <= 10) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockText = (cantidad) => {
    if (cantidad === 0) return 'Sin stock';
    if (cantidad <= 10) return 'Stock bajo';
    return 'En stock';
  };

  const formatCantidad = (cantidad, unidad) => {
    if (!unidad) return `${cantidad} unidades`;
    return `${cantidad} ${unidad.nombre}`;
  };

  const handleDeleteClick = () => {
    onEliminar(insumo);
  };

  const imgSrc = insumo?.imagen || FALLBACK_IMG;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <img
              src={imgSrc}
              alt={insumo?.nombre || "insumo"}
              className="w-full h-56 object-cover rounded-lg shadow-md"
              onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {insumo?.nombre || "Sin nombre"}
            </h2>
            <div className="flex gap-2 justify-center">
              <Badge className={`text-sm ${getStockColor(insumo.cantidad)}`}>
                {getStockText(insumo.cantidad)}
              </Badge>
              {insumo.tipo_insumo && (
                <Badge variant="outline" className="text-sm flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {insumo.tipo_insumo.nombre}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Package className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Cantidad disponible</p>
                <p className="font-medium text-sm">
                  {formatCantidad(insumo.cantidad, insumo.unidad)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Scale className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Unidad de medida</p>
                <p className="font-medium text-sm">
                  {insumo.unidad ? insumo.unidad.nombre : 'No especificada'}
                </p>
              </div>
            </div>

            {insumo.tipo_insumo && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Tag className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600">Tipo de insumo</p>
                  <p className="font-medium text-sm">{insumo.tipo_insumo.nombre}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Info className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">Estado</p>
                <p className="font-medium text-sm">
                  {insumo.cantidad > 0 ? 'Disponible' : 'Agotado'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Información del Insumo
            </CardTitle>
            <CardDescription className="text-xs">Detalles del producto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Descripción</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1 min-h-[60px]">
                {insumo.descripcion ? (
                  <p className="text-gray-700">{insumo.descripcion}</p>
                ) : (
                  <p className="text-gray-500 italic text-xs">Sin descripción</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Tipo</label>
                <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                  {insumo.tipo_insumo ? (
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3 text-blue-600" />
                      <span>{insumo.tipo_insumo.nombre}</span>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-xs">No especificado</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Unidad</label>
                <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                  {insumo.unidad ? (
                    <div className="flex items-center gap-1">
                      <Scale className="h-3 w-3 text-green-600" />
                      <span>{insumo.unidad.nombre}</span>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-xs">No especificada</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4" />
              Estado del Inventario
            </CardTitle>
            <CardDescription className="text-xs">Información de stock</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Cantidad actual</label>
                <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-blue-600" />
                    <span className="font-medium">{insumo.cantidad}</span>
                    {insumo.unidad && (
                      <span className="text-gray-600">({insumo.unidad.nombre})</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Estado</label>
                <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                  <Badge className={getStockColor(insumo.cantidad)}>
                    {getStockText(insumo.cantidad)}
                  </Badge>
                </div>
              </div>
            </div>

            {insumo.cantidad <= 10 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <p className="text-sm text-orange-700">
                    {insumo.cantidad === 0 
                      ? 'Este insumo está agotado. Considera realizar un nuevo pedido.'
                      : 'Stock bajo. Considera reponer este insumo pronto.'
                    }
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {canManage && (
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={() => onEditar(insumo)}
            className="flex items-center gap-2 flex-1 py-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>

          <Button
            variant="destructive"
            onClick={handleDeleteClick}
            className="flex items-center gap-2 flex-1 py-2"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      )}
    </div>
  );
};

export default InsumoDetails;
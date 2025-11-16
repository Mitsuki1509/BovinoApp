import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin,  Calendar, Tag, Edit, Trash2, Clock } from 'lucide-react';

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

  const handleDeleteClick = () => {
    onEliminar(insumo);
  };

  const imgSrc = insumo?.imagen || FALLBACK_IMG;

  return (
    <div className="space-y-6">
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

      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {insumo?.nombre || "Sin nombre"}
        </h2>
        <div className="flex gap-2 justify-center">
          <Badge className={`text-sm ${getStockColor(insumo.cantidad)}`}>
            {getStockText(insumo.cantidad)}
          </Badge>
          {insumo.tipo_insumo && (
            <Badge variant="outline" className="text-sm">
              {insumo.tipo_insumo.nombre}
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Insumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <div className="p-2 bg-gray-50 rounded text-sm mt-1 min-h-[60px]">
              {insumo.descripcion || (
                <p className="text-gray-500 italic">Sin descripción</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                {insumo.tipo_insumo?.nombre || 'No especificado'}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Unidad</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                {insumo.unidad?.nombre || 'No especificada'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Cantidad</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                <span className="font-medium">{insumo.cantidad}</span>
                {insumo.unidad && (
                  <span className="text-gray-600 ml-1">({insumo.unidad.nombre})</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                <Badge className={getStockColor(insumo.cantidad)}>
                  {getStockText(insumo.cantidad)}
                </Badge>
              </div>
            </div>
          </div>

          {insumo.cantidad <= 10 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-sm text-orange-700">
                {insumo.cantidad === 0 
                  ? 'Este insumo está agotado. Considera realizar un nuevo pedido.'
                  : 'Stock bajo. Considera reponer este insumo pronto.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => onEditar(insumo)}
            className="flex-1"
            variant="inventario"
          >
           <Edit className="h-4 w-4" />
            Editar
          </Button>

          <Button
            variant="outline"
            onClick={handleDeleteClick}
            className="flex-1"
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
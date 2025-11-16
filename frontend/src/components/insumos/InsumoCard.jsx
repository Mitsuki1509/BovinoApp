import { Button } from '@/components/ui/button';

const FALLBACK_IMG = "/placeholder-insumo.jpg";

const InsumoCard = ({ insumo, onVerDetalles }) => {
  const imgSrc = insumo?.imagen || FALLBACK_IMG;

  const getStockColor = (cantidad) => {
    if (cantidad === 0) return 'bg-red-100 text-red-800';
    if (cantidad <= 10) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockText = (cantidad) => {
    if (cantidad === 0) return 'Agotado';
    if (cantidad <= 10) return 'Stock bajo';
    return 'Disponible';
  };

  const formatCantidad = (cantidad, unidad) => {
    if (!unidad) return `${cantidad} unidades`;
    return `${cantidad} ${unidad.nombre}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
      <div className="h-48 overflow-hidden">
        <img
          src={imgSrc}
          alt={insumo?.nombre || "insumo"}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
        />
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800 text-lg line-clamp-1 flex-1">
            {insumo?.nombre || "Sin nombre"}
          </h3>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full capitalize shrink-0 ml-2 ${getStockColor(insumo?.cantidad)}`}>
            {getStockText(insumo?.cantidad)}
          </span>
        </div>

        <div className="space-y-2 mb-3 flex-grow">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Cantidad:</span>
            <span>{formatCantidad(insumo?.cantidad, insumo?.unidad)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Unidad:</span>
            <span>{insumo?.unidad?.nombre || "No especificada"}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Tipo:</span>
            <span>{insumo?.tipo_insumo?.nombre || "No especificado"}</span>
          </div>

          {insumo?.descripcion && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <span className="font-medium min-w-20">Descripción:</span>
              <span className="line-clamp-2">{insumo.descripcion}</span>
            </div>
          )}
        </div>

        <Button
          onClick={() => onVerDetalles(insumo)}
          variant="inventario"
        >
          Más información
        </Button>
      </div>
    </div>
  );
};

export default InsumoCard;
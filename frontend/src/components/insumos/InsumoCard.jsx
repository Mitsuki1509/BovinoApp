import { Button } from '@/components/ui/button';

const FALLBACK_IMG = "/placeholder-insumo.jpg";

const InsumoCard = ({ insumo, onVerDetalles }) => {
  const imgSrc = insumo?.imagen || FALLBACK_IMG;

  const truncarTexto = (texto, maxCaracteres = 60) => {
    if (!texto || typeof texto !== 'string') return '';
    if (texto.length <= maxCaracteres) return texto;
    return texto.substring(0, maxCaracteres) + '...';
  };

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
          <h3 
            className="font-semibold text-gray-800 text-lg flex-1 min-w-0"
            title={insumo?.nombre}
          >
            <div className="truncate">
              {truncarTexto(insumo?.nombre, 25)}
            </div>
          </h3>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full capitalize shrink-0 ml-2 ${getStockColor(insumo?.cantidad)}`}>
            {getStockText(insumo?.cantidad)}
          </span>
        </div>

        <div className="space-y-2 mb-3 flex-grow">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium shrink-0">Cantidad:</span>
            <div className="min-w-0 flex-1">
              <div className="truncate" title={formatCantidad(insumo?.cantidad, insumo?.unidad)}>
                {truncarTexto(formatCantidad(insumo?.cantidad, insumo?.unidad), 20)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium shrink-0">Unidad:</span>
            <div className="min-w-0 flex-1">
              <div className="truncate" title={insumo?.unidad?.nombre || "No especificada"}>
                {truncarTexto(insumo?.unidad?.nombre || "No especificada", 20)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium shrink-0">Tipo:</span>
            <div className="min-w-0 flex-1">
              <div className="truncate" title={insumo?.tipo_insumo?.nombre || "No especificado"}>
                {truncarTexto(insumo?.tipo_insumo?.nombre || "No especificado", 20)}
              </div>
            </div>
          </div>

          {insumo?.descripcion && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium shrink-0 ">Descripción:</span>
              <div className="min-w-0 flex-1">
                <div 
                  className="line-clamp-2 break-words"
                  title={insumo.descripcion}
                >
                  {truncarTexto(insumo.descripcion, 50)}
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={() => onVerDetalles(insumo)}
          variant="inventario"
          className="mt-auto"
        >
          Más información
        </Button>
      </div>
    </div>
  );
};

export default InsumoCard;
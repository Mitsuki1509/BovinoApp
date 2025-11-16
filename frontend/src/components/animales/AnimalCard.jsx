const FALLBACK_IMG = "/placeholder-animal.jpg";
import { Button } from '@/components/ui/button'
const AnimalCard = ({ animal, onVerDetalles }) => {
  const imgSrc = animal?.imagen || FALLBACK_IMG;

  const getSexoText = (sexo) => sexo === 'M' ? 'Macho' : 'Hembra';
  const getSexoColor = (sexo) => sexo === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800';

  const calculateEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'Edad no disponible';
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let años = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    
    if (meses < 0) {
      años--;
      meses += 12;
    }
    
    if (años === 0) {
      return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    }
    
    return `${años} ${años === 1 ? 'año' : 'años'}${meses > 0 ? `, ${meses} ${meses === 1 ? 'mes' : 'meses'}` : ''}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
      <div className="h-48 overflow-hidden">
        <img
          src={imgSrc}
          alt={animal?.arete || "animal"}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800 text-lg line-clamp-1">
            {animal?.arete || "Sin arete"}
          </h3>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full capitalize shrink-0 ml-2 ${getSexoColor(animal?.sexo)}`}>
            {getSexoText(animal?.sexo)}
          </span>
        </div>

        <div className="space-y-2 mb-3 flex-grow">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Raza:</span>
            <span>{animal?.raza?.nombre || "No especificada"}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Lote:</span>
            <span>{animal?.lote?.descripcion || "Sin asignar"}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Edad:</span>
            <span>{calculateEdad(animal?.fecha_nacimiento)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Padres:</span>
            <span>{(animal?.madre || animal?.padre) ? 'Registrados' : 'No registrados'}</span>
          </div>
        </div>

        <Button
          onClick={() => onVerDetalles(animal)}
          variant="ganado"
        >
          Más información
        </Button>
      </div>
    </div>
  );
};

export default AnimalCard;
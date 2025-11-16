import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin,  Calendar, Tag, Edit, Trash2, Clock } from 'lucide-react';

const FALLBACK_IMG = "/placeholder-animal.jpg";

const AnimalDetails = ({ animal, onEditar, onEliminar, canManage }) => {
  if (!animal) return null;

  const getSexoText = (sexo) => sexo === 'M' ? 'Macho' : 'Hembra';
  const getSexoColor = (sexo) => sexo === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800';

  const calculateEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'No disponible';
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

  const formatFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const handleDeleteClick = () => {
    onEliminar(animal);
  };

  const imgSrc = animal?.imagen || FALLBACK_IMG;

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="w-full max-w-xs">
          <img
            src={imgSrc}
            alt={animal?.arete || "animal"}
            className="w-full h-56 object-cover rounded-lg shadow-md"
            onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
          />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {animal?.arete || "Sin arete"}
        </h2>
        <div className="flex gap-2 justify-center">
          <Badge className={`text-sm ${getSexoColor(animal.sexo)}`}>
            {getSexoText(animal.sexo)}
          </Badge>
          {animal.raza && (
            <Badge variant="outline" className="text-sm">
              {animal.raza.nombre}
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Animal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                {formatFecha(animal.fecha_nacimiento)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Edad</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                {calculateEdad(animal.fecha_nacimiento)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Raza</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                {animal.raza?.nombre || 'No especificada'}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Lote</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                {animal.lote?.descripcion || 'Sin lote asignado'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Madre</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                {animal.madre?.arete || 'No registrada'}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Padre</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                {animal.padre?.arete || 'No registrado'}
              </div>
            </div>
          </div>

          {animal.fecha_destete && (
            <div>
              <label className="text-sm font-medium text-gray-700">Fecha de Destete</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                {formatFecha(animal.fecha_destete)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => onEditar(animal)}
            className="flex-1"
            variant="ganado"
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

export default AnimalDetails;
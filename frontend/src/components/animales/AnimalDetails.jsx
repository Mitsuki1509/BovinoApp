import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Calendar, Tag, Edit, Trash2, User, Clock } from 'lucide-react';

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
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteClick = () => {
    onEliminar(animal);
  };

  const imgSrc = animal?.imagen || FALLBACK_IMG;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
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

        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {animal?.arete || "Sin arete"}
            </h2>
            <div className="flex gap-2 justify-center">
              <Badge className={`text-sm ${getSexoColor(animal.sexo)}`}>
                {getSexoText(animal.sexo)}
              </Badge>
              {animal.raza && (
                <Badge variant="outline" className="text-sm flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {animal.raza.nombre}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Nacimiento</p>
                <p className="font-medium text-sm">
                  {formatFecha(animal.fecha_nacimiento)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Edad</p>
                <p className="font-medium text-sm">{calculateEdad(animal.fecha_nacimiento)}</p>
              </div>
            </div>

            {animal.lote && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600">Lote</p>
                  <p className="font-medium text-sm">{animal.lote.descripcion}</p>
                </div>
              </div>
            )}

            {animal.fecha_destete && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600">Destete</p>
                  <p className="font-medium text-sm">
                    {formatFecha(animal.fecha_destete)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Parentesco
            </CardTitle>
            <CardDescription className="text-xs">Progenitores del animal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Madre</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                {animal.madre ? (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-pink-600" />
                    <span>{animal.madre.arete}</span>
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-xs">No registrada</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Padre</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                {animal.padre ? (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-blue-600" />
                    <span>{animal.padre.arete}</span>
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-xs">No registrado</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4" />
              Información Adicional
            </CardTitle>
            <CardDescription className="text-xs">Datos complementarios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Raza</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                {animal.raza ? (
                  <div>
                    <p className="font-medium">{animal.raza.nombre}</p>
                    {animal.raza.descripcion && (
                      <p className="text-xs text-gray-600 mt-1">{animal.raza.descripcion}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-xs">No especificada</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Ubicación</label>
              <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                {animal.lote ? (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-green-600" />
                    <span>{animal.lote.descripcion}</span>
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-xs">Sin lote asignado</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {canManage && (
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={() => onEditar(animal)}
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

export default AnimalDetails;
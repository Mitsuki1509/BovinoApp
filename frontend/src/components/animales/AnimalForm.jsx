import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Upload, X, MapPin, Tag, AlertCircle, Users } from 'lucide-react';
import { format, differenceInMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAnimalStore } from '@/store/animalStore';
import { useLoteStore } from '@/store/loteStore';
import { useRazaStore } from '@/store/razaStore';
import { Combobox } from '@/components/ui/combobox';

const AnimalForm = ({ 
  animal = null, 
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [formError, setFormError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const { 
    createAnimal, 
    updateAnimal,
    animales,
    fetchAnimales
  } = useAnimalStore();
  
  const { 
    lotes = [], 
    fetchLotes
  } = useLoteStore();
  
  const { 
    razas = [], 
    fetchRazas
  } = useRazaStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      arete: '',
      sexo: '',
      fecha_nacimiento: null,
      fecha_destete: null,
      lote_id: 'null',
      raza_id: 'null',
      animal_madre_id: 'null',
      animal_padre_id: 'null',
      imagen: null
    }
  });

  const getAnimalesAptosParaReproduccion = () => {
    const fechaNacimiento = watch('fecha_nacimiento');
    if (!fechaNacimiento) return { madres: [], padres: [] };

    const madresAptas = animales.filter(animal => {
      if (animal.sexo !== 'H') return false;
      
      const edadEnMeses = differenceInMonths(fechaNacimiento, new Date(animal.fecha_nacimiento));
      return edadEnMeses >= 15;
    });

    const padresAptos = animales.filter(animal => {
      if (animal.sexo !== 'M') return false;
      
      const edadEnMeses = differenceInMonths(fechaNacimiento, new Date(animal.fecha_nacimiento));
      return edadEnMeses >= 18;
    });

    return { madres: madresAptas, padres: padresAptos };
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchLotes(),
          fetchRazas(),
          fetchAnimales()
        ]);

        if (animal) {
          setIsEditing(true);
          reset({
            arete: animal.arete || '',
            sexo: animal.sexo || '',
            fecha_nacimiento: animal.fecha_nacimiento ? new Date(animal.fecha_nacimiento) : null,
            fecha_destete: animal.fecha_destete ? new Date(animal.fecha_destete) : null,
            lote_id: animal.lote_id ? animal.lote_id.toString() : 'null',
            raza_id: animal.raza_id ? animal.raza_id.toString() : 'null',
            animal_madre_id: animal.animal_madre_id ? animal.animal_madre_id.toString() : 'null',
            animal_padre_id: animal.animal_padre_id ? animal.animal_padre_id.toString() : 'null',
            imagen: null
          });
          
          if (animal.imagen) {
            setImagenPreview(animal.imagen);
          }
        } else {
          setIsEditing(false);
          reset({
            arete: '',
            sexo: '',
            fecha_nacimiento: null,
            fecha_destete: null,
            lote_id: 'null',
            raza_id: 'null',
            animal_madre_id: 'null',
            animal_padre_id: 'null',
            imagen: null
          });
        }
      } catch (error) {
        setFormError('Error al cargar los datos necesarios');
      }
    };

    loadInitialData();
  }, [animal, reset, fetchLotes, fetchRazas, fetchAnimales]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue('imagen', file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagenPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setValue('imagen', null);
    setImagenPreview(null);
  };

  const { madres, padres } = getAnimalesAptosParaReproduccion();

  const madreOptions = [
    { value: 'null', label: 'Sin madre registrada' },
    ...madres.map(madre => ({
      value: madre.animal_id.toString(),
      label: `${madre.arete}${madre.raza ? ` - ${madre.raza.nombre}` : ''}`
    }))
  ];

  const padreOptions = [
    { value: 'null', label: 'Sin padre registrado' },
    ...padres.map(padre => ({
      value: padre.animal_id.toString(),
      label: `${padre.arete}${padre.raza ? ` - ${padre.raza.nombre}` : ''}`
    }))
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    setFormError('');
    
    try {
      if (!data.arete || !data.arete.trim()) {
        throw new Error('El número de arete es requerido');
      }

      if (!data.sexo) {
        throw new Error('El sexo es requerido');
      }

      if (!data.fecha_nacimiento) {
        throw new Error('La fecha de nacimiento es requerida');
      }

      const fechaNacimientoISO = data.fecha_nacimiento 
        ? data.fecha_nacimiento.toISOString().split('T')[0]
        : null;

      const fechaDesteteISO = data.fecha_destete 
        ? data.fecha_destete.toISOString().split('T')[0]
        : null;

      const formData = {
        arete: data.arete.trim(),
        sexo: data.sexo,
        fecha_nacimiento: fechaNacimientoISO,
        fecha_destete: fechaDesteteISO,
        lote_id: data.lote_id === 'null' ? null : parseInt(data.lote_id),
        raza_id: data.raza_id === 'null' ? null : parseInt(data.raza_id),
        animal_madre_id: data.animal_madre_id === 'null' ? null : parseInt(data.animal_madre_id),
        animal_padre_id: data.animal_padre_id === 'null' ? null : parseInt(data.animal_padre_id),
        imagen: data.imagen
      };

      let result;
      
      if (isEditing) {
        result = await updateAnimal(animal.animal_id, formData);
      } else {
        result = await createAnimal(formData);
      }

      if (result?.success) {
        onSuccess?.();
      } else {
        const errorMessage = result?.error || 'Error al guardar el animal';
        throw new Error(`Error del servidor: ${errorMessage}. Por favor verifica todos los campos.`);
      }
    } catch (error) {
      setFormError(error.message || 'Error al guardar el animal. Verifica que todos los campos estén correctos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl mx-auto">
      {formError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">Error de validación</p>
            <p>{formError}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 px-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4 text-blue-600" />
              Información Básica
            </CardTitle>
            <CardDescription className="text-xs">
              Datos principales de identificación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4">
            <div className="space-y-2">
              <Label htmlFor="arete" className="text-sm">
                Número de Arete 
              </Label>
              <Input
                id="arete"
                placeholder="Ej: A001"
                {...register('arete', { 
                  required: 'El número de arete es obligatorio'
                })}
                className={errors.arete ? 'border-red-500 h-9' : 'h-9'}
              />
              {errors.arete && (
                <p className="text-red-500 text-xs mt-1">{errors.arete.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">
                  Sexo 
                </Label>
                <Select 
                  onValueChange={(value) => setValue('sexo', value)}
                  defaultValue={watch('sexo')}
                >
                  <SelectTrigger className={errors.sexo ? 'border-red-500 h-9' : 'h-9'}>
                    <SelectValue placeholder="Seleccione sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Macho</SelectItem>
                    <SelectItem value="H">Hembra</SelectItem>
                  </SelectContent>
                </Select>
                {errors.sexo && (
                  <p className="text-red-500 text-xs mt-1">El sexo es obligatorio</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">
                  Raza
                </Label>
                <Combobox
                  options={[
                    { value: 'null', label: 'Sin raza' },
                    ...razas.map(raza => ({
                      value: raza.raza_id.toString(),
                      label: raza.nombre
                    }))
                  ]}
                  value={watch('raza_id')}
                  onValueChange={(value) => setValue('raza_id', value)}
                  placeholder="Buscar raza..."
                  disabled={loading}
                  className="h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-4 w-4 text-green-600" />
              Fechas Importantes
            </CardTitle>
            <CardDescription className="text-xs">
              Fechas relevantes del animal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm">
                Fecha de Nacimiento 
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9",
                      !watch('fecha_nacimiento') && "text-muted-foreground",
                      errors.fecha_nacimiento && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {watch('fecha_nacimiento') ? (
                      format(watch('fecha_nacimiento'), 'dd/MM/yyyy', { locale: es })
                    ) : (
                      <span>Seleccione fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watch('fecha_nacimiento')}
                    onSelect={(date) => setValue('fecha_nacimiento', date)}
                    initialFocus
                    locale={es}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              {errors.fecha_nacimiento && (
                <p className="text-red-500 text-xs mt-1">La fecha de nacimiento es obligatoria</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm">
                Fecha de Destete
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9",
                      !watch('fecha_destete') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {watch('fecha_destete') ? (
                      format(watch('fecha_destete'), 'dd/MM/yyyy', { locale: es })
                    ) : (
                      <span>Destete (opcional)</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watch('fecha_destete')}
                    onSelect={(date) => setValue('fecha_destete', date)}
                    initialFocus
                    locale={es}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-purple-600" />
              Parentesco
            </CardTitle>
            <CardDescription className="text-xs">
              Padre y madre del animal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm">
                Madre
              </Label>
              <Combobox
                options={madreOptions}
                value={watch('animal_madre_id')}
                onValueChange={(value) => setValue('animal_madre_id', value)}
                placeholder="Buscar madre..."
                disabled={loading || !watch('fecha_nacimiento')}
                className="h-9"
              />
              <p className="text-xs text-gray-500 mt-1">
                {watch('fecha_nacimiento') 
                  ? `${madres.length} hembras aptas`
                  : 'Seleccione fecha primero'
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">
                Padre
              </Label>
              <Combobox
                options={padreOptions}
                value={watch('animal_padre_id')}
                onValueChange={(value) => setValue('animal_padre_id', value)}
                placeholder="Buscar padre..."
                disabled={loading || !watch('fecha_nacimiento')}
                className="h-9"
              />
              <p className="text-xs text-gray-500 mt-1">
                {watch('fecha_nacimiento') 
                  ? `${padres.length} machos aptos`
                  : 'Seleccione fecha primero'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-orange-600" />
              Ubicación
            </CardTitle>
            <CardDescription className="text-xs">
              Lote de pertenencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-sm">
                Lote
              </Label>
              <Combobox
                options={[
                  { value: 'null', label: 'Sin lote' },
                  ...lotes.map(lote => ({
                    value: lote.lote_id.toString(),
                    label: lote.descripcion
                  }))
                ]}
                value={watch('lote_id')}
                onValueChange={(value) => setValue('lote_id', value)}
                placeholder="Buscar lote..."
                disabled={loading}
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-indigo-600" />
              Fotografía
            </CardTitle>
            <CardDescription className="text-xs">
              Imagen de identificación (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="cursor-pointer h-9"
            />

            {imagenPreview && (
              <div className="relative inline-block">
                <img
                  src={imagenPreview}
                  alt="Preview"
                  className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="w-full py-4 font-semibold"
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Actualizar Animal' : 'Crear Animal'}
        </Button>
      </div>
    </form>
  );
};

export default AnimalForm;
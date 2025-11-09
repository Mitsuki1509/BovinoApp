import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { FaCow } from 'react-icons/fa6';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const AnimalForm = ({ 
  animal = null, 
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [formError, setFormError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
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

  const form = useForm({
    defaultValues: {
      arete: '',
      sexo: '',
      fecha_nacimiento: null,
      fecha_destete: null,
      lote_id: '',
      raza_id: '',
      animal_madre_id: '',
      animal_padre_id: '',
      imagen: null
    }
  });

  const getAnimalesAptosParaReproduccion = () => {
    const fechaNacimiento = form.watch('fecha_nacimiento');
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
          form.reset({
            arete: animal.arete || '',
            sexo: animal.sexo || '',
            fecha_nacimiento: animal.fecha_nacimiento ? new Date(animal.fecha_nacimiento) : null,
            fecha_destete: animal.fecha_destete ? new Date(animal.fecha_destete) : null,
            lote_id: animal.lote_id ? animal.lote_id.toString() : '',
            raza_id: animal.raza_id ? animal.raza_id.toString() : '',
            animal_madre_id: animal.animal_madre_id ? animal.animal_madre_id.toString() : '',
            animal_padre_id: animal.animal_padre_id ? animal.animal_padre_id.toString() : '',
            imagen: null
          });
          
          if (animal.imagen) {
            setImagenPreview(animal.imagen);
          }
        } else {
          setIsEditing(false);
          form.reset({
            arete: '',
            sexo: '',
            fecha_nacimiento: null,
            fecha_destete: null,
            lote_id: '',
            raza_id: '',
            animal_madre_id: '',
            animal_padre_id: '',
            imagen: null
          });
        }
      } catch (error) {
        setFormError('Error al cargar los datos necesarios');
      }
    };

    loadInitialData();
  }, [animal, form, fetchLotes, fetchRazas, fetchAnimales]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      form.setValue('imagen', file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagenPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    form.setValue('imagen', null);
    setImagenPreview(null);
  };

  const { madres, padres } = getAnimalesAptosParaReproduccion();

  const madreOptions = [
    { value: '', label: 'Sin madre registrada' },
    ...madres.map(madre => ({
      value: madre.animal_id.toString(),
      label: `${madre.arete}${madre.raza ? ` - ${madre.raza.nombre}` : ''}`
    }))
  ];

  const padreOptions = [
    { value: '', label: 'Sin padre registrado' },
    ...padres.map(padre => ({
      value: padre.animal_id.toString(),
      label: `${padre.arete}${padre.raza ? ` - ${padre.raza.nombre}` : ''}`
    }))
  ];

  const loteOptions = lotes.map(lote => ({
    value: lote.lote_id.toString(),
    label: `${lote.codigo} - ${lote.descripcion}`
  }));

  const razaOptions = razas.map(raza => ({
    value: raza.raza_id.toString(),
    label: raza.nombre
  }));

  const onSubmit = async (data) => {
    setLoading(true);
    setFormError('');
    setFieldErrors({});
    
    try {
      if (!data.lote_id || data.lote_id === '') {
        throw new Error('El lote es requerido');
      }
      
      if (!data.raza_id || data.raza_id === '') {
        throw new Error('La raza es requerida');
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
        lote_id: data.lote_id,
        raza_id: data.raza_id,
        animal_madre_id: data.animal_madre_id || '',
        animal_padre_id: data.animal_padre_id || '',
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
        
        if (errorMessage.includes('validación') || errorMessage.includes('validacion')) {
          setFormError('Por favor, verifique que todos los campos estén completos correctamente.');
        } else if (errorMessage.includes('arete') || errorMessage.includes('Arete') || errorMessage.includes('existe')) {
          setFieldErrors({
            arete: 'Ya existe un animal con este número de arete. Por favor, use un número diferente.'
          });
        } else if (errorMessage.includes('sexo') || errorMessage.includes('Sexo')) {
          setFieldErrors({
            sexo: 'El sexo es requerido'
          });
        } else if (errorMessage.includes('fecha_nacimiento') || errorMessage.includes('fecha')) {
          setFieldErrors({
            fecha_nacimiento: 'La fecha de nacimiento es requerida'
          });
        } else if (errorMessage.includes('lote') || errorMessage.includes('Lote')) {
          setFieldErrors({
            lote_id: 'El lote es requerido'
          });
        } else if (errorMessage.includes('raza') || errorMessage.includes('Raza')) {
          setFieldErrors({
            raza_id: 'La raza es requerida'
          });
        } else {
          setFormError(`Error: ${errorMessage}. Por favor, verifique los datos e intente nuevamente.`);
        }
      }
    } catch (error) {
      if (error.message.includes('lote')) {
        setFieldErrors({
          lote_id: 'El lote es requerido'
        });
      } else if (error.message.includes('raza')) {
        setFieldErrors({
          raza_id: 'La raza es requerida'
        });
      } else {
        setFormError(error.message || 'Error de conexión. Por favor, intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-xl mx-auto">
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
              <FormField
                control={form.control}
                name="arete"
                rules={{ 
                  required: "El número de arete es obligatorio",
                  minLength: {
                    value: 1,
                    message: "El número de arete es requerido"
                  },
                  maxLength: {
                    value: 255,
                    message: "El número de arete no puede tener más de 255 caracteres"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Número de Arete </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: A001"
                        {...field}
                        disabled={loading}
                        className="text-sm h-9"
                      />
                    </FormControl>
                    <FormMessage className="text-xs">
                      {fieldErrors.arete || form.formState.errors.arete?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="sexo"
                  rules={{ 
                    required: "El sexo es obligatorio"
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Sexo </FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Seleccione sexo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">Macho</SelectItem>
                          <SelectItem value="H">Hembra</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs">
                        {fieldErrors.sexo || form.formState.errors.sexo?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="raza_id"
                  rules={{
                    required: "La raza es requerida",
                    validate: value => value !== '' || 'La raza es requerida'
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Raza </FormLabel>
                      <FormControl>
                        <Combobox
                          options={razaOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Seleccionar raza..."
                          disabled={loading}
                          className="h-9"
                        />
                      </FormControl>
                      <FormMessage className="text-xs">
                        {fieldErrors.raza_id || form.formState.errors.raza_id?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
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
              <FormField
                control={form.control}
                name="fecha_nacimiento"
                rules={{ 
                  required: "La fecha de nacimiento es obligatoria"
                }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm">Fecha de Nacimiento </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-9",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy', { locale: es })
                            ) : (
                              <span>Seleccione fecha</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={es}
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs">
                      {fieldErrors.fecha_nacimiento || form.formState.errors.fecha_nacimiento?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha_destete"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm">Fecha de Destete</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-9",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy', { locale: es })
                            ) : (
                              <span>Destete (opcional)</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={es}
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs">
                      {form.formState.errors.fecha_destete?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FaCow className="h-4 w-4 text-purple-600" />
                Parentesco
              </CardTitle>
              <CardDescription className="text-xs">
                Padre y madre del animal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <FormField
                control={form.control}
                name="animal_madre_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Madre</FormLabel>
                    <FormControl>
                      <Combobox
                        options={madreOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Buscar madre..."
                        disabled={loading || !form.watch('fecha_nacimiento')}
                        className="h-9"
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500 mt-1">
                      {form.watch('fecha_nacimiento') 
                        ? `${madres.length} hembras aptas`
                        : 'Seleccione fecha primero'
                      }
                    </div>
                    <FormMessage className="text-xs">
                      {form.formState.errors.animal_madre_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="animal_padre_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Padre</FormLabel>
                    <FormControl>
                      <Combobox
                        options={padreOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Buscar padre..."
                        disabled={loading || !form.watch('fecha_nacimiento')}
                        className="h-9"
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500 mt-1">
                      {form.watch('fecha_nacimiento') 
                        ? `${padres.length} machos aptos`
                        : 'Seleccione fecha primero'
                      }
                    </div>
                    <FormMessage className="text-xs">
                      {form.formState.errors.animal_padre_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="lote_id"
                rules={{
                  required: "El lote es requerido",
                  validate: value => value !== '' || 'El lote es requerido'
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Lote </FormLabel>
                    <FormControl>
                      <Combobox
                        options={loteOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar lote..."
                        disabled={loading}
                        className="h-9"
                      />
                    </FormControl>
                    <FormMessage className="text-xs">
                      {fieldErrors.lote_id || form.formState.errors.lote_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
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
    </Form>
  );
};

export default AnimalForm;
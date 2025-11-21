import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Upload, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAnimalStore } from '@/store/animalStore';
import { useLoteStore } from '@/store/loteStore';
import { useRazaStore } from '@/store/razaStore';
import { Combobox } from '@/components/ui/combobox';
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

  const esAptoParaMonta = (animal) => {
    if (!animal.fecha_nacimiento) return false;
    
    const fechaNacimiento = new Date(animal.fecha_nacimiento);
    const fechaActual = new Date();
    
    let mesesDeEdad = (fechaActual.getFullYear() - fechaNacimiento.getFullYear()) * 12;
    mesesDeEdad += fechaActual.getMonth() - fechaNacimiento.getMonth();
    
    if (fechaActual.getDate() < fechaNacimiento.getDate()) {
      mesesDeEdad--;
    }
    
    if (animal.sexo === 'H') {
      return mesesDeEdad >= 15;
    } else if (animal.sexo === 'M') {
      return mesesDeEdad >= 18;
    }
    
    return false;
  };

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

  const fechaNacimiento = form.watch('fecha_nacimiento');

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

  const madreOptions = [
    ...animales
      .filter(a => a.sexo === 'H' && esAptoParaMonta(a))
      .map(madre => ({
        value: madre.animal_id.toString(),
        label: `${madre.arete}${madre.raza ? ` - ${madre.raza.nombre}` : ''}`
      }))
  ];

  const padreOptions = [
    ...animales
      .filter(a => a.sexo === 'M' && esAptoParaMonta(a))
      .map(padre => ({
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
      const errors = {};
      
      if (!data.arete || data.arete.trim() === '') {
        errors.arete = 'El número de arete es requerido';
      }
      
      if (!data.sexo || data.sexo === '') {
        errors.sexo = 'El sexo es requerido';
      }
      
      if (!data.fecha_nacimiento) {
        errors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
      }

      // Validar que la fecha de destete no sea más antigua que la fecha de nacimiento
      if (data.fecha_destete && data.fecha_nacimiento) {
        const fechaDestete = new Date(data.fecha_destete);
        const fechaNacimiento = new Date(data.fecha_nacimiento);
        
        if (fechaDestete < fechaNacimiento) {
          errors.fecha_destete = 'La fecha de destete no puede ser anterior a la fecha de nacimiento';
        }
      }

      if (!data.lote_id || data.lote_id === '') {
        errors.lote_id = 'El lote es requerido';
      }

      if (!data.raza_id || data.raza_id === '') {
        errors.raza_id = 'La raza es requerida';
      }

      if (data.animal_madre_id) {
        const madreSeleccionada = animales.find(a => a.animal_id.toString() === data.animal_madre_id);
        if (madreSeleccionada && !esAptoParaMonta(madreSeleccionada)) {
          errors.animal_madre_id = 'La madre seleccionada no cumple con la edad mínima de 15 meses para reproducción';
        }
      }

      if (data.animal_padre_id) {
        const padreSeleccionado = animales.find(a => a.animal_id.toString() === data.animal_padre_id);
        if (padreSeleccionado && !esAptoParaMonta(padreSeleccionado)) {
          errors.animal_padre_id = 'El padre seleccionado no cumple con la edad mínima de 18 meses para reproducción';
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        throw new Error('Por favor, complete todos los campos requeridos');
      }

      const fechaNacimientoISO = data.fecha_nacimiento.toISOString().split('T')[0];
      const fechaDesteteISO = data.fecha_destete ? data.fecha_destete.toISOString().split('T')[0] : null;

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
        setFormError(errorMessage);
      }
    } catch (error) {
      setFormError(error.message || 'Error de conexión. Por favor, intente nuevamente.');
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
        
        <Card>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="arete"
              rules={{ 
                required: "El número de arete es obligatorio",
                minLength: { value: 1, message: "El número de arete es requerido" },
                maxLength: { value: 255, message: "El número de arete no puede tener más de 255 caracteres" }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Número de Arete</FormLabel>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sexo"
                rules={{ required: "El sexo es obligatorio" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Sexo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                rules={{ required: "La raza es requerida" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Raza</FormLabel>
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

            <FormField
              control={form.control}
              name="fecha_nacimiento"
              rules={{ required: "La fecha de nacimiento es obligatoria" }}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm">Fecha de Nacimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal h-9", !field.value && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : 'Seleccione fecha'}
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
                          className={cn("w-full justify-start text-left font-normal h-9", !field.value && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : 'Destete (opcional)'}
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
                        disabled={(date) => {
                          if (date > new Date()) return true;
                          
                          if (fechaNacimiento && date < fechaNacimiento) return true;
                          
                          return false;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs">
                    {fieldErrors.fecha_destete || form.formState.errors.fecha_destete?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lote_id"
              rules={{ required: "El lote es requerido" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Lote</FormLabel>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        disabled={loading}
                        className="h-9"
                      />
                    </FormControl>
                    <FormMessage className="text-xs">
                      {fieldErrors.animal_madre_id || form.formState.errors.animal_madre_id?.message}
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
                        disabled={loading}
                        className="h-9"
                      />
                    </FormControl>
                    <FormMessage className="text-xs">
                      {fieldErrors.animal_padre_id || form.formState.errors.animal_padre_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-indigo-600" />
              Fotografía (opcional)
            </CardTitle>
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

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-4 font-semibold"
          variant="ganado"
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Actualizar Animal' : 'Crear Animal'}
        </Button>
      </form>
    </Form>
  );
};

export default AnimalForm;
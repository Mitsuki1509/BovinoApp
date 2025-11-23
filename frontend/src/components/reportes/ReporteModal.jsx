import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

const ReporteModal = ({ isOpen, onClose, onSuccess }) => {
  const { enviarReporte } = useDashboardStore();
  const { toast } = useToast();
  
  const [sending, setSending] = useState(false);
  const [tiposReporte, setTiposReporte] = useState([]);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const form = useForm({
    defaultValues: {
      email: '',
      reportType: '',
      fechaInicio: null,
      fechaFin: null,
      usuarioSolicitante: ''
    }
  });

  const fechaInicio = form.watch('fechaInicio');

  useEffect(() => {
    if (isOpen) {
      cargarTiposReporte();
      
      const fechaFin = new Date();
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 30);
      
      form.reset({
        email: '',
        reportType: '',
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        usuarioSolicitante: ''
      });
    } else {
      form.reset({
        email: '',
        reportType: '',
        fechaInicio: null,
        fechaFin: null,
        usuarioSolicitante: ''
      });
      setFormError('');
      setFieldErrors({});
    }
  }, [isOpen, form]);

  const cargarTiposReporte = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/reportes/tipos-reporte', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          setTiposReporte(result.data);
        }
      }
    } catch (error) {
      console.error('Error cargando tipos de reporte:', error);
    }
  };

  const onSubmit = async (data) => {
    setFormError('');
    setFieldErrors({});
    setSending(true);

    try {
      const fechaInicioISO = data.fechaInicio ? format(data.fechaInicio, 'yyyy-MM-dd') : '';
      const fechaFinISO = data.fechaFin ? format(data.fechaFin, 'yyyy-MM-dd') : '';

      const result = await enviarReporte({
        ...data,
        fechaInicio: fechaInicioISO,
        fechaFin: fechaFinISO
      });

      if (result?.success) {
        toast({
          title: "Reporte enviado",
          description: result.msg || "El reporte se ha enviado exitosamente",
        });
        onSuccess?.();
      } else {
        const errorMsg = result?.error || 'Error al procesar la solicitud';
        
        if (errorMsg.includes('validación') || errorMsg.includes('validacion')) {
          setFormError('Por favor, verifique que todos los campos estén completos correctamente.');
        } else if (errorMsg.includes('email') || errorMsg.includes('correo')) {
          setFieldErrors({
            email: 'Por favor, ingrese un correo electrónico válido.'
          });
        } else {
          setFormError(`Error: ${errorMsg}. Por favor, verifique los datos e intente nuevamente.`);
        }
      }
      
    } catch (error) {
      setFormError('Error de conexión. Por favor, intente nuevamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Generar Reporte
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Envía un reporte en Excel por correo
          </DialogDescription>
        </DialogHeader>
        
        <Card className="w-full border-0 shadow-none">
          <CardContent className="p-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                {formError && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {formError}
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    rules={{ 
                      required: "El correo electrónico es requerido",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Correo electrónico inválido"
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">Correo Electrónico</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="ejemplo@empresa.com" 
                            {...field} 
                            disabled={sending}
                            className="w-full text-sm sm:text-base"
                          />
                        </FormControl>
                        <FormMessage className="text-xs sm:text-sm">
                          {fieldErrors.email || form.formState.errors.email?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reportType"
                    rules={{ required: "El tipo de reporte es requerido" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">Tipo de Reporte</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={sending}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full text-sm sm:text-base">
                              <SelectValue placeholder="Seleccionar reporte" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tiposReporte.map(tipo => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs sm:text-sm">
                          {fieldErrors.reportType || form.formState.errors.reportType?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fechaInicio"
                      rules={{ required: "La fecha de inicio es requerida" }}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm sm:text-base">Fecha Inicio</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={sending}
                                >
                                  {field.value ? format(field.value, 'dd/MM/yyyy') : 'Seleccione fecha'}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                          <FormMessage className="text-xs sm:text-sm">
                            {fieldErrors.fechaInicio || form.formState.errors.fechaInicio?.message}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fechaFin"
                      rules={{ 
                        required: "La fecha de fin es requerida",
                        validate: (value) => {
                          if (fechaInicio && value && value < fechaInicio) {
                            return "La fecha fin no puede ser anterior a la fecha inicio";
                          }
                          return true;
                        }
                      }}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm sm:text-base">Fecha Fin</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={sending}
                                >
                                  {field.value ? format(field.value, 'dd/MM/yyyy') : 'Seleccione fecha'}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                                  if (fechaInicio && date < fechaInicio) return true;
                                  return false;
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-xs sm:text-sm">
                            {fieldErrors.fechaFin || form.formState.errors.fechaFin?.message}
                          </FormMessage>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="usuarioSolicitante"
                    rules={{ 
                      required: "El nombre del solicitante es requerido",
                      minLength: { value: 2, message: "El nombre debe tener al menos 2 caracteres" }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">Solicitado por</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Tu nombre completo"
                            disabled={sending}
                            className="w-full text-sm sm:text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs sm:text-sm">
                          {fieldErrors.usuarioSolicitante || form.formState.errors.usuarioSolicitante?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-2 sm:pt-4">
                  <Button 
                    type="submit" 
                    disabled={sending}
                    className="w-full text-sm sm:text-base"
                    size="lg"
                    variant="inventario"
                  >
                    {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Reporte
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ReporteModal;
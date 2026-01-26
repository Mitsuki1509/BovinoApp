import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent } from '@/components/ui/card';
import { Loader2, Lock } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription, 
} from '@/components/ui/dialog';
import { useUserAdminStore } from '@/store/userAdminStore';

const Modal = ({ 
  usuario = null,
  onSuccess 
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  
  const { resetPassword, loading, error } = useUserAdminStore();

  const form = useForm({
    defaultValues: {
      nueva_contraseña: '',
      confirmar_contraseña: ''
    }
  });

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        triggerRef.current?.focus?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const onSubmit = async (data) => {
    const errors = {};

    if (!data.nueva_contraseña) {
      errors.nueva_contraseña = 'La nueva contraseña es requerida';
    } else if (data.nueva_contraseña.length < 6) {
      errors.nueva_contraseña = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!data.confirmar_contraseña) {
      errors.confirmar_contraseña = 'Debe confirmar la nueva contraseña';
    } else if (data.nueva_contraseña !== data.confirmar_contraseña) {
      errors.confirmar_contraseña = 'Las contraseñas no coinciden';
    }

    if (Object.keys(errors).length > 0) {
      Object.keys(errors).forEach(field => {
        form.setError(field, { message: errors[field] });
      });
      return;
    }

    const result = await resetPassword(usuario?.usuario_id, data.nueva_contraseña);

    if (result.success) {
      form.reset();
      setOpen(false);
      onSuccess?.('Contraseña actualizada exitosamente');
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          ref={triggerRef}
          variant="ghost" 
          className="w-full text-right"
        >
          <Lock className="h-4 w-4"/>
          Cambiar Contraseña
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Formulario para cambiar la contraseña del usuario {usuario?.nombre}. 
          </DialogDescription>
        </DialogHeader>
        
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="nueva_contraseña"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Ingrese la nueva contraseña" 
                          {...field} 
                          disabled={loading}
                          className="w-full"
                        />
                      </FormControl>
                      <div id="password-help" className="text-xs text-muted-foreground">
                        Mínimo 6 caracteres
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmar_contraseña"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Confirme la nueva contraseña" 
                          {...field} 
                          disabled={loading}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1"
                  variant="login"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Cambiar Contraseña
                </Button>
                
               
              </div>
            </form>
          </Form>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
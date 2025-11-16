import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Lock } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { useUserAdminStore } from '@/store/userAdminStore';

const Modal = ({ 
  usuario = null,
  onSuccess 
}) => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [open, setOpen] = useState(false);
  
  const { resetPassword, loading, error } = useUserAdminStore();

  const form = useForm({
    defaultValues: {
      nueva_contraseña: '',
      confirmar_contraseña: ''
    }
  });

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
        <Button variant="ghost" className="w-full justify-start">
          <Lock className=" h-4 w-4" />
          Cambiar Contraseña
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
        </DialogHeader>
        
          <CardContent className="p-0 pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nueva_contraseña"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva Contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Ingrese la nueva contraseña" 
                              {...field} 
                              disabled={loading}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
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
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirme la nueva contraseña" 
                              {...field} 
                              disabled={loading}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
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
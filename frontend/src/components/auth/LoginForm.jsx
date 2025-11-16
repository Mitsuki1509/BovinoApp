import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const LoginForm = () => {
  const { 
    formData,
    setFormData,
    loading, 
    login, 
    oauth, 
    fieldErrors,
    clearErrors
  } = useAuthStore();

  const form = useForm({
    defaultValues: {
      email: formData.email,
      password: formData.password
    }
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const email = urlParams.get('email');

    if (error === 'user_not_found' && email) {
      form.setValue('email', email);
      setFormData('email', email);
    }
    
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [form, setFormData]);

  useEffect(() => {
    form.setValue('email', formData.email);
    form.setValue('password', formData.password);
  }, [form, formData]);

  const onSubmit = async (data) => {
    setFormData('email', data.email);
    setFormData('password', data.password);
    
    const success = await login();
    if (success) {
      window.location.href = '/dashboard';
    }
  };

  const handleFieldChange = (fieldName, value) => {
    clearErrors();
    setFormData(fieldName, value);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat bg-fixed py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: 'url("/login.jpg")',
      }}
    >
      <div className="absolute inset-0 "></div>
      
      <Card className="w-full max-w-md relative z-10 bg-white/60 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full overflow-hidden flex items-center justify-center mb-4">
            <img 
              src="/logo.jpg" 
              alt="Logo Finca San Pablo" 
              className="object-cover rounded-full"
            />
          </div>

          <CardTitle className="text-2xl">Finca San Pablo</CardTitle>
          <CardDescription>
            Ingresa a tu cuenta para gestionar la finca
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel className="text-sm sm:text-base">Correo electrónico</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        {...field}
                        disabled={loading}
                        className="w-full text-sm sm:text-base border-neutral-400"
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange('email', e.target.value);
                        }}
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
                name="password"
                rules={{ 
                  required: "La contraseña es requerida",
                  minLength: {
                    value: 1,
                    message: "La contraseña es requerida"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={loading}
                        className="w-full text-sm sm:text-base  border-neutral-400"
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange('password', e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm">
                      {fieldErrors.password || form.formState.errors.password?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <div className="pt-2 sm:pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full text-sm sm:text-base"
                  variant="login"
                  size="lg"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Iniciar sesión
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-600">O inicia sesión con</span>
              </div>
            </div>

            <div className="mt-4">
              <Button
                onClick={oauth}
                type="button"
                variant="outline"
                className="w-full"
              >
                <div className="flex items-center justify-center gap-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.5 544.3" width="16" height="16">
                    <path fill="#4285F4" d="M533.5 278.4c0-17.3-1.5-34-4.3-50.3H272v95.1h146.9c-6.3 34.1-25.6 62.9-54.5 82v68.2h88.1c51.5-47.4 81-117.6 81-195z" />
                    <path fill="#34A853" d="M272 544.3c73.3 0 134.8-24.2 179.7-65.7l-88.1-68.2c-24.5 16.5-55.9 26.2-91.6 26.2-70.6 0-130.5-47.6-152-111.3H31.5v69.6C76.3 479 167.5 544.3 272 544.3z" />
                    <path fill="#FBBC05" d="M120 322.3c-10.5-31.5-10.5-65.6 0-97.1V155.6H31.5c-36.9 73.9-36.9 160.4 0 234.3l88.5-67.6z" />
                    <path fill="#EA4335" d="M272 107.9c38.9 0 73.7 13.4 101.2 39.7l75.9-75.9C406.8 24.6 345.3 0 272 0 167.5 0 76.3 65.3 31.5 155.6l88.5 69.6c21.5-63.7 81.4-111.3 152-111.3z" />
                  </svg>
                  Iniciar con Google
                </div>
              </Button>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-gray-600">
            <p>Nota: Solo usuarios previamente registrados pueden acceder</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
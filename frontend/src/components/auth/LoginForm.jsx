import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const LoginForm = () => {
  const { formData, setFormData, loading, login, oauth } = useAuthStore();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const email = urlParams.get('email');

    if (error === 'user_not_found' && email) {
      alert(`El correo ${email} no está registrado en el sistema. Contacta al administrador para crear una cuenta.`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (error === 'auth_failed') {
      alert('Error en la autenticación con Google. Por favor, intenta nuevamente.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login();
    if (success) {
      window.location.href = '/dashboard';
    }
  };

  const handleChange = (e) => {
    setFormData(e.target.name, e.target.value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16  rounded-full flex items-center justify-center mb-4">
            <img 
              src="/Logo.png" 
              alt="Logo Finca San Pablo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Finca San Pablo</CardTitle>
          <CardDescription>
            Ingresa a tu cuenta para gestionar tu finca
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Iniciar sesión
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O inicia sesión con</span>
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

          <div className="mt-4 text-center text-xs text-gray-500">
            <p>Nota: Solo usuarios previamente registrados pueden acceder</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
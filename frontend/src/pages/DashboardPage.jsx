import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const [authStatus, setAuthStatus] = useState('checking');

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const isAuthenticated = await checkAuth();
        if (isAuthenticated) {
          setAuthStatus('authenticated');
        } else {
          setAuthStatus('unauthenticated');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        setAuthStatus('unauthenticated');
        navigate('/login', { replace: true });
      }
    };

    verifyAuth();
  }, [checkAuth, navigate]);

  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated' || !user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-8">
    
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard </h1>
             
            </div>
         
        
        </div>

      </div>
    </MainLayout>
  );
};

export default DashboardPage;
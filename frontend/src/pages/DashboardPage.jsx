import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        window.location.href = '/login';
      }
    };

    verifyAuth();
  }, [checkAuth]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido al sistema de Finca San Pablo</p>
        
      
      </div>
    </div>
  );
};

export default Dashboard;
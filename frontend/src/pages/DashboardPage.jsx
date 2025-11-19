import { useEffect, useState } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  Milk, 
  Heart, 
  Calendar,
  RefreshCw,
  Activity,
  Syringe,
  PieChart,
  ArrowUpIcon,
  ArrowDownIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { FaCow } from 'react-icons/fa6';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const ProductionAreaChart = ({ data, color = "#3b82f6" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No hay datos de producción disponibles
      </div>
    );
  }
const formatDateForChart = (dateString) => {
    try {
        if (!dateString) return 'Fecha inválida';
        
        // Si ya está formateada, devolverla tal cual
        if (typeof dateString === 'string' && dateString.includes('/')) {
            return dateString;
        }
        
        // SOLUCIÓN: Crear la fecha en UTC para evitar problemas de zona horaria
        // Asumir que la fecha viene en formato YYYY-MM-DD (sin hora)
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        
        if (isNaN(date.getTime())) {
            console.warn('Fecha inválida:', dateString);
            return 'Fecha inválida';
        }
        
        // Formatear en UTC para mantener la fecha correcta
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short',
            timeZone: 'UTC' // Forzar UTC para mantener la fecha original
        });
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return 'Fecha inválida';
    }
};

  const safeData = data.map((item, index) => ({
    ...item,
    cantidad: Number(item.cantidad) || 0,
    fechaFormatted: formatDateForChart(item.fecha) || `Día ${index + 1}`,
    fechaOriginal: item.fecha
  }));

  return (
    <div className="h-80 w-full" style={{ minWidth: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={safeData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="fechaFormatted"
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            labelFormatter={(value, payload) => {
              if (payload && payload[0] && payload[0].payload) {
                const item = payload[0].payload;
                return `Fecha: ${item.fechaFormatted}`;
              }
              return `Fecha: ${value}`;
            }}
            formatter={(value) => [`${value} L`, 'Producción']}
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="cantidad" 
            stroke={color}
            fill={`url(#colorUv-${color.replace('#', '')})`}
            strokeWidth={2}
            fillOpacity={0.3}
          />
          <defs>
            <linearGradient 
              id={`colorUv-${color.replace('#', '')}`} 
              x1="0" 
              y1="0" 
              x2="0" 
              y2="1"
            >
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const KPICard = ({ title, value, change, icon: Icon, color = "blue", subtitle }) => {
  const colorClasses = {
    blue: { 
      bg: 'bg-blue-50', 
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: { 
      bg: 'bg-green-50', 
      text: 'text-green-600',
      border: 'border-green-200'
    },
    red: { 
      bg: 'bg-red-50', 
      text: 'text-red-600',
      border: 'border-red-200'
    },
    purple: { 
      bg: 'bg-purple-50', 
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
    orange: { 
      bg: 'bg-orange-50', 
      text: 'text-orange-600',
      border: 'border-orange-200'
    }
  }[color];

  const changeColor = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
  const ChangeIcon = change > 0 ? ArrowUpIcon : change < 0 ? ArrowDownIcon : null;

  return (
    <Card className={`border-l-4 ${colorClasses.border} hover:shadow-lg transition-all duration-200`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            {subtitle && <p className="text-xs text-gray-500 mb-2">{subtitle}</p>}
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {value !== null && value !== undefined ? value : "0"}
            </p>
            {change !== undefined && (
              <div className={`flex items-center text-sm font-medium ${changeColor}`}>
                {ChangeIcon && <ChangeIcon className="h-4 w-4 mr-1" />}
                {change !== 0 ? `${Math.abs(change)}%` : 'Sin cambios'} 
                <span className="text-gray-500 ml-1">vs último mes</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses.bg} ${colorClasses.text}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const { 
    kpis, 
    tendenciaProduccion, 
    distribucionAnimales, 
    metricasReproduccion,
    loading,
    fetchDashboardCompleto,
    fetchTendenciaProduccion,
    error
  } = useDashboardStore();
  
  const [timeRange, setTimeRange] = useState('30d');

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
        console.error('Error verificando autenticación:', error);
        setAuthStatus('unauthenticated');
        navigate('/login', { replace: true });
      }
    };

    verifyAuth();
  }, [checkAuth, navigate]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchDashboardCompleto();
    }
  }, [authStatus, fetchDashboardCompleto]);

  useEffect(() => {
    if (timeRange && authStatus === 'authenticated') {
      const diasMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      fetchTendenciaProduccion(diasMap[timeRange] || 30);
    }
  }, [timeRange, fetchTendenciaProduccion, authStatus]);

  const getSafeChartData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => ({
      ...item,
      cantidad: Number(item.cantidad) || 0,
      fecha: item.fecha
    }));
  };

  const produccionData = getSafeChartData(tendenciaProduccion?.produccion);
  const reproduccionData = getSafeChartData(tendenciaProduccion?.reproduccion);
  const saludData = getSafeChartData(tendenciaProduccion?.salud);

  const distribucionCategorias = distribucionAnimales?.porCategoria?.map(item => ({
    name: item.categoria || 'Sin categoría',
    value: Number(item.cantidad) || 0
  })) || [];

  const produccionPorRaza = tendenciaProduccion?.produccionPorRaza?.map(item => ({
    name: item.raza || 'Sin raza',
    value: Number(item.total_produccion) || 0,
    vacas: Number(item.total_vacas) || 0
  })) || [];


  return (
    <MainLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard Ganadero</h1>
            <p className="text-gray-600 mt-2">
              Datos en tiempo real de producción, reproducción y salud del hato
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-600" />
              <Badge variant="secondary" className="text-sm bg-transparent">
                {new Date().toLocaleDateString('es-ES')}
              </Badge>
            </div>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="1y">Último año</option>
            </select>
            <Button 
              onClick={() => fetchDashboardCompleto()} 
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <span className="font-medium">Error al cargar datos:</span>
              <span>{error}</span>
            </div>
            <Button 
              onClick={() => fetchDashboardCompleto()} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Reintentar
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Hato"
            value={kpis?.totalAnimales?.toLocaleString()}
            change={2.1}
            icon={Users}
            color="blue"
            subtitle="Animales activos"
          />
          <KPICard
            title="Producción Hoy"
            value={kpis?.produccionHoy ? `${kpis.produccionHoy.toLocaleString()} L` : "0 L"}
            change={5.2}
            icon={Milk}
            color="green"
            subtitle="Litros totales"
          />
          <KPICard
            title="En Tratamiento"
            value={kpis?.animalesEnTratamiento?.toLocaleString()}
            change={-3.1}
            icon={Syringe}
            color="red"
            subtitle="Requieren atención"
          />
          <KPICard
            title="Montas Este Mes"
            value={kpis?.montasEsteMes?.toLocaleString()}
            change={8.7}
            icon={Heart}
            color="purple"
            subtitle="Actividad reproductiva"
          />
        </div>

        <Tabs defaultValue="production" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="production" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Milk className="h-4 w-4" />
              Producción
            </TabsTrigger>
            <TabsTrigger 
              value="reproduction" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <FaCow className="h-4 w-4" />
              Reproducción
            </TabsTrigger>
            <TabsTrigger 
              value="health" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Activity className="h-4 w-4" />
              Salud & Distribución
            </TabsTrigger>
          </TabsList>

          <TabsContent value="production" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Tendencia Producción Lechera
                  </CardTitle>
                  <CardDescription>
                    Producción diaria real del hato en litros
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductionAreaChart 
                    data={produccionData}
                    color="#10b981"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    Producción por Raza
                  </CardTitle>
                  <CardDescription>
                    Eficiencia productiva por tipo de raza
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full" style={{ minWidth: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={produccionPorRaza} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'value') return [`${value} L`, 'Producción Total'];
                            return [value, 'Número de Vacas'];
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                          name="Producción Total (L)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reproduction" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Actividad Reproductiva</CardTitle>
                  <CardDescription>
                    Montas realizadas por día
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full" style={{ minWidth: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={reproduccionData} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="fecha"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          labelFormatter={(value) => `Fecha: ${value}`}
                          formatter={(value) => [value, 'Montas']}
                        />
                        <Bar 
                          dataKey="cantidad" 
                          fill="#8b5cf6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Reproducción</CardTitle>
                  <CardDescription>
                    Indicadores de eficiencia reproductiva
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="text-2xl font-bold text-purple-900">
                          {metricasReproduccion?.tasaPreñez || "0"}%
                        </div>
                        <div className="text-sm text-purple-700 font-medium">Tasa de Preñez</div>
                        <div className="text-xs text-purple-600 mt-1">
                          {metricasReproduccion?.diagnosticosPositivos || "0"} positivos
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-900">
                          {metricasReproduccion?.montasUltimos30Dias || "0"}
                        </div>
                        <div className="text-sm text-green-700 font-medium">Total Montas</div>
                        <div className="text-xs text-green-600 mt-1">Últimos 30 días</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-900">
                          {metricasReproduccion?.partosUltimos30Dias || "0"}
                        </div>
                        <div className="text-sm text-blue-700 font-medium">Partos Recientes</div>
                        <div className="text-xs text-blue-600 mt-1">Últimos 30 días</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                        <div className="text-2xl font-bold text-orange-900">
                          {metricasReproduccion?.vacasPreñadasActuales || "0"}
                        </div>
                        <div className="text-sm text-orange-700 font-medium">Vacas Preñadas</div>
                        <div className="text-xs text-orange-600 mt-1">Actualmente</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución del Hato</CardTitle>
                  <CardDescription>
                    Composición por categorías de edad y sexo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full" style={{ minWidth: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={distribucionCategorias}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {distribucionCategorias.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Animales']} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Eventos Sanitarios</CardTitle>
                  <CardDescription>
                    Tratamientos y consultas veterinarias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full" style={{ minWidth: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={saludData} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="fecha"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          labelFormatter={(value) => `Fecha: ${value}`}
                          formatter={(value) => [value, 'Eventos']}
                        />
                        <Bar 
                          dataKey="cantidad" 
                          fill="#ef4444"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
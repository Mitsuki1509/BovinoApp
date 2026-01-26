import { useEffect, useState, useCallback } from 'react';
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
  ArrowDownIcon,
  FileText
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
import ReporteModal from '../components/reportes/ReporteModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ProductionAreaChart = ({ data, color = "#3b82f6" }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="h-60 sm:h-72 md:h-80 flex items-center justify-center text-gray-500 text-sm sm:text-base">
        No hay datos de producción disponibles
      </div>
    );
  }

  const formatDateForChart = (dateString) => {
    try {
      if (!dateString) return 'Fecha inválida';
      
      if (typeof dateString === 'string' && dateString.includes('/')) {
        return isMobile ? dateString.split('/')[0] : dateString;
      }
      
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      if (isMobile) {
        return `${day}/${month}`;
      }
      
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short',
        timeZone: 'UTC' 
      });
    } catch (error) {
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
    <div className="h-60 sm:h-72 md:h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={safeData} 
          margin={{ 
            top: 10, 
            right: isMobile ? 10 : 30, 
            left: isMobile ? 0 : 20, 
            bottom: isMobile ? 10 : 20 
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="fechaFormatted"
            tick={{ fontSize: isMobile ? 10 : 12 }}
            interval={isMobile ? Math.ceil(data.length / 5) : 0}
          />
          <YAxis 
            tick={{ fontSize: isMobile ? 10 : 12 }}
            width={isMobile ? 30 : 40}
          />
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
              borderRadius: '8px',
              fontSize: isMobile ? '12px' : '14px'
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <Card className={`border-l-4 ${colorClasses.border} hover:shadow-lg transition-all duration-200 h-full`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mb-2 truncate">{subtitle}</p>
            )}
            <p className={`text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 truncate`}>
              {value !== null && value !== undefined ? value : "0"}
            </p>
            {change !== undefined && (
              <div className={`flex items-center text-xs sm:text-sm font-medium ${changeColor} flex-wrap gap-1`}>
                {ChangeIcon && <ChangeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}
                {change !== 0 ? `${Math.abs(change)}%` : 'Sin cambios'} 
                <span className="text-gray-500 ml-0 sm:ml-1 whitespace-nowrap">
                  {isMobile ? 'vs mes' : 'vs último mes'}
                </span>
              </div>
            )}
          </div>
          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${colorClasses.bg} ${colorClasses.text} flex-shrink-0 ml-2`}>
            <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ResponsiveBarChart = ({ data, dataKey, color = "#3b82f6", name, isMobile }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 sm:h-72 md:h-80 flex items-center justify-center text-gray-500 text-sm sm:text-base">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <div className="h-60 sm:h-72 md:h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ 
            top: 10, 
            right: isMobile ? 10 : 30, 
            left: isMobile ? 0 : 20, 
            bottom: isMobile ? 40 : 60 
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="name"
            tick={{ fontSize: isMobile ? 10 : 12 }}
            angle={isMobile ? -90 : -45}
            textAnchor={isMobile ? "end" : "end"}
            height={isMobile ? 80 : 60}
            interval={0}
          />
          <YAxis 
            tick={{ fontSize: isMobile ? 10 : 12 }}
            width={isMobile ? 30 : 40}
          />
          <Tooltip 
            formatter={(value, tooltipName) => {
              if (tooltipName === 'value') return [`${value} L`, 'Producción Total'];
              return [value, 'Número de Vacas'];
            }}
            contentStyle={{ 
              fontSize: isMobile ? '12px' : '14px'
            }}
          />
          <Bar 
            dataKey={dataKey} 
            fill={color}
            radius={[4, 4, 0, 0]}
            name={name}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ResponsivePieChart = ({ data, isMobile }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 sm:h-72 md:h-80 flex items-center justify-center text-gray-500 text-sm sm:text-base">
        No hay datos disponibles
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="h-60 sm:h-72 md:h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={!isMobile}
            label={isMobile ? false : ({ name, percent }) => 
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
            outerRadius={isMobile ? 60 : 80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [value, 'Animales']}
            contentStyle={{ fontSize: isMobile ? '12px' : '14px' }}
          />
          {!isMobile && <Legend />}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, color, icon: Icon }) => {
  const colorClasses = {
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-900',
    green: 'from-green-50 to-green-100 border-green-200 text-green-900',
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-900',
    orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-900'
  }[color];

  return (
    <div className={`bg-gradient-to-br ${colorClasses} p-3 sm:p-4 rounded-lg border`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg sm:text-xl md:text-2xl font-bold">
          {value || "0"}
        </div>
        {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5 opacity-70" />}
      </div>
      <div className="text-xs sm:text-sm font-medium opacity-90">{title}</div>
      {subtitle && (
        <div className="text-xs opacity-75 mt-1">{subtitle}</div>
      )}
    </div>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuthStore();
  const [authStatus, setAuthStatus] = useState('checking');
  const [isMobile, setIsMobile] = useState(false);
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
  const [showReportModal, setShowReportModal] = useState(false);

  const canGenerateReports = user?.rol === 'admin' || user?.rol === 'contable';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleOpenReportModal = useCallback(() => {
    setShowReportModal(true);
  }, []);

  const handleCloseReportModal = useCallback(() => {
    setShowReportModal(false);
  }, []);

  const handleReportSuccess = useCallback(() => {
    setShowReportModal(false);
  }, []);

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
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
        {/* Header simplificado sin menú hamburguesa */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Dashboard Ganadero
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Datos en tiempo real de producción, reproducción y salud del hato
            </p>
          </div>
          
          {/* Controles en una sola línea responsive */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Fecha actual */}
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-sm">
              <Calendar className="h-4 w-4 text-gray-600" />
              <Badge variant="secondary" className="text-sm bg-transparent">
                {new Date().toLocaleDateString('es-ES')}
              </Badge>
            </div>
            
            {/* Dropdown de días */}
            <div className="relative">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px] text-sm h-9">
                  <SelectValue placeholder="Seleccionar rango" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                  <SelectItem value="1y">Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Botón de actualizar */}
            <Button 
              onClick={() => fetchDashboardCompleto()} 
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-9"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm sm:text-base">
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

        {/* Grid de KPIs Responsive */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            subtitle={isMobile ? "Requieren atención" : "Animales en tratamiento"}
          />
          <KPICard
            title={isMobile ? "Montas Mes" : "Montas Este Mes"}
            value={kpis?.montasEsteMes?.toLocaleString()}
            change={8.7}
            icon={Heart}
            color="purple"
            subtitle={isMobile ? "Reproducción" : "Actividad reproductiva"}
          />
        </div>

        <Tabs defaultValue="production" className="space-y-4 sm:space-y-8">
          <div className="overflow-x-auto">
  <TabsList className={`inline-flex w-auto min-w-full md:w-full h-10 bg-gray-100 p-1 rounded-lg`}>
    <TabsTrigger 
      value="production" 
      className={`flex items-center gap-1 justify-center whitespace-nowrap text-xs px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 min-w-0`}
    >
      <Milk className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">Producción</span>
    </TabsTrigger>
    <TabsTrigger 
      value="reproduction" 
      className={`flex items-center gap-1 justify-center whitespace-nowrap text-xs px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 min-w-0`}
    >
      <FaCow className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">Reproducción</span>
    </TabsTrigger>
    <TabsTrigger 
      value="health" 
      className={`flex items-center gap-1 justify-center whitespace-nowrap text-xs px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 min-w-0`}
    >
      <Activity className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">Salud</span>
    </TabsTrigger>
  </TabsList>
</div>

          {/* Contenido de tabs */}
          <TabsContent value="production" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Tendencia Producción Lechera
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Producción diaria real del hato en litros
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <ProductionAreaChart 
                    data={produccionData}
                    color="#10b981"
                  />
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Producción por Raza
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Eficiencia productiva por tipo de raza
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <ResponsiveBarChart 
                    data={produccionPorRaza}
                    dataKey="value"
                    color="#3b82f6"
                    name="Producción Total (L)"
                    isMobile={isMobile}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reproduction" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Actividad Reproductiva</CardTitle>
                  <CardDescription className="text-sm">
                    Montas realizadas por día
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="h-60 sm:h-72 md:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={reproduccionData} 
                        margin={{ 
                          top: 10, 
                          right: isMobile ? 10 : 30, 
                          left: isMobile ? 0 : 20, 
                          bottom: isMobile ? 10 : 20 
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="fecha"
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                          interval={isMobile ? Math.ceil(reproduccionData.length / 5) : 0}
                        />
                        <YAxis 
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                          width={isMobile ? 30 : 40}
                        />
                        <Tooltip 
                          labelFormatter={(value) => `Fecha: ${value}`}
                          formatter={(value) => [value, 'Montas']}
                          contentStyle={{ 
                            fontSize: isMobile ? '12px' : '14px'
                          }}
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

              <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Métricas de Reproducción</CardTitle>
                  <CardDescription className="text-sm">
                    Indicadores de eficiencia reproductiva
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <MetricCard
                      title="Tasa de Preñez"
                      value={`${metricasReproduccion?.tasaPreñez || "0"}%`}
                      subtitle={`${metricasReproduccion?.diagnosticosPositivos || "0"} positivos`}
                      color="purple"
                    />
                    <MetricCard
                      title="Total Montas"
                      value={metricasReproduccion?.montasUltimos30Dias || "0"}
                      subtitle="Últimos 30 días"
                      color="green"
                    />
                    <MetricCard
                      title="Partos Recientes"
                      value={metricasReproduccion?.partosUltimos30Dias || "0"}
                      subtitle="Últimos 30 días"
                      color="blue"
                    />
                    <MetricCard
                      title="Vacas Preñadas"
                      value={metricasReproduccion?.vacasPreñadasActuales || "0"}
                      subtitle="Actualmente"
                      color="orange"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Distribución del Hato</CardTitle>
                  <CardDescription className="text-sm">
                    Composición por categorías de edad y sexo
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <ResponsivePieChart 
                    data={distribucionCategorias}
                    isMobile={isMobile}
                  />
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Eventos Sanitarios</CardTitle>
                  <CardDescription className="text-sm">
                    Tratamientos y consultas veterinarias
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="h-60 sm:h-72 md:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={saludData} 
                        margin={{ 
                          top: 10, 
                          right: isMobile ? 10 : 30, 
                          left: isMobile ? 0 : 20, 
                          bottom: isMobile ? 10 : 20 
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="fecha"
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                          interval={isMobile ? Math.ceil(saludData.length / 5) : 0}
                        />
                        <YAxis 
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                          width={isMobile ? 30 : 40}
                        />
                        <Tooltip 
                          labelFormatter={(value) => `Fecha: ${value}`}
                          formatter={(value) => [value, 'Eventos']}
                          contentStyle={{ 
                            fontSize: isMobile ? '12px' : '14px'
                          }}
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

        {canGenerateReports && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              onClick={handleOpenReportModal}
              size="lg"
              className="rounded-full h-12 w-12 shadow-lg bg-black hover:bg-gray-800 text-white"
            >
              <span className="sr-only">Generar Reporte</span>
              <TrendingUp className="h-6 w-6" />
            </Button>
          </div>
        )}

        {canGenerateReports && (
          <ReporteModal 
            isOpen={showReportModal}
            onClose={handleCloseReportModal}
            onSuccess={handleReportSuccess}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
import { useEffect, useState } from 'react';
import { useNotificaciones } from '@/store/notificacionStore';
import { useAuthStore } from '@/store/authStore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Info,  
  Bell, 
  Syringe, 
  Package,
  Baby,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  WifiOff,
  Trash2,
  Droplets,
  Filter,
  Eye,
  EyeOff,
  ChevronDown,
  Search,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const ModalNotificaciones = ({ open, onOpenChange }) => {
  const { user } = useAuthStore();
  const { 
    notificaciones, 
    notificacionesNoLeidas, 
    loading, 
    error,
    fetchNotificaciones, 
    marcarComoLeida,
    marcarTodasComoLeidas,
    limpiarNotificacionesLeidas,
    forceReload,
    clearError
  } = useNotificaciones();

  const [modulosExpandidos, setModulosExpandidos] = useState({});
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);

  useEffect(() => {
    if (open && user?.usuario_id) {
      fetchNotificaciones(user.usuario_id);
      setModulosExpandidos({
        sanitario: true,
        monta: true,
        parto: true,
        inventario: true,
        ordeño: true,
        general: true,
        otros: true
      });
    }
  }, [open, user?.usuario_id, fetchNotificaciones]);

  useEffect(() => {
    if (!open) {
      clearError();
      setFiltroBusqueda('');
      setSoloNoLeidas(false);
    }
  }, [open, clearError]);

  const toggleModulo = (modulo) => {
    setModulosExpandidos(prev => ({
      ...prev,
      [modulo]: !prev[modulo]
    }));
  };

  const getIconoPorTipo = (tipo) => {
    switch (tipo) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getIconoPorModulo = (modulo) => {
    switch (modulo) {
      case 'monta':
        return <Baby className="h-4 w-4 text-purple-500" />;
      case 'sanitario':
        return <Syringe className="h-4 w-4 text-blue-500" />;
      case 'inventario':
        return <Package className="h-4 w-4 text-orange-500" />;
      case 'parto':
        return <Baby className="h-4 w-4 text-pink-500" />;
      case 'ordeño':
        return <Droplets className="h-4 w-4 text-cyan-500" />;
      case 'general':
        return <Bell className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getColorPorTipo = (tipo) => {
    switch (tipo) {
      case 'error':
        return 'border-l-red-400 bg-red-50/50';
      case 'warning':
        return 'border-l-amber-400 bg-amber-50/50';
      case 'success':
        return 'border-l-green-400 bg-green-50/50';
      default:
        return 'border-l-blue-400 bg-blue-50/50';
    }
  };

  const getModuloDisplayName = (modulo) => {
    const nombres = {
      'inventario': 'Inventario',
      'sanitario': 'Sanitario',
      'monta': 'Monta',
      'parto': 'Parto',
      'ordeño': 'Ordeño',
      'general': 'General'
    };
    return nombres[modulo] || modulo;
  };

  const handleMarcarComoLeida = async (notificacionId, e) => {
    e?.stopPropagation();
    await marcarComoLeida(notificacionId);
  };

  const handleMarcarTodasComoLeidas = async () => {
    if (user?.usuario_id) {
      await marcarTodasComoLeidas(user.usuario_id);
    }
  };

  const handleLimpiarLeidas = async () => {
    if (user?.usuario_id) {
      await limpiarNotificacionesLeidas(user.usuario_id);
    }
  };

  const handleRecargar = () => {
    if (user?.usuario_id) {
      forceReload(user.usuario_id);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    
    const fechaNotif = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora - fechaNotif;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `${diffDays}d`;
    
    return fechaNotif.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const notificacionesFiltradas = notificaciones.filter(notif => {
    const coincideBusqueda = filtroBusqueda === '' || 
      notif.titulo.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      notif.mensaje.toLowerCase().includes(filtroBusqueda.toLowerCase());
    
    const coincideEstado = !soloNoLeidas || !notif.leida;
    
    return coincideBusqueda && coincideEstado;
  });

  const notificacionesPorModulo = {
    sanitario: notificacionesFiltradas.filter(n => n.modulo === 'sanitario'),
    monta: notificacionesFiltradas.filter(n => n.modulo === 'monta'),
    parto: notificacionesFiltradas.filter(n => n.modulo === 'parto'),
    inventario: notificacionesFiltradas.filter(n => n.modulo === 'inventario'),
    ordeño: notificacionesFiltradas.filter(n => n.modulo === 'ordeño'),
    general: notificacionesFiltradas.filter(n => n.modulo === 'general'),
    otros: notificacionesFiltradas.filter(n => !['inventario', 'sanitario', 'monta', 'parto', 'ordeño', 'general'].includes(n.modulo))
  };

  const tieneNotificacionesNoLeidas = notificacionesFiltradas.some(n => !n.leida);
  const tieneNotificacionesLeidas = notificacionesFiltradas.some(n => n.leida);
  const tieneNotificaciones = notificacionesFiltradas.length > 0;

  const isConnectionError = error && (
    error.includes('endpoint no existe') || 
    error.includes('JSON válido') ||
    error.includes('proxy') ||
    error.includes('Network Error')
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] sm:max-w-2xl lg:max-w-3xl h-[90vh] sm:h-[85vh] mx-auto p-0 sm:p-6 rounded-lg sm:rounded-xl border-0 shadow-lg flex flex-col">
        <Card className="border-0 shadow-none h-full flex flex-col">
          <CardContent className="p-0 flex flex-col h-full">
            {/* Header fijo */}
            <div className="flex-shrink-0">
              <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                      Notificaciones
                      {notificacionesNoLeidas > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {notificacionesNoLeidas}
                        </Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-gray-600">
                      {user?.rol && `Rol: ${user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}`}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Filtros fijos */}
              <div className="px-4 sm:px-6 pb-3 space-y-3 border-b">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar en notificaciones..."
                      value={filtroBusqueda}
                      onChange={(e) => setFiltroBusqueda(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecargar}
                    disabled={loading}
                    className="flex items-center gap-2 sm:w-auto w-full justify-center"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Filter className="h-4 w-4" />
                    <span>
                      {tieneNotificaciones 
                        ? `${notificacionesFiltradas.length} notificaciones` 
                        : 'Sin notificaciones'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="solo-no-leidas"
                      checked={soloNoLeidas}
                      onCheckedChange={setSoloNoLeidas}
                      disabled={loading}
                    />
                    <Label htmlFor="solo-no-leidas" className="text-sm font-normal">
                      Solo no leídas
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Área de notificaciones con scroll - CORREGIDO */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="px-4 sm:px-6 py-4 space-y-4">
                  {loading && !tieneNotificaciones ? (
                    <div className="text-center py-12 text-gray-500">
                      <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
                      <p className="text-sm">Cargando notificaciones...</p>
                    </div>
                  ) : error && !tieneNotificaciones ? (
                    <div className="text-center py-12">
                      {isConnectionError ? (
                        <div className="text-amber-600">
                          <WifiOff className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                          <p className="font-medium text-sm mb-1">Problema de conexión</p>
                          <p className="text-xs text-amber-500 mb-4">
                            No se puede conectar con el servidor
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRecargar}
                            className="text-xs"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reintentar
                          </Button>
                        </div>
                      ) : (
                        <div className="text-red-600">
                          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                          <p className="text-sm mb-1">Error al cargar</p>
                          <p className="text-xs text-red-500 mb-4 max-w-sm mx-auto">{error}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRecargar}
                            className="text-xs"
                          >
                            Reintentar
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : !tieneNotificaciones ? (
                    <div className="text-center py-12 text-gray-500">
                      <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-600">No hay notificaciones</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {filtroBusqueda || soloNoLeidas 
                          ? 'Prueba con otros filtros' 
                          : 'Las notificaciones del sistema aparecerán aquí'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(notificacionesPorModulo)
                        .filter(([modulo, notifs]) => notifs.length > 0)
                        .map(([modulo, notifs]) => (
                          <ModuloNotificaciones 
                            key={modulo}
                            titulo={getModuloDisplayName(modulo)}
                            icono={getIconoPorModulo(modulo)}
                            notificaciones={notifs}
                            onMarcarLeida={handleMarcarComoLeida}
                            getIconoPorTipo={getIconoPorTipo}
                            getColorPorTipo={getColorPorTipo}
                            formatFecha={formatFecha}
                            isExpanded={modulosExpandidos[modulo] ?? true}
                            onToggle={() => toggleModulo(modulo)}
                          />
                        ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Footer fijo */}
            <div className="flex-shrink-0 border-t bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4">
                <div className="text-xs text-gray-500 text-center sm:text-left">
                  {tieneNotificaciones ? (
                    <>
                      <span className="font-medium">{notificacionesFiltradas.length}</span> notificaciones
                      {notificacionesNoLeidas > 0 && (
                        <span className="text-blue-600 font-medium ml-1">
                          ({notificacionesNoLeidas} sin leer)
                        </span>
                      )}
                    </>
                  ) : (
                    "No hay notificaciones"
                  )}
                </div>
                
                <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
                  {tieneNotificacionesLeidas && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLimpiarLeidas}
                      className="flex items-center gap-2 text-xs h-8 px-3"
                      disabled={loading}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Limpiar leídas</span>
                    </Button>
                  )}
                  
                  {tieneNotificacionesNoLeidas && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarcarTodasComoLeidas}
                      className="flex items-center gap-2 text-xs h-8 px-3"
                      disabled={loading}
                    >
                      <Eye className="h-3 w-3" />
                      <span>Marcar todas</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

const ModuloNotificaciones = ({ 
  titulo, 
  icono, 
  notificaciones, 
  onMarcarLeida, 
  getIconoPorTipo, 
  getColorPorTipo, 
  formatFecha,
  isExpanded,
  onToggle
}) => {
  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;
  
  return (
    <Card className="overflow-hidden border">
      <div 
        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {icono}
          <span className="font-semibold text-sm text-gray-700">{titulo}</span>
        </div>
        <div className="flex items-center gap-2">
          {notificacionesNoLeidas > 0 && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
              {notificacionesNoLeidas}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {notificaciones.length}
          </Badge>
          <ChevronDown 
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform",
              isExpanded ? "rotate-180" : ""
            )} 
          />
        </div>
      </div>
      
      <div className={cn(
        "transition-all duration-200",
        isExpanded ? "block" : "hidden"
      )}>
        {notificaciones.map((notif) => (
          <NotificacionItem 
            key={notif.notificacion_id} 
            notificacion={notif}
            onMarcarLeida={onMarcarLeida}
            getIconoPorTipo={getIconoPorTipo}
            getColorPorTipo={getColorPorTipo}
            formatFecha={formatFecha}
          />
        ))}
      </div>
    </Card>
  );
};

const NotificacionItem = ({ 
  notificacion, 
  onMarcarLeida, 
  getIconoPorTipo, 
  getColorPorTipo, 
  formatFecha 
}) => (
  <div
    className={cn(
      "p-3 transition-all hover:bg-white cursor-pointer border-b last:border-b-0",
      getColorPorTipo(notificacion.tipo),
      "border-l-4"
    )}
    onClick={() => !notificacion.leida && onMarcarLeida(notificacion.notificacion_id)}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <div className={cn(
          "p-1.5 rounded-lg flex-shrink-0 mt-0.5 border",
          notificacion.leida ? "bg-gray-100 border-gray-200" : "bg-white border-gray-300 shadow-xs"
        )}>
          {getIconoPorTipo(notificacion.tipo)}
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "font-semibold text-sm leading-tight break-words pr-2",
              notificacion.leida ? "text-gray-600" : "text-gray-900"
            )}>
              {notificacion.titulo}
            </h4>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatFecha(notificacion.fecha || notificacion.fecha_creacion)}
              </span>
            </div>
          </div>
          
          <p className={cn(
            "text-sm leading-relaxed break-words",
            notificacion.leida ? "text-gray-500" : "text-gray-700"
          )}>
            {notificacion.mensaje}
          </p>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                notificacion.leida ? "bg-gray-100" : "bg-blue-50 text-blue-700 border-blue-200"
              )}
            >
              {notificacion.modulo}
            </Badge>
          </div>
        </div>
      </div>
      
      {!notificacion.leida && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 flex-shrink-0 opacity-70 hover:opacity-100 transition-all hover:bg-blue-100 hover:text-blue-700"
          onClick={(e) => onMarcarLeida(notificacion.notificacion_id, e)}
          title="Marcar como leída"
        >
          <EyeOff className="h-3 w-3" />
        </Button>
      )}
    </div>
  </div>
);

export default ModalNotificaciones;
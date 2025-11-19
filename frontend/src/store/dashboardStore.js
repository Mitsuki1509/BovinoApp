// store/dashboardStore.js - VERSIÓN MEJORADA
import { create } from 'zustand';

export const useDashboardStore = create((set, get) => ({
  // Estado inicial
  kpis: null,
  tendenciaProduccion: null,
  distribucionAnimales: null,
  metricasReproduccion: null,
  alertas: null,
  loading: false,
  error: null,

  // Acción para cargar KPIs principales
  fetchKPIs: async () => {
    set({ error: null });
    try {
      const response = await fetch('http://localhost:3000/api/dashboard/kpis-principales', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.msg || 'Error en la respuesta del servidor');
      }
      
      set({ kpis: result.data });
      return result.data;
    } catch (error) {
      console.error('Error en fetchKPIs:', error);
      set({ error: error.message });
      return null;
    }
  },

  // Acción para cargar tendencia de producción
  fetchTendenciaProduccion: async (dias = 30) => {
    set({ error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/dashboard/tendencia-produccion?dias=${dias}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.msg || 'Error en la respuesta del servidor');
      }
      
      set({ tendenciaProduccion: result.data });
      return result.data;
    } catch (error) {
      console.error('Error en fetchTendenciaProduccion:', error);
      set({ error: error.message });
      return null;
    }
  },

  // Acción para cargar distribución de animales
  fetchDistribucionAnimales: async () => {
    set({ error: null });
    try {
      const response = await fetch('http://localhost:3000/api/dashboard/distribucion-animales', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.msg || 'Error en la respuesta del servidor');
      }
      
      set({ distribucionAnimales: result.data });
      return result.data;
    } catch (error) {
      console.error('Error en fetchDistribucionAnimales:', error);
      set({ error: error.message });
      return null;
    }
  },

  // Acción para cargar métricas de reproducción
  fetchMetricasReproduccion: async () => {
    set({ error: null });
    try {
      const response = await fetch('http://localhost:3000/api/dashboard/metricas-reproduccion', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.msg || 'Error en la respuesta del servidor');
      }
      
      set({ metricasReproduccion: result.data });
      return result.data;
    } catch (error) {
      console.error('Error en fetchMetricasReproduccion:', error);
      set({ error: error.message });
      return null;
    }
  },

  // Acción para cargar alertas del sistema
  fetchAlertasSistema: async () => {
    set({ error: null });
    try {
      const response = await fetch('http://localhost:3000/api/dashboard/alertas-sistema', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.msg || 'Error en la respuesta del servidor');
      }
      
      set({ alertas: result.data });
      return result.data;
    } catch (error) {
      console.error('Error en fetchAlertasSistema:', error);
      set({ error: error.message });
      return null;
    }
  },

  // Acción para cargar el dashboard completo
  fetchDashboardCompleto: async () => {
    set({ loading: true, error: null });
    
    try {
      // Usar Promise.allSettled para manejar errores individuales sin romper todo
      const results = await Promise.allSettled([
        get().fetchKPIs(),
        get().fetchTendenciaProduccion(30), // 30 días por defecto
        get().fetchDistribucionAnimales(),
        get().fetchMetricasReproduccion(),
        get().fetchAlertasSistema()
      ]);

      // Verificar si hubo errores en alguna de las peticiones
      const errors = results
        .filter(result => result.status === 'rejected')
        .map(result => result.reason.message);

      if (errors.length > 0) {
        console.warn('Algunas peticiones fallaron:', errors);
        // No lanzar error aquí, solo mostrar advertencia
      }

      set({ loading: false });
      
    } catch (error) {
      console.error('Error en fetchDashboardCompleto:', error);
      set({ 
        error: error.message, 
        loading: false 
      });
    }
  },

  // Acción para limpiar errores
  clearError: () => set({ error: null }),

  // Acción para resetear el store
  reset: () => set({
    kpis: null,
    tendenciaProduccion: null,
    distribucionAnimales: null,
    metricasReproduccion: null,
    alertas: null,
    loading: false,
    error: null
  })
}));
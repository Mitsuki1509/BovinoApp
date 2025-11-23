import { create } from 'zustand';

export const useDashboardStore = create((set, get) => ({
  kpis: null,
  tendenciaProduccion: null,
  distribucionAnimales: null,
  metricasReproduccion: null,
  alertas: null,
  loading: false,
  error: null,

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

  fetchDashboardCompleto: async () => {
    set({ loading: true, error: null });
    
    try {
      const results = await Promise.allSettled([
        get().fetchKPIs(),
        get().fetchTendenciaProduccion(30),
        get().fetchDistribucionAnimales(),
        get().fetchMetricasReproduccion(),
        get().fetchAlertasSistema()
      ]);

      const errors = results
        .filter(result => result.status === 'rejected')
        .map(result => result.reason.message);

      if (errors.length > 0) {
        console.warn('Algunas peticiones fallaron:', errors);
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
  enviarReporte: async (reportData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/reportes/enviar-reporte', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.msg || 'Error en la respuesta del servidor');
      }
      
      set({ loading: false });
      return { success: true, ...result };
      
    } catch (error) {
      console.error('Error en enviarReporte:', error);
      set({ 
        error: error.message, 
        loading: false 
      });
      return { 
        success: false, 
        error: error.message 
      };
    }
  },
  clearError: () => set({ error: null }),

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
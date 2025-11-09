import { create } from 'zustand';

export const useDetalleCompraStore = create((set, get) => ({
  detalles: [],
  loading: false,
  error: null,

  fetchDetalles: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/detalleCompra', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ detalles: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar detalles de compra', 
        loading: false 
      });
    }
  },

  fetchDetallesByCompraId: async (compraId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/detalleCompra/compra/${compraId}`, {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ detalles: result.data || [], loading: false });
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al cargar detalles', loading: false });
      return { success: false, error: error.message };
    }
  },

  fetchDetallesByNumeroCompra: async (numeroCompra) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/detalleCompra/numero/${numeroCompra}`, {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ detalles: result.data.detalles || [], loading: false });
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al cargar detalles', loading: false });
      return { success: false, error: error.message };
    }
  },

  createDetalleCompra: async (detalleData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/detalleCompra', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(detalleData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        const currentState = get();
        if (currentState.detalles.length > 0) {
          const firstDetalle = currentState.detalles[0];
          if (firstDetalle.compra_id) {
            get().fetchDetallesByCompraId(firstDetalle.compra_id);
          } else {
            get().fetchDetalles();
          }
        }
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al crear detalle', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteDetalleCompra: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/detalleCompra/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        const currentState = get();
        if (currentState.detalles.length > 0) {
          const firstDetalle = currentState.detalles[0];
          if (firstDetalle.compra_id) {
            get().fetchDetallesByCompraId(firstDetalle.compra_id);
          } else {
            get().fetchDetalles();
          }
        }
        return { success: true };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchDetalleById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/detalleCompra/${id}`, {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al cargar detalle', loading: false });
      return { success: false, error: error.message };
    }
  },

  fetchTotalByCompraId: async (compraId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/detalleCompra/compra/${compraId}/total`, {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchTotalByNumeroCompra: async (numeroCompra) => {
    try {
      const response = await fetch(`http://localhost:3000/api/detalleCompra/numero/${numeroCompra}/total`, {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  clearDetalles: () => set({ detalles: [] }),

  clearError: () => set({ error: null })
}));
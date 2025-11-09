import { create } from 'zustand';

export const useTipoInsumoStore = create((set, get) => ({
  tiposInsumo: [],
  loading: false,
  error: null,

  fetchTiposInsumo: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/tipoInsumo', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ tiposInsumo: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar tipos de insumo', 
        loading: false 
      });
    }
  },

  createTipoInsumo: async (tipoInsumoData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/tipoInsumo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tipoInsumoData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchTiposInsumo();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al crear tipo de insumo', loading: false });
      return { success: false, error: error.message };
    }
  },

  updateTipoInsumo: async (id, tipoInsumoData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/tipoInsumo/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tipoInsumoData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchTiposInsumo();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al actualizar tipo de insumo', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteTipoInsumo: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/tipoInsumo/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchTiposInsumo();
        return { success: true };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchTipoInsumoById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/tipoInsumo/${id}`, {
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
      set({ error: error.message || 'Error al cargar tipo de insumo', loading: false });
      return { success: false, error: error.message };
    }
  },

  searchTiposInsumo: async (query) => {
    try {
      const response = await fetch(`http://localhost:3000/api/tipoInsumo/search?query=${encodeURIComponent(query)}`, {
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

  getTiposInsumoForSelect: () => {
    const state = get();
    return state.tiposInsumo.map(tipo => ({
      value: tipo.tipo_insumo_id.toString(),
      label: tipo.nombre
    }));
  },

  getTipoInsumoByNombre: (nombre) => {
    const state = get();
    return state.tiposInsumo.find(tipo => 
      tipo.nombre.toLowerCase() === nombre.toLowerCase()
    );
  },

  clearError: () => set({ error: null }),

  reset: () => set({ tiposInsumo: [], loading: false, error: null })
}));
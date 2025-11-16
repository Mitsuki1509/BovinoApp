import { create } from 'zustand';

export const useProduccionLecheraStore = create((set, get) => ({
  producciones: [],
  unidades: [],
  loading: false,
  error: null,

  fetchProducciones: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/produccionLechera', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.ok) {
        set({ producciones: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar producciones lecheras', 
        loading: false 
      });
    }
  },

  fetchUnidades: async () => {
    try {
      const response = await fetch('http://localhost:3000/api/produccionLechera/unidades/list', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.ok) {
        set({ unidades: result.data || [] });
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.msg || result.error };
      }
    } catch (error) {
      console.error('Error fetching unidades:', error);
      return { success: false, error: error.message };
    }
  },

  fetchProduccionById: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/produccionLechera/${id}`, {
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

  createProduccion: async (produccionData) => {
    set({ loading: true, error: null });
    try {
      console.log('Enviando datos al servidor:', produccionData);
      
      const response = await fetch('http://localhost:3000/api/produccionLechera', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(produccionData),
        credentials: 'include'
      });
      
      const result = await response.json();
      console.log('Respuesta del servidor:', result);
      
      if (!response.ok) {
        throw new Error(result.msg || result.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchProducciones(); 
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || result.error || 'Error desconocido', loading: false });
        return { success: false, error: result.msg || result.error };
      }
    } catch (error) {
      console.error('Error en createProduccion:', error);
      set({ error: error.message || 'Error al crear producción lechera', loading: false });
      return { success: false, error: error.message };
    }
  },

  updateProduccion: async (id, produccionData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/produccionLechera/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(produccionData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || result.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchProducciones(); 
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || result.error || 'Error desconocido', loading: false });
        return { success: false, error: result.msg || result.error };
      }
    } catch (error) {
      set({ error: error.message || 'Error al actualizar producción lechera', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteProduccion: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/produccionLechera/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || result.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchProducciones(); 
        return { success: true };
      } else {
        return { success: false, error: result.msg || result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getUnidades: () => {
    const state = get();
    return state.unidades;
  },

  clearError: () => set({ error: null }),

  reset: () => set({ producciones: [], unidades: [], loading: false, error: null })
}));
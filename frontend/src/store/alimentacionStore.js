import { create } from 'zustand';

export const useAlimentacionStore = create((set, get) => ({
  alimentaciones: [],
  loading: false,
  error: null,

  fetchAlimentaciones: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/alimentaciones', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ alimentaciones: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar alimentaciones', 
        loading: false 
      });
    }
  },

  createAlimentacion: async (alimentacionData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/alimentaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alimentacionData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchAlimentaciones();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al crear alimentación', loading: false });
      return { success: false, error: error.message };
    }
  },


  deleteAlimentacion: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/alimentaciones/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchAlimentaciones();
        return { success: true };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchAlimentacionById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/alimentaciones/${id}`, {
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
      set({ error: error.message || 'Error al cargar alimentación', loading: false });
      return { success: false, error: error.message };
    }
  },

  fetchAlimentacionesByAnimal: async (animalId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/alimentaciones/animal/${animalId}`, {
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
      set({ error: error.message || 'Error al cargar alimentaciones del animal', loading: false });
      return { success: false, error: error.message };
    }
  },

  fetchAlimentacionesByInsumo: async (insumoId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/alimentaciones/insumo/${insumoId}`, {
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
      set({ error: error.message || 'Error al cargar alimentaciones del insumo', loading: false });
      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null })
}));
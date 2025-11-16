import { create } from 'zustand';

export const useMataderoStore = create((set, get) => ({
  mataderos: [],
  loading: false,
  error: null,

  fetchMataderos: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/mataderos', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ mataderos: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar mataderos', 
        loading: false 
      });
    }
  },

  fetchMataderoById: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/mataderos/${id}`, {
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

  createMatadero: async (mataderoData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/mataderos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mataderoData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || result.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchMataderos();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || result.error || 'Error desconocido', loading: false });
        return { success: false, error: result.msg || result.error };
      }
    } catch (error) {
      set({ error: error.message || 'Error al crear matadero', loading: false });
      return { success: false, error: error.message };
    }
  },

  updateMatadero: async (id, mataderoData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/mataderos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mataderoData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || result.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchMataderos();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || result.error || 'Error desconocido', loading: false });
        return { success: false, error: result.msg || result.error };
      }
    } catch (error) {
      set({ error: error.message || 'Error al actualizar matadero', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteMatadero: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/mataderos/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || result.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchMataderos();
        return { success: true };
      } else {
        return { success: false, error: result.msg || result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getMataderoById: (id) => {
    const state = get();
    return state.mataderos.find(matadero => matadero.matadero_id === id);
  },

  getMataderosForSelect: () => {
    const state = get();
    return state.mataderos.map(matadero => ({
      value: matadero.matadero_id,
      label: matadero.ubicacion
    }));
  },

  clearError: () => set({ error: null }),

  reset: () => set({ mataderos: [], loading: false, error: null })
}));
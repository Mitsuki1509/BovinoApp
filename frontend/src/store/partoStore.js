import { create } from 'zustand';

export const usePartoStore = create((set, get) => ({
  partos: [],
  loading: false,
  error: null,

  fetchPartos: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/partos', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ partos: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar partos', 
        loading: false 
      });
    }
  },

  createParto: async (partoData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/partos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partoData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchPartos();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al crear parto', loading: false });
      return { success: false, error: error.message };
    }
  },

  updateParto: async (id, partoData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/partos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partoData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchPartos();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al actualizar parto', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteParto: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/partos/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchPartos();
        return { success: true };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchPartoById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/partos/${id}`, {
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
      set({ error: error.message || 'Error al cargar parto', loading: false });
      return { success: false, error: error.message };
    }
  },
  clearError: () => set({ error: null })
}));
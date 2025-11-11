import { create } from 'zustand';

export const useMontaStore = create((set, get) => ({
  montas: [],
  loading: false,
  error: null,

  fetchMontas: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/montas', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ montas: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar montas', 
        loading: false 
      });
    }
  },


  createMonta: async (montaData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/montas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(montaData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchMontas();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al crear monta', loading: false });
      return { success: false, error: error.message };
    }
  },

  updateMonta: async (id, montaData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/montas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(montaData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchMontas();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al actualizar monta', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteMonta: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/montas/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchMontas();
        return { success: true };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchMontaById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/montas/${id}`, {
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
      set({ error: error.message || 'Error al cargar monta', loading: false });
      return { success: false, error: error.message };
    }
  },  
  clearError: () => set({ error: null })
}));
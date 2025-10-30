import { create } from 'zustand';

export const useLoteStore = create((set, get) => ({
  lotes: [],
  loading: false,
  error: null,

  fetchLotes: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/lotes', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ lotes: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar lotes', 
        loading: false 
      });
    }
  },

  createLote: async (loteData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/lotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loteData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchLotes();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al crear lote', loading: false });
      return { success: false, error: error.message };
    }
  },

  updateLote: async (id, loteData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/lotes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loteData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchLotes();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al actualizar lote', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteLote: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/lotes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchLotes();
        return { success: true };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchLoteById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/lotes/${id}`, {
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
      set({ error: error.message || 'Error al cargar lote', loading: false });
      return { success: false, error: error.message };
    }
  },

  fetchLotesSinPotrero: async () => {
    try {
      const response = await fetch('http://localhost:3000/api/lotes/sin-potrero', {
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

  searchLotes: async (query) => {
    try {
      const response = await fetch(`http://localhost:3000/api/lotes/search?query=${encodeURIComponent(query)}`, {
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

  clearError: () => set({ error: null })
}));
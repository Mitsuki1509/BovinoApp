import { create } from 'zustand';

export const useDiagnosticoStore = create((set, get) => ({
  diagnosticos: [],
  loading: false,
  error: null,

  fetchDiagnosticos: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/diagnosticos', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ diagnosticos: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar diagnósticos', 
        loading: false 
      });
    }
  },

  createDiagnostico: async (diagnosticoData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/diagnosticos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(diagnosticoData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchDiagnosticos();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al crear diagnóstico', loading: false });
      return { success: false, error: error.message };
    }
  },

  updateDiagnostico: async (id, diagnosticoData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/diagnosticos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(diagnosticoData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchDiagnosticos();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al actualizar diagnóstico', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteDiagnostico: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/diagnosticos/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchDiagnosticos();
        return { success: true };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchDiagnosticoById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/diagnosticos/${id}`, {
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
      set({ error: error.message || 'Error al cargar diagnóstico', loading: false });
      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null })
}));
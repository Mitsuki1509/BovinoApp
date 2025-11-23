import { create } from 'zustand';

export const useCompraInsumoStore = create((set, get) => ({
  comprasInsumos: [],
  loading: false,
  error: null,

  fetchComprasInsumos: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/comprasInsumo', {
        credentials: 'include'
      });
     
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ comprasInsumos: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar compras de insumos', 
        loading: false 
      });
    }
  },

  createCompraInsumo: async (compraData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/comprasInsumo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(compraData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchComprasInsumos();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al crear compra de insumos', loading: false });
      return { success: false, error: error.message };
    }
  },

  updateCompraInsumo: async (id, compraData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/comprasInsumo/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(compraData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchComprasInsumos();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al actualizar compra de insumos', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteCompraInsumo: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/comprasInsumo/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchComprasInsumos();
        return { success: true };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null })
}));
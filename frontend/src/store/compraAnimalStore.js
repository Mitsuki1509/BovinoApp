import { create } from 'zustand';

export const useCompraAnimalStore = create((set, get) => ({
  comprasAnimales: [],
  loading: false,
  error: null,

  fetchComprasAnimales: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/comprasAnimales', {
        credentials: 'include'
      });
     
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ comprasAnimales: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar compras de animales', 
        loading: false 
      });
    }
  },

  createCompraAnimal: async (compraData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/comprasAnimales', {
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
        get().fetchComprasAnimales();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al crear compra de animales', loading: false });
      return { success: false, error: error.message };
    }
  },

  updateCompraAnimal: async (id, compraData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/comprasAnimales/${id}`, {
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
        get().fetchComprasAnimales();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al actualizar compra de animales', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteCompraAnimal: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/comprasAnimales/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchComprasAnimales();
        return { success: true };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchCompraAnimalById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/comprasAnimales/${id}`, {
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
      set({ error: error.message || 'Error al cargar compra de animales', loading: false });
      return { success: false, error: error.message };
    }
  },

  fetchCompraAnimalByNumero: async (numeroCompra) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/comprasAnimales/numero/${numeroCompra}`, {
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
      set({ error: error.message || 'Error al cargar compra por número', loading: false });
      return { success: false, error: error.message };
    }
  },

  getTotalCompraAnimal: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/comprasAnimales/${id}/total`, {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        return { success: true, total: result.data.total };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null })
}));
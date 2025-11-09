import { create } from 'zustand';

export const useInsumoStore = create((set, get) => ({
  insumos: [],
  loading: false,
  error: null,

  fetchInsumos: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/insumos', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ insumos: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar insumos', 
        loading: false 
      });
    }
  },

  fetchInsumoById: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/insumos/${id}`, {
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

  createInsumo: async (insumoData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      
      Object.keys(insumoData).forEach(key => {
        const value = insumoData[key];
        
        if (value === null || value === undefined || value === 'null') {
          if (key === 'tipo_insumo_id' || key === 'unidad_id') {
            formData.append(key, ''); 
          }
          return;
        }
        
        if (key === 'imagen' && value instanceof File) {
          formData.append(key, value);
        }
        else if (value !== '' && value !== 'null') {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch('http://localhost:3000/api/insumos', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchInsumos(); 
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al crear insumo', loading: false });
      return { success: false, error: error.message };
    }
  },

  updateInsumo: async (id, insumoData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();

      Object.keys(insumoData).forEach(key => {
        const value = insumoData[key];
        
        if (value === null || value === undefined || value === 'null') {
          if (key === 'tipo_insumo_id' || key === 'unidad_id') {
            formData.append(key, ''); 
          }
          return;
        }
        
        if (key === 'imagen' && value instanceof File) {
          formData.append(key, value);
        }
        else if (value !== '' && value !== 'null') {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch(`http://localhost:3000/api/insumos/${id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchInsumos(); 
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al actualizar insumo', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteInsumo: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/insumos/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchInsumos(); 
        return { success: true };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  searchInsumos: async (query) => {
    try {
      const response = await fetch(`http://localhost:3000/api/insumos/search?query=${encodeURIComponent(query)}`, {
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

  updateCantidadInsumo: async (id, cantidad, operacion) => {
    try {
      const response = await fetch(`http://localhost:3000/api/insumos/${id}/cantidad`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cantidad, operacion }),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchInsumos(); 
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchInsumosForSelect: async () => {
    try {
      const response = await fetch('http://localhost:3000/api/insumos', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        return { success: true, data: result.data || [] };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

fetchUnidades: async () => {
  try {
    const response = await fetch('http://localhost:3000/api/insumos/unidades', {
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

  getInsumosByTipo: (tipoInsumoId) => {
    const state = get();
    return state.insumos.filter(insumo => insumo.tipo_insumo_id === tipoInsumoId);
  },

  getInsumosBajoStock: (nivelAlerta = 10) => {
    const state = get();
    return state.insumos.filter(insumo => insumo.cantidad <= nivelAlerta);
  },

  getInsumoByNombre: (nombre) => {
    const state = get();
    return state.insumos.find(insumo => 
      insumo.nombre.toLowerCase() === nombre.toLowerCase()
    );
  },

  clearError: () => set({ error: null }),

  reset: () => set({ insumos: [], loading: false, error: null })
}));
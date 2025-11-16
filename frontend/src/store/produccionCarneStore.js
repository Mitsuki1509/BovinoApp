import { create } from 'zustand';

export const useProduccionCarneStore = create((set, get) => ({
  producciones: [],
  loading: false,
  error: null,

  fetchProducciones: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/produccionCarne', {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || 'Error al cargar producciones');
      }
      
      if (result.ok) {
        set({ producciones: result.data || [], loading: false });
      } else {
        throw new Error(result.msg || 'Error desconocido');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error fetching producciones:', error);
    }
  },

  fetchProduccionById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/produccionCarne/${id}`, {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || 'Error al cargar la producción');
      }
      
      if (result.ok) {
        set({ loading: false });
        return result.data;
      } else {
        throw new Error(result.msg || 'Error desconocido');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error fetching producción:', error);
      throw error;
    }
  },

  // En useProduccionCarneStore - createProduccion actualizada
createProduccion: async (produccionData) => {
  set({ loading: true, error: null });
  try {
    console.log('🔍 DEBUG - Datos que se enviarán:', produccionData);
    console.log('🔍 DEBUG - Tipos de datos:', {
      animal_id: typeof produccionData.animal_id,
      matadero_id: typeof produccionData.matadero_id,
      unidad_id: typeof produccionData.unidad_id,
      peso_canal: typeof produccionData.peso_canal,
      fecha: typeof produccionData.fecha
    });

    const response = await fetch('http://localhost:3000/api/produccionCarne', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(produccionData),
      credentials: 'include'
    });
    
    console.log('🔍 DEBUG - Status de respuesta:', response.status);
    console.log('🔍 DEBUG - Headers:', response.headers);
    
    const result = await response.json();
    console.log('🔍 DEBUG - Respuesta completa del servidor:', result);
    
    if (!response.ok) {
      // Mostrar más detalles del error
      const errorDetails = result.details || result.message || result.msg || result.error || `Error ${response.status}`;
      console.error('🔍 DEBUG - Detalles del error:', errorDetails);
      throw new Error(errorDetails);
    }
    
    if (result.ok) {
      await get().fetchProducciones();
      set({ loading: false });
      return { success: true, data: result.data };
    } else {
      throw new Error(result.msg || 'Error del servidor sin detalles');
    }
  } catch (error) {
    console.error('🔍 DEBUG - Error completo:', error);
    set({ error: error.message, loading: false });
    return { success: false, error: error.message };
  }
},
  updateProduccion: async (id, produccionData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/produccionCarne/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(produccionData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || result.error || 'Error al actualizar producción');
      }
      
      if (result.ok) {
        // Actualizar la lista de producciones
        await get().fetchProducciones();
        set({ loading: false });
        return { success: true, data: result.data };
      } else {
        throw new Error(result.msg || 'Error desconocido');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error updating producción:', error);
      return { success: false, error: error.message };
    }
  },

  deleteProduccion: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/produccionCarne/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || 'Error al eliminar producción');
      }
      
      if (result.ok) {
        // Actualizar la lista de producciones
        await get().fetchProducciones();
        set({ loading: false });
        return { success: true };
      } else {
        throw new Error(result.msg || 'Error desconocido');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error deleting producción:', error);
      return { success: false, error: error.message };
    }
  },

  fetchUnidades: async () => {
    try {
      const response = await fetch('http://localhost:3000/api/produccionCarne/unidades/list', {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || 'Error al cargar unidades');
      }
      
      if (result.ok) {
        return result.data || [];
      } else {
        throw new Error(result.msg || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error fetching unidades:', error);
      throw error;
    }
  },

  fetchMataderos: async () => {
    try {
      const response = await fetch('http://localhost:3000/api/produccionCarne/mataderos/list', {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || 'Error al cargar mataderos');
      }
      
      if (result.ok) {
        return result.data || [];
      } else {
        throw new Error(result.msg || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error fetching mataderos:', error);
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));
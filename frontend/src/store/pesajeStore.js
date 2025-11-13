import { create } from 'zustand';

export const usePesajeStore = create((set, get) => ({
  pesajes: [],
  loading: false,
  error: null,

  fetchPesajes: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/pesajes', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ pesajes: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar pesajes', 
        loading: false 
      });
    }
  },

  fetchPesajeById: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/pesajes/${id}`, {
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

  createPesaje: async (pesajeData) => {
    set({ loading: true, error: null });
    try {
      console.log('Enviando datos al servidor:', pesajeData);
      
      const response = await fetch('http://localhost:3000/api/pesajes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pesajeData),
        credentials: 'include'
      });
      
      const result = await response.json();
      console.log('Respuesta del servidor:', result);
      
      if (!response.ok) {
        throw new Error(result.msg || result.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchPesajes(); 
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || result.error || 'Error desconocido', loading: false });
        return { success: false, error: result.msg || result.error };
      }
    } catch (error) {
      console.error('Error en createPesaje:', error);
      set({ error: error.message || 'Error al crear pesaje', loading: false });
      return { success: false, error: error.message };
    }
  },

  updatePesaje: async (id, pesajeData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/pesajes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pesajeData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || result.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchPesajes(); 
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || result.error || 'Error desconocido', loading: false });
        return { success: false, error: result.msg || result.error };
      }
    } catch (error) {
      set({ error: error.message || 'Error al actualizar pesaje', loading: false });
      return { success: false, error: error.message };
    }
  },

  deletePesaje: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/pesajes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || result.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchPesajes(); 
        return { success: true };
      } else {
        return { success: false, error: result.msg || result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchPesajesByAnimal: async (animalId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/pesajes/animal/${animalId}`, {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || result.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.msg || result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  searchPesajes: async (params = {}) => {
    try {
      const { query, fecha_inicio, fecha_fin } = params;
      
      const searchParams = new URLSearchParams();
      if (query) searchParams.append('query', query);
      if (fecha_inicio) searchParams.append('fecha_inicio', fecha_inicio);
      if (fecha_fin) searchParams.append('fecha_fin', fecha_fin);

      const response = await fetch(`http://localhost:3000/api/pesajes/search/buscar?${searchParams.toString()}`, {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || result.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.msg || result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchUnidades: async () => {
    try {
      const response = await fetch('http://localhost:3000/api/pesajes/unidades/list', {
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || result.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.msg || result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Métodos utilitarios para filtrar datos
  getPesajesByAnimalId: (animalId) => {
    const state = get();
    return state.pesajes.filter(pesaje => pesaje.animal_id === animalId);
  },

  getPesajesByFecha: (fecha) => {
    const state = get();
    const fechaBusqueda = new Date(fecha).toDateString();
    return state.pesajes.filter(pesaje => 
      new Date(pesaje.fecha).toDateString() === fechaBusqueda
    );
  },

  getPesajesByRangoFechas: (fechaInicio, fechaFin) => {
    const state = get();
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    return state.pesajes.filter(pesaje => {
      const fechaPesaje = new Date(pesaje.fecha);
      return fechaPesaje >= inicio && fechaPesaje <= fin;
    });
  },

  getUltimoPesajeAnimal: (animalId) => {
    const state = get();
    const pesajesAnimal = state.pesajes
      .filter(pesaje => pesaje.animal_id === animalId)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    return pesajesAnimal.length > 0 ? pesajesAnimal[0] : null;
  },

  getEvolucionPesoAnimal: (animalId) => {
    const state = get();
    return state.pesajes
      .filter(pesaje => pesaje.animal_id === animalId)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .map(pesaje => ({
        fecha: pesaje.fecha,
        peso: pesaje.peso,
        unidad: pesaje.unidad?.nombre
      }));
  },

  getPesajesRecientes: (limite = 10) => {
    const state = get();
    return state.pesajes
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, limite);
  },

  getEstadisticasPesajes: () => {
    const state = get();
    if (state.pesajes.length === 0) {
      return {
        totalPesajes: 0,
        promedioPeso: 0,
        pesoMaximo: 0,
        pesoMinimo: 0,
        animalesUnicos: 0
      };
    }

    const pesos = state.pesajes.map(p => parseFloat(p.peso));
    const animalesUnicos = new Set(state.pesajes.map(p => p.animal_id)).size;

    return {
      totalPesajes: state.pesajes.length,
      promedioPeso: pesos.reduce((a, b) => a + b, 0) / pesos.length,
      pesoMaximo: Math.max(...pesos),
      pesoMinimo: Math.min(...pesos),
      animalesUnicos
    };
  },

  clearError: () => set({ error: null }),

  reset: () => set({ pesajes: [], loading: false, error: null })
}));
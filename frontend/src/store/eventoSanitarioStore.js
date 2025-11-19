import { create } from 'zustand';

export const useEventoSanitarioStore = create((set, get) => ({
  eventosSanitarios: [],
  loading: false,
  error: null,

  fetchEventosSanitarios: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/eventosSanitario', {
        credentials: 'include'
      });
     
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ eventosSanitarios: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar eventos sanitarios', 
        loading: false 
      });
    }
  },

  checkEventoDuplicado: async (animal_id, tipo_evento_id, fecha) => {
    try {
      const response = await fetch(`http://localhost:3000/api/eventos-sanitarios/check/duplicado?animal_id=${animal_id}&tipo_evento_id=${tipo_evento_id}&fecha=${fecha}`, {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        return result.duplicado;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error verificando duplicado:', error);
      return false;
    }
  },

  createEventoSanitario: async (eventoData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/eventosSanitario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventoData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchEventosSanitarios();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al crear evento sanitario', loading: false });
      return { success: false, error: error.message };
    }
  },

  updateEventoSanitario: async (id, eventoData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/eventosSanitario/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventoData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        get().fetchEventosSanitarios();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al actualizar evento sanitario', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteEventoSanitario: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/eventosSanitario/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchEventosSanitarios();
        return { success: true };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchEventoSanitarioById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/eventosSanitario/${id}`, {
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
      set({ error: error.message || 'Error al cargar evento sanitario', loading: false });
      return { success: false, error: error.message };
    }
  },

  fetchEventosByAnimal: async (animalId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/eventosSanitario/animal/${animalId}`, {
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
      set({ error: error.message || 'Error al cargar eventos del animal', loading: false });
      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null })
}));
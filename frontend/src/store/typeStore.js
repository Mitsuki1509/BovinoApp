import { create } from 'zustand';

export const useTypeStore = create((set, get) => ({
  eventTypes: [],
  parentEventTypes: [],
  loading: false,
  error: null,

  fetchEventTypes: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/types', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ eventTypes: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar tipos de evento', 
        loading: false 
      });
    }
  },

  fetchParentEventTypes: async () => {
    try {
      const response = await fetch('http://localhost:3000/api/types/padres', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ parentEventTypes: result.data || [] });
      }
    } catch (error) {
      console.error('Error en fetchParentEventTypes:', error);
    }
  },

  createEventType: async (eventTypeData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventTypeData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        
        get().fetchEventTypes();
        get().fetchParentEventTypes();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al crear tipo de evento', loading: false });
      return { success: false, error: error.message };
    }
  },

  updateEventType: async (id, eventTypeData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventTypeData),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ loading: false });
        // Actualizar las listas
        get().fetchEventTypes();
        get().fetchParentEventTypes();
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al actualizar tipo de evento', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteEventType: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/types/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        // Actualizar las listas
        get().fetchEventTypes();
        get().fetchParentEventTypes();
        return { success: true };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchEventTypeById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/types/${id}`, {
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
      set({ error: error.message || 'Error al cargar tipo de evento', loading: false });
      return { success: false, error: error.message };
    }
  },

  fetchChildEventTypes: async (parentId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/types/${parentId}/hijos`, {
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
import { create } from 'zustand';

export const useUserAdminStore = create((set, get) => ({
  users: [],
  roles: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/users/admin/users', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ users: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar usuarios', 
        loading: false 
      });
    }
  },

  fetchRoles: async () => {
    const currentState = get();
    if (currentState.roles.length > 0) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/users/admin/roles', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ roles: result.data || [] });
      }
    } catch (error) {
      console.error('Error en fetchRoles:', error);
    }
  },

  createUser: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/users/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
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
      set({ error: error.message || 'Error al crear usuario', loading: false });
      return { success: false, error: error.message };
    }
  },

  updateUser: async (id, userData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
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
      set({ error: error.message || 'Error al actualizar usuario', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        return { success: true };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  resetPassword: async (userId, newPassword) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3000/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nueva_password: newPassword
        }),
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
      set({ error: error.message || 'Error al cambiar contraseña', loading: false });
      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null })
}));
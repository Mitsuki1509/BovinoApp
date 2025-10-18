// store/authStore.js
import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  formData: {
    email: '',
    password: ''
  },
  loading: false,
  user: null,

  setFormData: (name, value) => {
    set(state => ({
      formData: {
        ...state.formData,
        [name]: value
      }
    }));
  },

  login: async () => {
    set({ loading: true });
    try {
      const { formData } = get();
      
      const response = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.ok) {
        set({ user: result.data });
        localStorage.setItem('userInfo', JSON.stringify(result.data));
        return true;
      } else {
        alert(result.msg);
        return false;
      }
    } catch (error) {
      console.error('Error en login:', error);
      alert('Error al conectar con el servidor');
      return false;
    } finally {
      set({ loading: false });
    }
  },

  oauth: () => {
    window.location.href = "http://localhost:3000/api/users/auth/google";
  },

  checkAuth: async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users/is_auth', {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.ok) {
        set({ user: result.data });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      return false;
    }
  },

  logout: async () => {
    try {
      await fetch('http://localhost:3000/api/users/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    } finally {
      set({ user: null });
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
  }
}));
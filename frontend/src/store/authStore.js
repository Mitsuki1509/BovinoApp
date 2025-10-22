import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  formData: {
    email: '',
    password: ''
  },
  loading: false,
  user: null,
  authLoading: false,

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
        const userData = result.data;
        set({ user: userData });
        localStorage.setItem('userInfo', JSON.stringify(userData));
        
        set({ formData: { email: '', password: '' } });
        
        return true;
      } else {
        alert(result.msg || 'Error en el login');
        return false;
      }
    } catch (error) {
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
    set({ authLoading: true });
    try {
      const response = await fetch('http://localhost:3000/api/users/is_auth', {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.ok && result.data) {
        const userData = result.data;
        set({ user: userData, authLoading: false });
        
        localStorage.setItem('userInfo', JSON.stringify(userData));
        
        return true;
      } else {
        set({ user: null, authLoading: false });
        localStorage.removeItem('userInfo');
        return false;
      }
    } catch (error) {
      set({ user: null, authLoading: false });
      localStorage.removeItem('userInfo');
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
      set({ user: null, formData: { email: '', password: '' } });
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
  },

  loadUserFromStorage: () => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        set({ user: userData });
      } catch (error) {
        localStorage.removeItem('userInfo');
      }
    }
  }
}));
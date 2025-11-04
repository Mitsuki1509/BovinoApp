import { create } from 'zustand';

export const useAnimalStore = create((set, get) => ({
  animales: [],
  loading: false,
  error: null,

  fetchAnimales: async () => {
    const currentState = get();
    if (currentState.loading) return;
    
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3000/api/animales', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        set({ animales: result.data || [], loading: false });
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Error al cargar animales', 
        loading: false 
      });
    }
  },

  fetchAnimalById: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/animales/${id}`, {
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

  createAnimal: async (animalData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      
      Object.keys(animalData).forEach(key => {
        const value = animalData[key];
        
        if (value === null || value === undefined || value === 'null') {

          if (key === 'lote_id' || key === 'raza_id' || key === 'animal_madre_id' || key === 'animal_padre_id') {
            formData.append(key, ''); 
          }
          return;
        }
        
        if (key === 'fecha_nacimiento' || key === 'fecha_destete') {
          if (value instanceof Date) {
            formData.append(key, value.toISOString().split('T')[0]);
          } else if (value) {
            formData.append(key, value);
          }
        } 
        else if (key === 'imagen' && value instanceof File) {
          formData.append(key, value);
        }
        else if (value !== '' && value !== 'null') {
          formData.append(key, value);
        }
      });

      for (let [key, val] of formData.entries()) {
        console.log(`  ${key}:`, val);
      }

      const response = await fetch('http://localhost:3000/api/animales', {
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
        get().fetchAnimales(); 
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al crear animal', loading: false });
      return { success: false, error: error.message };
    }
  },

  updateAnimal: async (id, animalData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();

      Object.keys(animalData).forEach(key => {
        const value = animalData[key];
        
        if (value === null || value === undefined || value === 'null') {
          if (key === 'lote_id' || key === 'raza_id' || key === 'animal_madre_id' || key === 'animal_padre_id') {
            formData.append(key, ''); 
          }
          return;
        }
        
        if (key === 'fecha_nacimiento' || key === 'fecha_destete') {
          if (value instanceof Date) {
            formData.append(key, value.toISOString().split('T')[0]);
          } else if (value) {
            formData.append(key, value);
          }
        } 
        else if (key === 'imagen' && value instanceof File) {
          formData.append(key, value);
        }
        else if (value !== '' && value !== 'null') {
          formData.append(key, value);
        }
      });


      const response = await fetch(`http://localhost:3000/api/animales/${id}`, {
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
        get().fetchAnimales(); 
        return { success: true, data: result.data };
      } else {
        set({ error: result.msg || 'Error desconocido', loading: false });
        return { success: false, error: result.msg };
      }
    } catch (error) {
      set({ error: error.message || 'Error al actualizar animal', loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteAnimal: async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/animales/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (result.ok) {
        get().fetchAnimales(); 
        return { success: true };
      } else {
        return { success: false, error: result.msg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  searchAnimales: async (query) => {
    try {
      const response = await fetch(`http://localhost:3000/api/animales/search?query=${encodeURIComponent(query)}`, {
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

  fetchAnimalesForSelect: async () => {
    try {
      const response = await fetch('http://localhost:3000/api/animales', {
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

  getAnimalesBySexo: (sexo) => {
    const state = get();
    return state.animales.filter(animal => animal.sexo === sexo);
  },

  getAnimalByArete: (arete) => {
    const state = get();
    return state.animales.find(animal => animal.arete === arete);
  },

  clearError: () => set({ error: null }),

  reset: () => set({ animales: [], loading: false, error: null })
}));
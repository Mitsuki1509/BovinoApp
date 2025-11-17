import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = API_BASE.replace(/\/api$/, '');

export const useNotificacionStore = create(
  persist(
    (set, get) => ({
      notificaciones: [],
      notificacionesNoLeidas: 0,
      loading: false,
      error: null,
      socket: null,

      inicializarSocket: (usuarioId) => {
        if (!usuarioId) return;

        const socket = io(BASE_URL, {
          withCredentials: true
        });

        socket.emit('registrar-usuario', usuarioId);

        socket.on('nueva-notificacion', (nuevaNotif) => {
          set(state => {
            const updatedNotificaciones = [nuevaNotif, ...state.notificaciones];
            const noLeidas = updatedNotificaciones.filter(n => !n.leida).length;
            
            return {
              notificaciones: updatedNotificaciones,
              notificacionesNoLeidas: noLeidas
            };
          });

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(nuevaNotif.titulo, {
              body: nuevaNotif.mensaje
            });
          }
        });

        set({ socket });
      },

      solicitarPermisosNotificacion: () => {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      },

      fetchNotificaciones: async (usuarioId) => {
        if (!usuarioId) return;

        set({ loading: true, error: null });
        try {
          const response = await fetch(`${BASE_URL}/api/notificaciones/usuario/${usuarioId}`, {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
          }

          const result = await response.json();

          if (result.ok) {
            set({ 
              notificaciones: result.data || [],
              notificacionesNoLeidas: result.noLeidas || 0,
              loading: false,
              error: null
            });

            get().inicializarSocket(usuarioId);
            get().solicitarPermisosNotificacion();
          } else {
            throw new Error(result.msg || 'Error del servidor');
          }
        } catch (error) {
          set({ 
            loading: false, 
            error: error.message
          });
        }
      },

      marcarComoLeida: async (notificacionId) => {
        try {
          const response = await fetch(`${BASE_URL}/api/notificaciones/${notificacionId}/leer`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
          }

          set(state => {
            const updatedNotificaciones = state.notificaciones.map(n =>
              n.notificacion_id === notificacionId ? { ...n, leida: true } : n
            );
            const noLeidas = updatedNotificaciones.filter(n => !n.leida).length;
            
            return {
              notificaciones: updatedNotificaciones,
              notificacionesNoLeidas: noLeidas
            };
          });

        } catch (error) {}
      },

      marcarTodasComoLeidas: async (usuarioId) => {
        try {
          const response = await fetch(`${BASE_URL}/api/notificaciones/usuario/${usuarioId}/leer-todas`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
          }

          set(state => ({
            notificaciones: state.notificaciones.map(n => ({ ...n, leida: true })),
            notificacionesNoLeidas: 0
          }));

        } catch (error) {}
      },

      limpiarNotificacionesLeidas: async (usuarioId) => {
        try {
          const response = await fetch(`${BASE_URL}/api/notificaciones/usuario/${usuarioId}/limpiar`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
          }

          const result = await response.json();

          if (result.ok) {
            set(state => {
              const notificacionesNoLeidas = state.notificaciones.filter(n => !n.leida);
              return {
                notificaciones: notificacionesNoLeidas,
                notificacionesNoLeidas: notificacionesNoLeidas.length
              };
            });

            return { success: true, eliminadas: result.eliminadas };
          } else {
            throw new Error(result.msg || 'Error al limpiar notificaciones');
          }

        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      forceReload: (usuarioId) => {
        set({ 
          loading: true,
          error: null
        });
        get().fetchNotificaciones(usuarioId);
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'notificaciones-storage',
      partialize: (state) => ({
        notificaciones: state.notificaciones,
        notificacionesNoLeidas: state.notificacionesNoLeidas,
        loading: state.loading,
        error: state.error
      })
    }
  )
);

export const useNotificaciones = () => {
  const {
    notificaciones,
    notificacionesNoLeidas,
    loading,
    error,
    socket,
    inicializarSocket,
    solicitarPermisosNotificacion,
    fetchNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    limpiarNotificacionesLeidas,
    forceReload,
    clearError,
  } = useNotificacionStore();

  return {
    notificaciones,
    notificacionesNoLeidas,
    loading,
    error,
    socket,
    inicializarSocket,
    solicitarPermisosNotificacion,
    fetchNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    limpiarNotificacionesLeidas,
    forceReload,
    clearError,
  };
};
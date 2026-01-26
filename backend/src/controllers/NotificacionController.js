import prisma from "../database.js";
import { io, usuariosConectados } from "../app.js";

export default class NotificacionController {

    // Método auxiliar para formatear fechas en formato DD/MM/YY
    static formatearFecha(fecha) {
        try {
            const date = new Date(fecha);
            const dia = String(date.getDate()).padStart(2, '0');
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const año = String(date.getFullYear()).slice(-2);
            
            return `${dia}/${mes}/${año}`;
        } catch (error) {
            console.error("Error formateando fecha:", error);
            const now = new Date();
            const dia = String(now.getDate()).padStart(2, '0');
            const mes = String(now.getMonth() + 1).padStart(2, '0');
            const año = String(now.getFullYear()).slice(-2);
            return `${dia}/${mes}/${año}`;
        }
    }

    static async getByUsuario(req, res) {
        try {
            const { usuarioId } = req.params;
            const usuarioIdInt = parseInt(usuarioId);

            if (isNaN(usuarioIdInt)) {
                return res.status(400).json({
                    ok: false,
                    msg: "ID de usuario inválido"
                });
            }

            const usuario = await prisma.usuarios.findFirst({
                where: { 
                    usuario_id: usuarioIdInt,
                    deleted_at: null 
                },
                include: {
                    rol: {
                        select: {
                            nombre: true
                        }
                    }
                }
            });

            if (!usuario) {
                return res.status(404).json({
                    ok: false,
                    msg: "Usuario no encontrado"
                });
            }

            const rolNombre = usuario.rol.nombre;
            
            const notificaciones = await prisma.notificaciones.findMany({
                where: { 
                    usuario_id: usuarioIdInt, 
                    deleted_at: null
                },
                include: {
                    usuario: {
                        select: {
                            usuario_id: true,
                            nombre: true,
                            correo: true
                        }
                    }
                },
                orderBy: {
                    fecha: 'desc'
                }
            });

            // Agregar fecha formateada a cada notificación
            const notificacionesConFecha = notificaciones.map(notif => ({
                ...notif,
                fecha_formateada: NotificacionController.formatearFecha(notif.fecha)
            }));

            const noLeidas = notificaciones.filter(n => !n.leida).length;

            return res.json({
                ok: true,
                data: notificacionesConFecha,
                noLeidas,
                rol: rolNombre
            });

        } catch (error) {
            console.error("Error en getByUsuario:", error);
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener notificaciones"
            });
        }
    }

    static async crearNotificacionParaRol(titulo, mensaje, tipo, modulo, rolesDestino) {
        try {
            if (!Array.isArray(rolesDestino)) {
                rolesDestino = [rolesDestino];
            }

            const usuarios = await prisma.usuarios.findMany({
                where: {
                    rol: {
                        nombre: { in: rolesDestino }
                    },
                    deleted_at: null
                },
                select: {
                    usuario_id: true
                }
            });

            if (usuarios.length === 0) {
                console.log(`No se encontraron usuarios con los roles: ${rolesDestino.join(', ')}`);
                return;
            }

            const fechaActual = new Date();
            const fechaFormateada = NotificacionController.formatearFecha(fechaActual);

            // Agregar fecha al mensaje si no la incluye
            let mensajeFinal = mensaje;
            if (!mensaje.includes('Fecha:') && !mensaje.includes('fecha:')) {
                mensajeFinal = `${mensaje}\n\nFecha: ${fechaFormateada}`;
            }

            const notificacionesData = usuarios.map(usuario => ({
                usuario_id: usuario.usuario_id,
                titulo: titulo.trim(),
                mensaje: mensajeFinal.trim(),
                tipo,
                modulo,
                fecha: fechaActual,
                leida: false
            }));

            const resultado = await prisma.notificaciones.createMany({
                data: notificacionesData
            });


            // Enviar notificaciones en tiempo real
            usuarios.forEach(usuario => {
                const socketId = usuariosConectados.get(usuario.usuario_id.toString());
                if (socketId) {
                    io.to(socketId).emit("nueva-notificacion", {
                        titulo,
                        mensaje: mensajeFinal,
                        tipo,
                        modulo,
                        fecha: fechaActual,
                        fecha_formateada: fechaFormateada,
                        leida: false
                    });
                }
            });

            return resultado.count;

        } catch (error) {
            console.error("Error en crearNotificacionParaRol:", error);
            throw error;
        }
    }

    static async crearNotificacionIndividual(usuarioId, titulo, mensaje, tipo = "informativo", modulo = "sistema") {
        try {
            const fechaActual = new Date();
            const fechaFormateada = NotificacionController.formatearFecha(fechaActual);

            // Agregar fecha al mensaje si no la incluye
            let mensajeFinal = mensaje;
            if (!mensaje.includes('Fecha:') && !mensaje.includes('fecha:')) {
                mensajeFinal = `${mensaje}\n\nFecha: ${fechaFormateada}`;
            }

            const notificacion = await prisma.notificaciones.create({
                data: {
                    usuario_id: usuarioId,
                    titulo: titulo.trim(),
                    mensaje: mensajeFinal.trim(),
                    tipo,
                    modulo,
                    fecha: fechaActual,
                    leida: false
                }
            });

            console.log(`Notificación individual creada para usuario ID: ${usuarioId}`);

            const socketId = usuariosConectados.get(usuarioId.toString());
            if (socketId) {
                io.to(socketId).emit("nueva-notificacion", {
                    notificacion_id: notificacion.notificacion_id,
                    titulo,
                    mensaje: mensajeFinal,
                    tipo,
                    modulo,
                    fecha: fechaActual,
                    fecha_formateada: fechaFormateada,
                    leida: false
                });
            }

            return notificacion;

        } catch (error) {
            console.error("Error en crearNotificacionIndividual:", error);
            throw error;
        }
    }

    static async limpiarLeidas(req, res) {
        try {
            const { usuarioId } = req.params;
            const usuarioIdInt = parseInt(usuarioId);

            if (isNaN(usuarioIdInt)) {
                return res.status(400).json({
                    ok: false,
                    msg: "ID de usuario inválido"
                });
            }

            const usuario = await prisma.usuarios.findFirst({
                where: { 
                    usuario_id: usuarioIdInt,
                    deleted_at: null 
                }
            });

            if (!usuario) {
                return res.status(404).json({
                    ok: false,
                    msg: "Usuario no encontrado"
                });
            }

            const resultado = await prisma.notificaciones.updateMany({
                where: { 
                    usuario_id: usuarioIdInt, 
                    leida: true,
                    deleted_at: null
                },
                data: { 
                    deleted_at: new Date() 
                }
            });

            console.log(`${resultado.count} notificaciones leídas eliminadas para usuario ID: ${usuarioId}`);

            return res.json({
                ok: true,
                msg: `${resultado.count} notificaciones leídas eliminadas`,
                eliminadas: resultado.count
            });

        } catch (error) {
            console.error("Error en limpiarLeidas:", error);
            return res.status(500).json({
                ok: false,
                msg: "Error al limpiar notificaciones"
            });
        }
    }

    static async marcarComoLeida(req, res) {
        try {
            const { id } = req.params;
            const notificacionId = parseInt(id);

            if (isNaN(notificacionId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "ID de notificación inválido"
                });
            }

            const notificacion = await prisma.notificaciones.update({
                where: { 
                    notificacion_id: notificacionId
                },
                data: { 
                    leida: true
                }
            });

            console.log(`Notificación ${notificacionId} marcada como leída`);

            return res.json({
                ok: true,
                msg: "Notificación marcada como leída",
                data: notificacion
            });

        } catch (error) {
            console.error("Error en marcarComoLeida:", error);
            return res.status(500).json({
                ok: false,
                msg: "Error al marcar notificación"
            });
        }
    }

    static async marcarTodasComoLeidas(req, res) {
        try {
            const { usuarioId } = req.params;
            const usuarioIdInt = parseInt(usuarioId);

            if (isNaN(usuarioIdInt)) {
                return res.status(400).json({
                    ok: false,
                    msg: "ID de usuario inválido"
                });
            }

            const usuario = await prisma.usuarios.findFirst({
                where: { 
                    usuario_id: usuarioIdInt,
                    deleted_at: null 
                }
            });

            if (!usuario) {
                return res.status(404).json({
                    ok: false,
                    msg: "Usuario no encontrado"
                });
            }

            const resultado = await prisma.notificaciones.updateMany({
                where: { 
                    usuario_id: usuarioIdInt, 
                    leida: false,
                    deleted_at: null
                },
                data: { 
                    leida: true
                }
            });

            console.log(`${resultado.count} notificaciones marcadas como leídas para usuario ID: ${usuarioId}`);

            return res.json({
                ok: true,
                msg: `${resultado.count} notificaciones marcadas como leídas`,
                actualizadas: resultado.count
            });

        } catch (error) {
            console.error("Error en marcarTodasComoLeidas:", error);
            return res.status(500).json({
                ok: false,
                msg: "Error al marcar notificaciones"
            });
        }
    }
}
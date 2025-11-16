import prisma from "../database.js";

export default class NotificacionController {

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

            const noLeidas = notificaciones.filter(n => !n.leida).length;

            return res.json({
                ok: true,
                data: notificaciones,
                noLeidas,
                rol: rolNombre
            });

        } catch (error) {
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
                return;
            }

            const notificacionesData = usuarios.map(usuario => ({
                usuario_id: usuario.usuario_id,
                titulo: titulo.trim(),
                mensaje: mensaje.trim(),
                tipo,
                modulo,
                fecha: new Date(),
                leida: false
            }));

            const resultado = await prisma.notificaciones.createMany({
                data: notificacionesData
            });

            return resultado.count;

        } catch (error) {
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

            return res.json({
                ok: true,
                msg: `${resultado.count} notificaciones leídas eliminadas`,
                eliminadas: resultado.count
            });

        } catch (error) {
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

            await prisma.notificaciones.update({
                where: { 
                    notificacion_id: notificacionId
                },
                data: { 
                    leida: true
                }
            });

            return res.json({
                ok: true,
                msg: "Notificación marcada como leída"
            });

        } catch (error) {
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

            await prisma.notificaciones.updateMany({
                where: { 
                    usuario_id: usuarioIdInt, 
                    leida: false,
                    deleted_at: null
                },
                data: { 
                    leida: true
                }
            });

            return res.json({
                ok: true,
                msg: "Todas las notificaciones marcadas como leídas"
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al marcar notificaciones"
            });
        }
    }
}
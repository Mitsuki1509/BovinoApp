import prisma from "../database.js";
import NotificacionController from "./NotificacionController.js";

export default class EventoSanitarioController {

    static async getAll(req, res) {
        try {
            const eventos = await prisma.evento_sanitario.findMany({
                where: { 
                    deleted_at: null 
                },
                include: {
                    animal: {
                        select: {
                            animal_id: true,
                            arete: true,
                        }
                    },
                    tipo_evento: {
                        select: {
                            tipo_evento_id: true,
                            nombre: true
                        }
                    },
                    evento_insumo: {
                        where: {
                            deleted_at: null
                        },
                        include: {
                            insumo: {
                                select: {
                                    insumo_id: true,
                                    nombre: true,
                                    cantidad: true
                                    }
                            }
                        }
                    }
                },
                orderBy: {
                    fecha: 'desc'
                }
            });

            return res.json({
                ok: true,
                data: eventos
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener los eventos sanitarios"
            });
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;

            const eventoSanitarioId = parseInt(id);

            if (isNaN(eventoSanitarioId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID del evento sanitario debe ser un número"
                });
            }

            const eventoSanitario = await prisma.evento_sanitario.findFirst({
                where: { 
                    evento_sanitario_id: eventoSanitarioId,
                    deleted_at: null 
                },
                include: {
                    animal: {
                        select: {
                            animal_id: true,
                            arete: true,
                        }
                    },
                    tipo_evento: {
                        select: {
                            tipo_evento_id: true,
                            nombre: true
                        }
                    },
                    evento_insumo: {
                        where: {
                            deleted_at: null
                        },
                        include: {
                            insumo: {
                                select: {
                                    insumo_id: true,
                                    nombre: true,
                                    cantidad: true
                                }
                            }
                        }
                    }
                }
            });

            if (!eventoSanitario) {
                return res.status(404).json({
                    ok: false,
                    msg: "Evento sanitario no encontrado"
                });
            }

            return res.json({
                ok: true,
                data: eventoSanitario
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener el evento sanitario"
            });
        }
    }

    static async create(req, res) {
        try {
            const rolesPermitidos = ['admin', 'veterinario', 'operario'];
            if (!rolesPermitidos.includes(req.usuario.rol)) {
                return res.status(403).json({
                    ok: false,
                    msg: "No tienes permisos para crear eventos sanitarios"
                });
            }

            const {
                animal_id,
                tipo_evento_id,
                estado,
                diagnostico,
                tratamiento,
                fecha,
                insumos 
            } = req.body;

            if (!animal_id || !tipo_evento_id || !estado || !fecha) {
                return res.status(400).json({
                    ok: false,
                    msg: "Los campos animal_id, tipo_evento_id, estado y fecha son obligatorios"
                });
            }

            const animalId = parseInt(animal_id);
            const tipoEventoId = parseInt(tipo_evento_id);

            if (isNaN(animalId) || isNaN(tipoEventoId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "Los IDs deben ser números válidos"
                });
            }

            const animal = await prisma.animales.findFirst({
                where: { 
                    animal_id: animalId,
                    deleted_at: null 
                }
            });

            if (!animal) {
                return res.status(400).json({
                    ok: false,
                    msg: "El animal especificado no existe"
                });
            }

            const tipoEvento = await prisma.tipo_evento.findFirst({
                where: { 
                    tipo_evento_id: tipoEventoId,
                    deleted_at: null 
                }
            });

            if (!tipoEvento) {
                return res.status(400).json({
                    ok: false,
                    msg: "El tipo de evento especificado no existe"
                });
            }

            if (insumos && Array.isArray(insumos)) {
                for (const insumo of insumos) {
                    if (!insumo.insumo_id || !insumo.cantidad) {
                        return res.status(400).json({
                            ok: false,
                            msg: "Cada insumo debe tener insumo_id y cantidad"
                        });
                    }

                    const insumoId = parseInt(insumo.insumo_id);
                    const cantidad = parseInt(insumo.cantidad);

                    if (isNaN(insumoId) || isNaN(cantidad) || cantidad <= 0) {
                        return res.status(400).json({
                            ok: false,
                            msg: "Los IDs de insumos y las cantidades deben ser números válidos mayores a 0"
                        });
                    }

                    const insumoExistente = await prisma.insumos.findFirst({
                        where: { 
                            insumo_id: insumoId,
                            deleted_at: null 
                        }
                    });

                    if (!insumoExistente) {
                        return res.status(400).json({
                            ok: false,
                            msg: `El insumo con ID ${insumo.insumo_id} no existe`
                        });
                    }

                    if (insumoExistente.cantidad < cantidad) {
                        return res.status(400).json({
                            ok: false,
                            msg: `Stock insuficiente para el insumo ${insumoExistente.nombre}. Stock disponible: ${insumoExistente.cantidad}`
                        });
                    }
                }
            }

            const result = await prisma.$transaction(async (prisma) => {
                const nuevoEvento = await prisma.evento_sanitario.create({
                    data: {
                        animal_id: animalId,
                        tipo_evento_id: tipoEventoId,
                        estado: estado.trim(),
                        diagnostico: diagnostico ? diagnostico.trim() : null,
                        tratamiento: tratamiento ? tratamiento.trim() : null,
                        fecha: new Date(fecha)
                    },
                    include: {
                        animal: {
                            select: {
                                animal_id: true,
                                arete: true,
                            }
                        },
                        tipo_evento: {
                            select: {
                                tipo_evento_id: true,
                                nombre: true
                            }
                        }
                    }
                });

                if (estado === 'Pendiente') {
                    await EventoSanitarioController.crearNotificacionEventoPendiente(nuevoEvento);
                }

                if (insumos && Array.isArray(insumos)) {
                    for (const insumo of insumos) {
                        const insumoId = parseInt(insumo.insumo_id);
                        const cantidad = parseInt(insumo.cantidad);

                        await prisma.evento_insumo.create({
                            data: {
                                evento_sanitario_id: nuevoEvento.evento_sanitario_id,
                                insumo_id: insumoId,
                                cantidad: cantidad
                            }
                        });

                        await prisma.insumos.update({
                            where: { insumo_id: insumoId },
                            data: {
                                cantidad: {
                                    decrement: cantidad
                                }
                            }
                        });
                    }

                    const eventoConInsumos = await prisma.evento_sanitario.findFirst({
                        where: { evento_sanitario_id: nuevoEvento.evento_sanitario_id },
                        include: {
                            animal: {
                                select: {
                                    animal_id: true,
                                    arete: true  
                                }
                            },
                            evento_insumo: {
                                where: { deleted_at: null },
                                include: {
                                    insumo: {
                                        select: {
                                            insumo_id: true,
                                            nombre: true,
                                            cantidad: true
                                        }
                                    }
                                }
                            }
                        }
                    });
                    return eventoConInsumos;
                }

                return nuevoEvento;
            });

            return res.status(201).json({
                ok: true,
                msg: "Evento sanitario registrado exitosamente",
                data: result
            });

        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(400).json({
                    ok: false,
                    msg: "Ya existe un evento sanitario con estos datos"
                });
            }
            
            if (error.code === 'P2003') {
                return res.status(400).json({
                    ok: false,
                    msg: "Error de referencia: Verifique que los IDs proporcionados existen"
                });
            }

            return res.status(500).json({
                ok: false,
                msg: "Error al registrar el evento sanitario",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }


    static async update(req, res) {
    try {
        const rolesPermitidos = ['admin', 'veterinario', 'operario'];
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                ok: false,
                msg: "No tienes permisos para actualizar eventos sanitarios"
            });
        }

        const { id } = req.params;
        const {
            estado
        } = req.body;

        const eventoSanitarioId = parseInt(id);

        if (isNaN(eventoSanitarioId)) {
            return res.status(400).json({
                ok: false,
                msg: "El ID del evento sanitario debe ser un número"
            });
        }

        const eventoSanitarioExistente = await prisma.evento_sanitario.findFirst({
            where: { 
                evento_sanitario_id: eventoSanitarioId,
                deleted_at: null 
            }
        });

        if (!eventoSanitarioExistente) {
            return res.status(404).json({
                ok: false,
                msg: "Evento sanitario no encontrado"
            });
        }

        const updateData = {};
        if (estado !== undefined) updateData.estado = estado.trim();

        if (estado === 'Completado' && eventoSanitarioExistente.estado === 'Pendiente') {
            const fechaEvento = new Date(eventoSanitarioExistente.fecha);
            const ahora = new Date();
            const diferenciaHoras = (fechaEvento - ahora) / (1000 * 60 * 60);
            
            if (diferenciaHoras > 24) {
                const eventoCompleto = await prisma.evento_sanitario.findFirst({
                    where: { 
                        evento_sanitario_id: eventoSanitarioId,
                        deleted_at: null 
                    },
                    include: {
                        animal: {
                            select: {
                                animal_id: true,
                                arete: true
                            }
                        },
                        tipo_evento: {
                            select: {
                                nombre: true
                            }
                        }
                    }
                });
                
                if (eventoCompleto) {
                    await EventoSanitarioController.crearNotificacionCompletado(eventoCompleto);
                }
            }
        }

        const eventoSanitarioActualizado = await prisma.evento_sanitario.update({
            where: { evento_sanitario_id: eventoSanitarioId },
            data: updateData,
            include: {
                animal: {
                    select: {
                        animal_id: true,
                        arete: true
                    }
                },
                tipo_evento: {
                    select: {
                        tipo_evento_id: true,
                        nombre: true
                    }
                },
                evento_insumo: {
                    where: { deleted_at: null },
                    include: {
                        insumo: {
                            select: {
                                insumo_id: true,
                                nombre: true,
                                cantidad: true
                            }
                        }
                    }
                }
            }
        });

        return res.json({
            ok: true,
            msg: "Evento sanitario actualizado exitosamente",
            data: eventoSanitarioActualizado
        });

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                ok: false,
                msg: "Error de duplicación de datos"
            });
        }
        
        if (error.code === 'P2003') {
            return res.status(400).json({
                ok: false,
                msg: "Error de referencia: Verifique que los IDs proporcionados existen"
            });
        }

        return res.status(500).json({
            ok: false,
            msg: "Error al actualizar el evento sanitario",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

    static async delete(req, res) {
        try {
            const rolesPermitidos = ['admin', 'veterinario'];
            if (!rolesPermitidos.includes(req.usuario.rol)) {
                return res.status(403).json({
                    ok: false,
                    msg: "No tienes permisos para eliminar eventos sanitarios"
                });
            }

            const { id } = req.params;

            const eventoSanitarioId = parseInt(id);

            if (isNaN(eventoSanitarioId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID del evento sanitario debe ser un número"
                });
            }

            const eventoSanitario = await prisma.evento_sanitario.findFirst({
                where: { 
                    evento_sanitario_id: eventoSanitarioId,
                    deleted_at: null 
                },
                include: {
                    evento_insumo: {
                        where: { deleted_at: null }
                    }
                }
            });

            if (!eventoSanitario) {
                return res.status(404).json({
                    ok: false,
                    msg: "Evento sanitario no encontrado"
                });
            }

            await prisma.$transaction(async (prisma) => {
                if (eventoSanitario.evento_insumo.length > 0) {
                    for (const eventoInsumo of eventoSanitario.evento_insumo) {
                        await prisma.insumos.update({
                            where: { insumo_id: eventoInsumo.insumo_id },
                            data: {
                                cantidad: {
                                    increment: eventoInsumo.cantidad
                                }
                            }
                        });
                    }

                    await prisma.evento_insumo.updateMany({
                        where: { 
                            evento_sanitario_id: eventoSanitarioId
                        },
                        data: { deleted_at: new Date() }
                    });
                }

                await prisma.evento_sanitario.update({
                    where: { evento_sanitario_id: eventoSanitarioId },
                    data: { deleted_at: new Date() }
                });
            });

            return res.json({
                ok: true,
                msg: "Evento sanitario eliminado exitosamente"
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al eliminar el evento sanitario"
            });
        }
    }

    static async getByAnimalId(req, res) {
        try {
            const { animalId } = req.params;

            const id = parseInt(animalId);

            if (isNaN(id)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID del animal debe ser un número"
                });
            }

            const animal = await prisma.animales.findFirst({
                where: { 
                    animal_id: id,
                    deleted_at: null 
                }
            });

            if (!animal) {
                return res.status(404).json({
                    ok: false,
                    msg: "Animal no encontrado"
                });
            }

            const eventos = await prisma.evento_sanitario.findMany({
                where: { 
                    animal_id: id,
                    deleted_at: null 
                },
                include: {
                    tipo_evento: {
                        select: {
                            tipo_evento_id: true,
                            nombre: true
                        }
                    },
                    evento_insumo: {
                        where: {
                            deleted_at: null
                        },
                        include: {
                            insumo: {
                                select: {
                                    insumo_id: true,
                                    nombre: true,
                                    descripcion: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    fecha: 'desc'
                }
            });

            return res.json({
                ok: true,
                data: eventos
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener los eventos sanitarios del animal"
            });
        }
    }

    static async crearNotificacionEventoPendiente(evento) {
        try {
            if (evento.estado === 'Pendiente') {
                await EventoSanitarioController.crearNotificacionInicial(evento);
                await EventoSanitarioController.programarNotificacionUnDiaAntes(evento);
            }
        } catch (error) {}
    }

    static async crearNotificacionInicial(evento) {
        try {
            const mensaje = `Se programó ${evento.tipo_evento?.nombre || 'evento sanitario'} para ${evento.animal?.arete || 'animal'} con estado: Pendiente`;

            await NotificacionController.crearNotificacionParaRol(
                `Nuevo Evento Sanitario - ${evento.animal?.arete || 'Animal'}`,
                mensaje,
                'info',
                'sanitario',
                ['admin', 'veterinario', 'operario']
            );

        } catch (error) {}
    }

    static async programarNotificacionUnDiaAntes(evento) {
        try {
            const fechaEvento = new Date(evento.fecha);
            const fechaNotificacion = new Date(fechaEvento);
            fechaNotificacion.setDate(fechaEvento.getDate() - 1);
            fechaNotificacion.setHours(8, 0, 0, 0);
            
            const ahora = new Date();
            const diferenciaMs = fechaNotificacion.getTime() - ahora.getTime();
            
            if (diferenciaMs > 0) {
                setTimeout(async () => {
                    const eventoActualizado = await prisma.evento_sanitario.findFirst({
                        where: { 
                            evento_sanitario_id: evento.evento_sanitario_id,
                            deleted_at: null 
                        },
                        include: {
                            animal: {
                                select: {
                                    arete: true
                                }
                            },
                            tipo_evento: {
                                select: {
                                    nombre: true
                                }
                            }
                        }
                    });
                    
                    if (eventoActualizado && eventoActualizado.estado === 'Pendiente') {
                        await EventoSanitarioController.crearNotificacionRecordatorio(eventoActualizado);
                    }
                }, diferenciaMs);
            }
        } catch (error) {}
    }

    static async crearNotificacionRecordatorio(evento) {
        try {
            const fechaEvento = new Date(evento.fecha);
            const mensaje = `Recordatorio: El evento sanitario "${evento.tipo_evento?.nombre || 'Evento'}" para ${evento.animal?.arete || 'animal'} es para mañana (${fechaEvento.toLocaleDateString('es-ES')})`;

            await NotificacionController.crearNotificacionParaRol(
                `Recordatorio Evento - ${evento.animal?.arete || 'Animal'}`,
                mensaje,
                'warning',
                'sanitario',
                ['admin', 'veterinario', 'operario']
            );

        } catch (error) {}
    }

    static async crearNotificacionCompletado(evento) {
        try {
            const mensaje = `${evento.tipo_evento?.nombre || 'Evento'} para ${evento.animal?.arete || 'animal'} ha sido completado antes de la fecha límite`;

            await NotificacionController.crearNotificacionParaRol(
                `Evento Sanitario Completado - ${evento.animal?.arete || 'Animal'}`,
                mensaje,
                'success',
                'sanitario',
                ['admin', 'veterinario', 'operario']
            );
            
        } catch (error) {}
    }
}
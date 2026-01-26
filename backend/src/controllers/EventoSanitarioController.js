import prisma from "../database.js";
import NotificacionController from "./NotificacionController.js";

export default class EventoSanitarioController {
    static STOCK_MINIMO = 10;

    static async generarNumeroEvento() {
        try {
            const totalEventos = await prisma.evento_sanitario.count();
            return `EVT-${(totalEventos + 1).toString().padStart(4, '0')}`;
        } catch (error) {
            const timestamp = Date.now();
            return `EVT-${timestamp.toString().slice(-4)}`;
        }
    }

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
            console.error("Error en getAll:", error);
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener los eventos sanitarios",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;

            const eventoSanitarioId = parseInt(id);

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
            console.error("Error en getById:", error);
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener el evento sanitario",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    static async create(req, res) {
        
        try {
            const {
                animal_id,
                tipo_evento_id,
                diagnostico,
                tratamiento,
                fecha,
                insumos 
            } = req.body;

            if (!animal_id || !tipo_evento_id || !fecha) {
                return res.status(400).json({
                    ok: false,
                    msg: "Los campos animal_id, tipo_evento_id y fecha son obligatorios"
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

            const eventoDuplicado = await prisma.evento_sanitario.findFirst({
                where: {
                    animal_id: animalId,
                    tipo_evento_id: tipoEventoId,
                    fecha: new Date(fecha),
                    deleted_at: null
                }
            });

            if (eventoDuplicado) {
                return res.status(400).json({
                    ok: false,
                    msg: "Ya existe un evento sanitario del mismo tipo para este animal en la fecha seleccionada"
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

                    if (insumoExistente.cantidad <= EventoSanitarioController.STOCK_MINIMO) {
                        return res.status(400).json({
                            ok: false,
                            msg: `No se puede utilizar el insumo "${insumoExistente.nombre}" porque tiene ${insumoExistente.cantidad} unidades (stock mínimo requerido: ${EventoSanitarioController.STOCK_MINIMO})`
                        });
                    }

                    const stockDespuesOperacion = insumoExistente.cantidad - cantidad;
                    if (stockDespuesOperacion < EventoSanitarioController.STOCK_MINIMO) {
                        return res.status(400).json({
                            ok: false,
                            msg: `No se puede utilizar esta cantidad del insumo "${insumoExistente.nombre}". Stock después sería: ${stockDespuesOperacion} unidades (mínimo ${EventoSanitarioController.STOCK_MINIMO} requerido)`
                        });
                    }
                }
            }

            const numeroEvento = await EventoSanitarioController.generarNumeroEvento();

            const result = await prisma.$transaction(async (prisma) => {
                const nuevoEvento = await prisma.evento_sanitario.create({
                    data: {
                        numero_evento: numeroEvento,
                        animal_id: animalId,
                        tipo_evento_id: tipoEventoId,
                        estado: 'Pendiente', 
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

                        const insumoActualizado = await prisma.insumos.update({
                            where: { insumo_id: insumoId },
                            data: {
                                cantidad: {
                                    decrement: cantidad
                                }
                            }
                        });
                        // Notificación si queda por debajo del stock mínimo + margen
                        if (insumoActualizado.cantidad < (EventoSanitarioController.STOCK_MINIMO + 5)) {
                            await EventoSanitarioController.crearNotificacionStockBajo(insumoActualizado);
                        }
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
            console.error("Error en create:", error);
            
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
            const { id } = req.params;
            const {
                estado,
                diagnostico,
                tratamiento
            } = req.body;

            const eventoSanitarioId = parseInt(id);

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
            if (diagnostico !== undefined) updateData.diagnostico = diagnostico.trim();
            if (tratamiento !== undefined) updateData.tratamiento = tratamiento.trim();

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
            console.error("Error en update:", error);
            
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
            const { id } = req.params;

            const eventoSanitarioId = parseInt(id);

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
                msg: `Evento sanitario ${eventoSanitario.numero_evento} eliminado exitosamente`
            });

        } catch (error) {
            console.error("Error en delete:", error);
            return res.status(500).json({
                ok: false,
                msg: "Error al eliminar el evento sanitario",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    static async getByAnimalId(req, res) {
        try {
            const { animalId } = req.params;

            const id = parseInt(animalId);

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
            console.error("Error en getByAnimalId:", error);
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener los eventos sanitarios del animal"
            });
        }
    }

    static async getByNumeroEvento(req, res) {
        try {
            const { numero } = req.params;
            
            if (!numero) {
                return res.status(400).json({
                    ok: false,
                    msg: "El número de evento es requerido"
                });
            }

            const evento = await prisma.evento_sanitario.findFirst({
                where: {
                    numero_evento: numero,
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
            
            if(!evento){
                return res.status(404).json({
                    ok: false,
                    msg: "Evento sanitario no encontrado"
                });
            }
            
            return res.json({
                ok: true,
                data: evento
            });

        } catch (error) {
            console.error("Error en getByNumeroEvento:", error);
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener el evento sanitario"
            });
        }
    }

    static async checkDuplicado(req, res) {
        try {
            const { animal_id, tipo_evento_id, fecha } = req.query;

            if (!animal_id || !tipo_evento_id || !fecha) {
                return res.status(400).json({
                    ok: false,
                    msg: "Los parámetros animal_id, tipo_evento_id y fecha son requeridos"
                });
            }

            const eventoExistente = await prisma.evento_sanitario.findFirst({
                where: {
                    animal_id: parseInt(animal_id),
                    tipo_evento_id: parseInt(tipo_evento_id),
                    fecha: new Date(fecha),
                    deleted_at: null
                }
            });

            return res.json({ 
                ok: true,
                duplicado: !!eventoExistente 
            });

        } catch (error) {
            console.error("Error en checkDuplicado:", error);
            return res.status(500).json({
                ok: false,
                msg: "Error verificando duplicado"
            });
        }
    }

    static async crearNotificacionStockBajo(insumo) {
        try {
            const fechaActual = new Date();
            const dia = String(fechaActual.getDate()).padStart(2, '0');
            const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
            const año = String(fechaActual.getFullYear()).slice(-2);
            const fechaFormateada = `${dia}/${mes}/${año}`;

            const mensaje = `El insumo "${insumo.nombre}" tiene stock bajo. 
                Cantidad actual: ${insumo.cantidad} ${insumo.unidad?.nombre || 'unidades'}. 
                Stock mínimo: ${EventoSanitarioController.STOCK_MINIMO} ${insumo.unidad?.nombre || 'unidades'}.
                Fecha: ${fechaFormateada}`;

            await NotificacionController.crearNotificacionParaRol(
                `Stock Bajo - ${insumo.nombre}`,
                mensaje,
                'warning',
                'inventario',
                ['admin', 'contable']
            );


        } catch (error) {
            console.error("Error creando notificación de stock bajo:", error);
        }
    }

}
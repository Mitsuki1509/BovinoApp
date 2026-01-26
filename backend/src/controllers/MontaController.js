import prisma from "../database.js";
import NotificacionController from "./NotificacionController.js";

const MAX_TIMEOUT = 2 ** 31 - 1;

function safeSetTimeout(fn, ms) {
    if (ms <= 0) return setTimeout(fn, 0);
    if (ms <= MAX_TIMEOUT) return setTimeout(fn, ms);
    return setTimeout(() => safeSetTimeout(fn, ms - MAX_TIMEOUT), MAX_TIMEOUT);
}

export default class MontaController {

    static formatearFecha(fecha) {
        try {
            const date = new Date(fecha);
            const dia = String(date.getDate()).padStart(2, '0');
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const año = String(date.getFullYear()).slice(-2);
            return `${dia}/${mes}/${año}`;
        } catch (error) {
            const now = new Date();
            const dia = String(now.getDate()).padStart(2, '0');
            const mes = String(now.getMonth() + 1).padStart(2, '0');
            const año = String(now.getFullYear()).slice(-2);
            return `${dia}/${mes}/${año}`;
        }
    }

    static formatearFechaCompleta(fecha) {
        try {
            const date = new Date(fecha);
            const dia = String(date.getUTCDate()).padStart(2, '0');
            const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
            const año = date.getUTCFullYear();
            return `${dia}/${mes}/${año}`;
        } catch (error) {
            const now = new Date();
            const dia = String(now.getDate()).padStart(2, '0');
            const mes = String(now.getMonth() + 1).padStart(2, '0');
            const año = now.getFullYear();
            return `${dia}/${mes}/${año}`;
        }
    }

    static async generarNumeroMonta(animalHembraId) {
        try {
            const ultimaMonta = await prisma.evento_monta.findFirst({
                where: {
                    animal_hembra_id: animalHembraId,
                    deleted_at: null
                },
                orderBy: {
                    monta_id: 'desc'
                },
                select: {
                    numero_monta: true
                }
            });

            let siguienteNumero = 1;
            
            if (ultimaMonta && ultimaMonta.numero_monta) {
                if (typeof ultimaMonta.numero_monta === 'string') {
                    const match = ultimaMonta.numero_monta.match(/MONTA-(\d+)/);
                    if (match && match[1]) {
                        siguienteNumero = parseInt(match[1]) + 1;
                    } else {
                        const totalMontasHembra = await prisma.evento_monta.count({
                            where: { 
                                animal_hembra_id: animalHembraId,
                                deleted_at: null 
                            }
                        });
                        siguienteNumero = totalMontasHembra + 1;
                    }
                } else if (typeof ultimaMonta.numero_monta === 'number') {
                    siguienteNumero = ultimaMonta.numero_monta + 1;
                }
            }

            return `MONTA-${siguienteNumero}`;
        } catch (error) {
            const totalMontasHembra = await prisma.evento_monta.count({
                where: { 
                    animal_hembra_id: animalHembraId,
                    deleted_at: null 
                }
            });
            return `MONTA-${totalMontasHembra + 1}`;
        }
    }

    static async getAll(req, res) {
        try {
            const montas = await prisma.evento_monta.findMany({
                where: { 
                    deleted_at: null 
                },
                include: {
                    hembra: {
                        select: {
                            animal_id: true,
                            arete: true,
                            sexo: true,
                            fecha_nacimiento: true
                        }
                    },
                    macho: {
                        select: {
                            animal_id: true,
                            arete: true,
                            sexo: true,
                            fecha_nacimiento: true
                        }
                    },
                    tipo_evento: {
                        select: {
                            tipo_evento_id: true,
                            nombre: true
                        }
                    },
                    diagnosticos: {
                        where: {
                            deleted_at: null
                        },
                        select: {
                            prenez_id: true,
                            metodo: true,
                            resultado: true,
                            fecha_probable_parto: true
                        }
                    }
                },
                orderBy: {
                    fecha: 'desc'
                }
            });

            return res.json({
                ok: true,
                data: montas
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener las montas"
            });
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;

            const montaId = parseInt(id);

            if (isNaN(montaId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El id de la monta debe ser un número"
                });
            }

            const monta = await prisma.evento_monta.findFirst({
                where: { 
                    monta_id: montaId,
                    deleted_at: null 
                },
                include: {
                    hembra: {
                        select: {
                            animal_id: true,
                            arete: true,
                            sexo: true,
                            fecha_nacimiento: true,
                            lote: {
                                select: {
                                    lote_id: true,
                                    descripcion: true
                                }
                            }
                        }
                    },
                    macho: {
                        select: {
                            animal_id: true,
                            arete: true,
                            sexo: true,
                            fecha_nacimiento: true,
                            lote: {
                                select: {
                                    lote_id: true,
                                    descripcion: true
                                }
                            }
                        }
                    },
                    tipo_evento: {
                        select: {
                            tipo_evento_id: true,
                            nombre: true
                        }
                    },
                    diagnosticos: {
                        where: {
                            deleted_at: null
                        },
                        include: {
                            partos: {
                                where: {
                                    deleted_at: null
                                },
                                select: {
                                    evento_id: true,
                                    fecha: true,
                                    descripcion: true
                                }
                            }
                        }
                    }
                }
            });

            if (!monta) {
                return res.status(404).json({
                    ok: false,
                    msg: "Monta no encontrada"
                });
            }

            return res.json({
                ok: true,
                data: monta
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener la monta"
            });
        }
    }

    static async create(req, res) {
        try {
            const rolesPermitidos = ['admin', 'veterinario', 'operario'];
            if (!rolesPermitidos.includes(req.usuario.rol)) {
                return res.status(403).json({
                    ok: false,
                    msg: "No tienes permisos para crear montas"
                });
            }

            const {
                animal_hembra_id,
                animal_macho_id,
                tipo_evento_id,
                descripcion,
                estado,
                fecha
            } = req.body;

            if (!animal_hembra_id || !fecha) {
                return res.status(400).json({
                    ok: false,
                    msg: "Los campos animal_hembra_id y fecha son obligatorios"
                });
            }

            const fechaMonta = new Date(fecha);
            if (isNaN(fechaMonta.getTime())) {
                return res.status(400).json({
                    ok: false,
                    msg: "La fecha proporcionada no es válida"
                });
            }

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
         
            const hembraId = parseInt(animal_hembra_id);
            const machoId = animal_macho_id ? parseInt(animal_macho_id) : null;

            if (isNaN(hembraId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID de la hembra debe ser un número válido"
                });
            }

            const hembra = await prisma.animales.findFirst({
                where: { 
                    animal_id: hembraId,
                    deleted_at: null 
                }
            });

            if (!hembra) {
                return res.status(400).json({
                    ok: false,
                    msg: "La hembra especificada no existe"
                });
            }

            if (hembra.sexo !== 'H') {
                return res.status(400).json({
                    ok: false,
                    msg: "El animal hembra debe ser de sexo femenino"
                });
            }

            let macho = null;
            if (machoId) {
                macho = await prisma.animales.findFirst({
                    where: { 
                        animal_id: machoId,
                        deleted_at: null 
                    }
                });

                if (!macho) {
                    return res.status(400).json({
                        ok: false,
                        msg: "El macho especificado no existe"
                    });
                }

                if (macho.sexo !== 'M') {
                    return res.status(400).json({
                        ok: false,
                        msg: "El animal macho debe ser de sexo masculino"
                    });
                }
            }

            const numeroMonta = await MontaController.generarNumeroMonta(hembraId);

            const puedeRegistrarMonta = await MontaController.validarRegistroMonta(hembraId, numeroMonta);
            
            if (!puedeRegistrarMonta.puede) {
                return res.status(400).json({
                    ok: false,
                    msg: puedeRegistrarMonta.mensaje
                });
            }

            const montaExistente = await prisma.evento_monta.findFirst({
                where: {
                    animal_hembra_id: hembraId,
                    numero_monta: numeroMonta,
                    deleted_at: null
                }
            });

            if (montaExistente) {
                return res.status(400).json({
                    ok: false,
                    msg: `Ya existe una monta #${numeroMonta} registrada para esta hembra`
                });
            }

            const nuevaMonta = await prisma.evento_monta.create({
                data: {
                    animal_hembra_id: hembraId,
                    animal_macho_id: machoId,
                    tipo_evento_id: tipo_evento_id ? parseInt(tipo_evento_id) : null,
                    numero_monta: numeroMonta,
                    descripcion: descripcion ? descripcion.trim() : null,
                    estado: estado !== undefined ? Boolean(estado) : false,
                    fecha: fechaMonta
                },
                include: {
                    hembra: {
                        select: {
                            animal_id: true,
                            arete: true,
                            sexo: true
                        }
                    },
                    macho: {
                        select: {
                            animal_id: true,
                            arete: true,
                            sexo: true
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

            if (!nuevaMonta.estado) {
                await MontaController.crearNotificacionMontaPendiente(nuevaMonta);
            }

            return res.status(201).json({
                ok: true,
                msg: "Monta registrada exitosamente",
                data: nuevaMonta
            });

        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(400).json({
                    ok: false,
                    msg: "Ya existe una monta con este número para esta hembra"
                });
            }

            return res.status(500).json({
                ok: false,
                msg: "Error al registrar la monta",
                error: error.message
            });
        }
    }

    static async validarRegistroMonta(animalHembraId, numeroMonta) {
        try {
            const numeroMatch = numeroMonta.match(/MONTA-(\d+)/);
            const numero = numeroMatch ? parseInt(numeroMatch[1]) : 1;

            if (numero === 1) {
                return { puede: true, mensaje: null };
            }

            const numeroMontaAnterior = `MONTA-${numero - 1}`;
            
            const montaAnterior = await prisma.evento_monta.findFirst({
                where: {
                    animal_hembra_id: animalHembraId,
                    numero_monta: numeroMontaAnterior,
                    deleted_at: null
                },
                include: {
                    diagnosticos: {
                        where: { deleted_at: null },
                        orderBy: { prenez_id: 'desc' },
                        take: 1
                    }
                }
            });

            if (!montaAnterior) {
                return { 
                    puede: false, 
                    mensaje: `No existe la monta ${numeroMontaAnterior}. Debe registrar las montas en orden secuencial.` 
                };
            }

            if (montaAnterior.diagnosticos.length === 0) {
                return { 
                    puede: false, 
                    mensaje: `La monta ${numeroMontaAnterior} no tiene diagnóstico registrado. Debe diagnosticar antes de registrar una nueva monta.` 
                };
            }

            const ultimoDiagnostico = montaAnterior.diagnosticos[0];

            if (ultimoDiagnostico.resultado === true) {
                const partoExistente = await prisma.evento_parto.findFirst({
                    where: {
                        prenez_id: ultimoDiagnostico.prenez_id,
                        deleted_at: null
                    }
                });

                if (!partoExistente) {
                    return { 
                        puede: false, 
                        mensaje: `La monta ${numeroMontaAnterior} tiene diagnóstico positivo pero no ha tenido parto. Espere el parto antes de registrar una nueva monta.` 
                    };
                }
            }

            return { puede: true, mensaje: null };

        } catch (error) {
            return { puede: false, mensaje: "Error en validación" };
        }
    }

    static async update(req, res) {
        try {
            const rolesPermitidos = ['admin', 'veterinario', 'operario'];
            if (!rolesPermitidos.includes(req.usuario.rol)) {
                return res.status(403).json({
                    ok: false,
                    msg: "No tienes permisos para actualizar montas"
                });
            }

            const { id } = req.params;
            const {
                animal_hembra_id,
                animal_macho_id,
                tipo_evento_id,
                descripcion,
                estado,
                fecha
            } = req.body;

            const montaId = parseInt(id);

            if (isNaN(montaId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El id de la monta debe ser un número"
                });
            }

            const montaExistente = await prisma.evento_monta.findFirst({
                where: { 
                    monta_id: montaId,
                    deleted_at: null 
                }
            });

            if (!montaExistente) {
                return res.status(404).json({
                    ok: false,
                    msg: "Monta no encontrada"
                });
            }

            if (estado !== undefined && estado === null) {
                return res.status(400).json({
                    ok: false,
                    msg: "El estado es requerido"
                });
            }

            let fechaMonta = null;
            if (fecha !== undefined) {
                if (!fecha) {
                    return res.status(400).json({
                        ok: false,
                        msg: "La fecha de la monta es requerida"
                    });
                }

                fechaMonta = new Date(fecha);
              
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                if (fechaMonta > hoy) {
                    return res.status(400).json({
                        ok: false,
                        msg: "La fecha de la monta no puede ser futura"
                    });
                }
            }

            if (animal_hembra_id !== undefined) {
                if (!animal_hembra_id || animal_hembra_id === 'null' || animal_hembra_id === '') {
                    return res.status(400).json({
                        ok: false,
                        msg: "El animal hembra es requerido"
                    });
                }

                const hembraId = parseInt(animal_hembra_id);
                if (hembraId !== montaExistente.animal_hembra_id) {
                    const hembra = await prisma.animales.findFirst({
                        where: { 
                            animal_id: hembraId,
                            deleted_at: null 
                        }
                    });

                    if (!hembra) {
                        return res.status(400).json({
                            ok: false,
                            msg: "El animal hembra especificado no existe"
                        });
                    }

                    if (hembra.sexo !== 'H') {
                        return res.status(400).json({
                            ok: false,
                            msg: "El animal hembra debe ser de sexo femenino"
                        });
                    }
                }
            }

            let machoId = null;
            if (animal_macho_id !== undefined) {
                if (animal_macho_id === '' || animal_macho_id === 'null') {
                    machoId = null;
                } else if (animal_macho_id) {
                    machoId = parseInt(animal_macho_id);
                    const macho = await prisma.animales.findFirst({
                        where: { 
                            animal_id: machoId,
                            deleted_at: null 
                        }
                    });

                    if (!macho) {
                        return res.status(400).json({
                            ok: false,
                            msg: "El animal macho especificado no existe"
                        });
                    }

                    if (macho.sexo !== 'M') {
                        return res.status(400).json({
                            ok: false,
                            msg: "El animal macho debe ser de sexo masculino"
                        });
                    }
                }
            }

            if (tipo_evento_id !== undefined) {
                const tipoEventoId = parseInt(tipo_evento_id);
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
            }

            const updateData = {};

            if (animal_hembra_id !== undefined) updateData.animal_hembra_id = parseInt(animal_hembra_id);
            if (animal_macho_id !== undefined) updateData.animal_macho_id = machoId;
            if (tipo_evento_id !== undefined) updateData.tipo_evento_id = parseInt(tipo_evento_id);
            if (descripcion !== undefined) updateData.descripcion = descripcion ? descripcion.trim() : null;
            if (estado !== undefined) updateData.estado = Boolean(estado);
            if (fecha !== undefined) updateData.fecha = fechaMonta;

            const montaActualizada = await prisma.evento_monta.update({
                where: { monta_id: montaId },
                data: updateData,
                include: {
                    hembra: {
                        select: {
                            animal_id: true,
                            arete: true,
                            sexo: true
                        }
                    },
                    macho: {
                        select: {
                            animal_id: true,
                            arete: true,
                            sexo: true
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

            if (estado === true && !montaExistente.estado) {
                await MontaController.crearNotificacionMontaCompletada(montaActualizada);
            }

            return res.json({
                ok: true,
                msg: "Monta actualizada exitosamente",
                data: montaActualizada
            });

        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(400).json({
                    ok: false,
                    msg: "Ya existe una monta con este número"
                });
            }

            return res.status(500).json({
                ok: false,
                msg: "Error al actualizar la monta",
                error: error.message
            });
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;

            const montaId = parseInt(id);

            if (isNaN(montaId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El id de la monta debe ser un número"
                });
            }

            const monta = await prisma.evento_monta.findFirst({
                where: { 
                    monta_id: montaId,
                    deleted_at: null 
                },
                include: {
                    diagnosticos: {
                        where: {
                            deleted_at: null
                        }
                    }
                }
            });

            if (!monta) {
                return res.status(404).json({
                    ok: false,
                    msg: "Monta no encontrada"
                });
            }

            if (monta.diagnosticos.length > 0) {
                return res.status(400).json({
                    ok: false,
                    msg: "No se puede eliminar la monta porque tiene diagnósticos asociados"
                });
            }

            await prisma.evento_monta.update({
                where: { monta_id: montaId },
                data: { deleted_at: new Date() }
            });

            return res.json({
                ok: true,
                msg: "Monta eliminada exitosamente"
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al eliminar la monta"
            });
        }
    }

    static async crearNotificacionMontaPendiente(monta) {
        try {
            if (!monta.estado) {
                await MontaController.crearNotificacionInicialMonta(monta);
                await MontaController.programarNotificacionUnDiaAntesMonta(monta);
            }
        } catch (error) {
            console.error("Error en crearNotificacionMontaPendiente:", error);
        }
    }

    static async crearNotificacionInicialMonta(monta) {
        try {
            const fechaFormateada = MontaController.formatearFecha(new Date());
            const fechaMontaFormateada = MontaController.formatearFechaCompleta(monta.fecha);

            const fechaMonta = new Date(monta.fecha);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            fechaMonta.setHours(0, 0, 0, 0);
            
            const diasFaltantes = Math.ceil((fechaMonta.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

            const machoInfo = monta.macho ? ` con macho: ${monta.macho.arete}` : '';

            const mensaje = `NUEVA MONTA PROGRAMADA
Monta: ${monta.numero_monta}
Hembra: ${monta.hembra?.arete || 'N/A'}${machoInfo}
Fecha de monta programada: ${fechaMontaFormateada}
Días faltantes: ${diasFaltantes} días
Estado: Pendiente
Fecha de notificación: ${fechaFormateada}`;

            await NotificacionController.crearNotificacionParaRol(
                `Monta Programada - ${monta.hembra?.arete || 'Hembra'}`,
                mensaje,
                'info',
                'monta',
                ['admin', 'veterinario', 'operario']
            );

        } catch (error) {
            console.error("Error en crearNotificacionInicialMonta:", error);
        }
    }

    static async programarNotificacionUnDiaAntesMonta(monta) {
        try {
            const fechaMonta = new Date(monta.fecha);
            const fechaNotificacion = new Date(fechaMonta);
            fechaNotificacion.setDate(fechaMonta.getDate() - 1);
            fechaNotificacion.setHours(8, 0, 0, 0);
            
            const ahora = new Date();
            const diferenciaMs = fechaNotificacion.getTime() - ahora.getTime();
            
            if (diferenciaMs > 0) {
                safeSetTimeout(async () => {
                    const montaActualizada = await prisma.evento_monta.findFirst({
                        where: { 
                            monta_id: monta.monta_id,
                            deleted_at: null 
                        },
                        include: {
                            hembra: {
                                select: {
                                    arete: true
                                }
                            }
                        }
                    });
                    
                    if (montaActualizada && !montaActualizada.estado) {
                        await MontaController.crearNotificacionRecordatorioMonta(montaActualizada);
                    }
                }, diferenciaMs);
            }
        } catch (error) {
            console.error("Error en programarNotificacionUnDiaAntesMonta:", error);
        }
    }

    static async crearNotificacionRecordatorioMonta(monta) {
        try {
            const fechaFormateada = MontaController.formatearFecha(new Date());
            const fechaMontaFormateada = MontaController.formatearFechaCompleta(monta.fecha);

            const mensaje = `RECORDATORIO: MONTA PROGRAMADA PARA MAÑANA
Monta: ${monta.numero_monta}
Hembra: ${monta.hembra?.arete || 'N/A'}
Fecha de monta programada: ${fechaMontaFormateada} (mañana)
Estado: Pendiente
Fecha de notificación: ${fechaFormateada}`;

            await NotificacionController.crearNotificacionParaRol(
                `Recordatorio Monta - ${monta.hembra?.arete || 'Hembra'}`,
                mensaje,
                'warning',
                'monta',
                ['admin', 'veterinario', 'operario']
            );

        } catch (error) {
            console.error("Error en crearNotificacionRecordatorioMonta:", error);
        }
    }

    static async crearNotificacionMontaCompletada(monta) {
        try {
            const fechaFormateada = MontaController.formatearFecha(new Date());

            const mensaje = `MONTA COMPLETADA EXITOSAMENTE
Monta: ${monta.numero_monta}
Hembra: ${monta.hembra?.arete || 'N/A'}
Estado: Completada
Fecha de notificación: ${fechaFormateada}`;

            await NotificacionController.crearNotificacionParaRol(
                `Monta Completada - ${monta.hembra?.arete || 'Hembra'}`,
                mensaje,
                'success',
                'monta',
                ['admin', 'veterinario', 'operario']
            );

        } catch (error) {
            console.error("Error en crearNotificacionMontaCompletada:", error);
        }
    }
}
import prisma from "../database.js";
import NotificacionController from "./NotificacionController.js";

const MAX_TIMEOUT = 2 ** 31 - 1;

function safeSetTimeout(fn, ms) {
    if (ms <= 0) return setTimeout(fn, 0);
    if (ms <= MAX_TIMEOUT) return setTimeout(fn, ms);
    return setTimeout(() => safeSetTimeout(fn, ms - MAX_TIMEOUT), MAX_TIMEOUT);
}

export default class DiagnosticoPrenezController {

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

    static async getAll(req, res) {
        try {
            const diagnosticos = await prisma.diagnostico_prenez.findMany({
                where: { 
                    deleted_at: null 
                },
                include: {
                    monta: {
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
                                    nombre: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    prenez_id: 'desc'
                }
            });

            return res.json({
                ok: true,
                data: diagnosticos
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener los diagnósticos de preñez"
            });
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const diagnosticoId = parseInt(id);

            const diagnostico = await prisma.diagnostico_prenez.findFirst({
                where: { 
                    prenez_id: diagnosticoId,
                    deleted_at: null 
                },
                include: {
                    monta: {
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
                                    sexo: true
                                }
                            },
                            tipo_evento: {
                                select: {
                                    nombre: true
                                }
                            }
                        }
                    }
                }
            });

            if (!diagnostico) {
                return res.status(404).json({
                    ok: false,
                    msg: "Diagnóstico no encontrado"
                });
            }

            return res.json({
                ok: true,
                data: diagnostico
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener el diagnóstico"
            });
        }
    }

    static async getByMontaId(req, res) {
        try {
            const { montaId } = req.params;
            const idMonta = parseInt(montaId);

            const diagnosticos = await prisma.diagnostico_prenez.findMany({
                where: { 
                    monta_id: idMonta,
                    deleted_at: null 
                },
                include: {
                    monta: {
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
                            }
                        }
                    }
                },
                orderBy: {
                    prenez_id: 'desc'
                }
            });

            return res.json({
                ok: true,
                data: diagnosticos
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener los diagnósticos de la monta"
            });
        }
    }

    static async create(req, res) {
        try {
            const rolesPermitidos = ['admin', 'veterinario'];
            if (!rolesPermitidos.includes(req.usuario.rol)) {
                return res.status(403).json({
                    ok: false,
                    msg: "No tienes permisos para crear diagnósticos"
                });
            }

            const {
                monta_id,
                metodo,
                resultado,
                fecha_probable_parto
            } = req.body;

            if (!monta_id) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID de la monta es requerido"
                });
            }

            const montaId = parseInt(monta_id);

            const monta = await prisma.evento_monta.findFirst({
                where: { 
                    monta_id: montaId,
                    deleted_at: null 
                },
                include: {
                    diagnosticos: {
                        where: { deleted_at: null }
                    },
                    hembra: {
                        select: {
                            arete: true,
                        }
                    }
                }
            });

            if (!monta) {
                return res.status(400).json({
                    ok: false,
                    msg: "La monta especificada no existe"
                });
            }

            if (monta.diagnosticos && monta.diagnosticos.length > 0) {
                return res.status(400).json({
                    ok: false,
                    msg: "Esta monta ya tiene un diagnóstico registrado. No se puede registrar otro diagnóstico para la misma monta."
                });
            }

            const resultadoBool = resultado === true || resultado === 'true';
            
            if (resultadoBool === true && !fecha_probable_parto) {
                return res.status(400).json({
                    ok: false,
                    msg: "La fecha probable de parto es requerida cuando el resultado es positivo"
                });
            }

            if (resultadoBool === false && fecha_probable_parto) {
                return res.status(400).json({
                    ok: false,
                    msg: "No se debe proporcionar fecha probable de parto cuando el resultado es negativo"
                });
            }

            let fechaParto = null;
            if (fecha_probable_parto) {
                fechaParto = new Date(fecha_probable_parto);
                
                if (isNaN(fechaParto.getTime())) {
                    return res.status(400).json({
                        ok: false,
                        msg: "La fecha probable de parto no es válida"
                    });
                }
            }

            const nuevoDiagnostico = await prisma.diagnostico_prenez.create({
                data: {
                    monta_id: montaId,
                    metodo: metodo ? metodo.trim() : null,
                    resultado: resultadoBool,
                    fecha_probable_parto: fechaParto
                },
                include: {
                    monta: {
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
                            }
                        }
                    }
                }
            });

            if (nuevoDiagnostico.resultado === true) {
                await DiagnosticoPrenezController.crearNotificacionDiagnosticoPositivo(nuevoDiagnostico, monta.hembra);
            } else {
                await DiagnosticoPrenezController.crearNotificacionDiagnosticoNegativo(nuevoDiagnostico, monta.hembra);
            }

            return res.status(201).json({
                ok: true,
                msg: "Diagnóstico registrado exitosamente",
                data: nuevoDiagnostico
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al registrar el diagnóstico",
                error: error.message
            });
        }
    }

    static async update(req, res) {
        try {
            const rolesPermitidos = ['admin', 'veterinario'];
            if (!rolesPermitidos.includes(req.usuario.rol)) {
                return res.status(403).json({
                    ok: false,
                    msg: "No tienes permisos para actualizar diagnósticos"
                });
            }

            const { id } = req.params;
            const {
                monta_id,
                metodo,
                resultado,
                fecha_probable_parto
            } = req.body;

            const diagnosticoId = parseInt(id);
            if (isNaN(diagnosticoId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID del diagnóstico debe ser un número válido"
                });
            }

            const diagnosticoExistente = await prisma.diagnostico_prenez.findFirst({
                where: { 
                    prenez_id: diagnosticoId,
                    deleted_at: null 
                },
                include: {
                    monta: {
                        include: {
                            hembra: {
                                select: {
                                    arete: true,
                                }
                            }
                        }
                    }
                }
            });

            if (!diagnosticoExistente) {
                return res.status(404).json({
                    ok: false,
                    msg: "Diagnóstico no encontrado"
                });
            }

            if (monta_id !== undefined) {
                const montaId = parseInt(monta_id);
                if (isNaN(montaId)) {
                    return res.status(400).json({
                        ok: false,
                        msg: "El ID de la monta debe ser un número válido"
                    });
                }

                const montaExistente = await prisma.evento_monta.findFirst({
                    where: { 
                        monta_id: montaId,
                        deleted_at: null 
                    }
                });

                if (!montaExistente) {
                    return res.status(400).json({
                        ok: false,
                        msg: "La monta especificada no existe"
                    });
                }
            }

            let fechaParto = diagnosticoExistente.fecha_probable_parto;
            if (fecha_probable_parto !== undefined) {
                if (fecha_probable_parto === null || fecha_probable_parto === '') {
                    fechaParto = null;
                } else {
                    fechaParto = new Date(fecha_probable_parto);
                    if (isNaN(fechaParto.getTime())) {
                        return res.status(400).json({
                            ok: false,
                            msg: "La fecha probable de parto no es válida"
                        });
                    }
                }
            }

            const resultadoFinal = resultado !== undefined ? Boolean(resultado) : diagnosticoExistente.resultado;
            
            if (resultadoFinal === true && !fechaParto) {
                return res.status(400).json({
                    ok: false,
                    msg: "La fecha probable de parto es requerida cuando el resultado es positivo"
                });
            }

            if (resultadoFinal === false && fechaParto) {
                return res.status(400).json({
                    ok: false,
                    msg: "No se debe proporcionar fecha probable de parto cuando el resultado es negativo"
                });
            }

            const updateData = {};

            if (monta_id !== undefined) updateData.monta_id = parseInt(monta_id);
            if (metodo !== undefined) updateData.metodo = metodo.trim();
            if (resultado !== undefined) updateData.resultado = Boolean(resultado);
            if (fecha_probable_parto !== undefined) updateData.fecha_probable_parto = fechaParto;

            const diagnosticoActualizado = await prisma.diagnostico_prenez.update({
                where: { prenez_id: diagnosticoId },
                data: updateData,
                include: {
                    monta: {
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
                                    nombre: true
                                }
                            }
                        }
                    }
                }
            });

            if (resultado !== undefined && resultadoFinal !== diagnosticoExistente.resultado) {
                if (resultadoFinal === true) {
                    await DiagnosticoPrenezController.crearNotificacionDiagnosticoPositivo(diagnosticoActualizado, diagnosticoExistente.monta.hembra);
                } else {
                    await DiagnosticoPrenezController.crearNotificacionDiagnosticoNegativo(diagnosticoActualizado, diagnosticoExistente.monta.hembra);
                }
            }

            return res.json({
                ok: true,
                msg: "Diagnóstico actualizado exitosamente",
                data: diagnosticoActualizado
            });

        } catch (error) {
            if (error.code === 'P2003') {
                return res.status(400).json({
                    ok: false,
                    msg: "La monta especificada no existe"
                });
            }

            return res.status(500).json({
                ok: false,
                msg: "Error al actualizar el diagnóstico",
                error: error.message
            });
        }
    }

    static async delete(req, res) {
        try {
            if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'veterinario'&& req.usuario.rol !== 'operario') {
                return res.status(403).json({
                    ok: false,
                    msg: "No tienes permisos para eliminar diagnósticos"
                });
            }

            const { id } = req.params;
            const diagnosticoId = parseInt(id);

            if (isNaN(diagnosticoId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID del diagnóstico debe ser un número válido"
                });
            }

            const diagnostico = await prisma.diagnostico_prenez.findFirst({
                where: { 
                    prenez_id: diagnosticoId,
                    deleted_at: null 
                },
                include: {
                    partos: {
                        where: {
                            deleted_at: null
                        }
                    }
                }
            });

            if (!diagnostico) {
                return res.status(404).json({
                    ok: false,
                    msg: "Diagnóstico no encontrado"
                });
            }

            if (diagnostico.partos && diagnostico.partos.length > 0) {
                return res.status(400).json({
                    ok: false,
                    msg: "No se puede eliminar el diagnóstico porque tiene partos asociados"
                });
            }

            await prisma.diagnostico_prenez.update({
                where: { prenez_id: diagnosticoId },
                data: { deleted_at: new Date() }
            });

            return res.json({
                ok: true,
                msg: "Diagnóstico eliminado exitosamente"
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al eliminar el diagnóstico"
            });
        }
    }

    static async crearNotificacionDiagnosticoPositivo(diagnostico, hembra) {
        try {
            const fechaParto = new Date(diagnostico.fecha_probable_parto);
            const hoy = new Date();
            
            const diffTime = fechaParto - hoy;
            const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            await DiagnosticoPrenezController.crearNotificacionInicialParto(diagnostico, hembra, diffDias);
            await DiagnosticoPrenezController.programarNotificacionPartoProximo(diagnostico, hembra);

        } catch (error) {
            console.error("Error en crearNotificacionDiagnosticoPositivo:", error);
        }
    }

    static async crearNotificacionInicialParto(diagnostico, hembra, diffDias) {
        try {
            const fechaFormateada = DiagnosticoPrenezController.formatearFecha(new Date());
            const fechaPartoFormateada = DiagnosticoPrenezController.formatearFechaCompleta(diagnostico.fecha_probable_parto);

            const mensaje = `DIAGNÓSTICO POSITIVO
Hembra: ${hembra?.arete || 'N/A'}
Estado: Preñada
Método: ${diagnostico.metodo || 'N/A'}
Parto probable: ${fechaPartoFormateada} (en ${diffDias} días)`;

            await NotificacionController.crearNotificacionParaRol(
                `Diagnóstico Positivo - ${hembra?.arete || 'Hembra'}`,
                mensaje,
                'success',
                'parto',
                ['admin', 'veterinario', 'operario']
            );

        } catch (error) {
            console.error("Error en crearNotificacionInicialParto:", error);
        }
    }

    static async programarNotificacionPartoProximo(diagnostico, hembra) {
        try {
            const fechaParto = new Date(diagnostico.fecha_probable_parto);
            const fechaNotificacion = new Date(fechaParto);
            fechaNotificacion.setDate(fechaParto.getDate() - 7);
            fechaNotificacion.setHours(8, 0, 0, 0);
            
            const ahora = new Date();
            const diferenciaMs = fechaNotificacion.getTime() - ahora.getTime();
            
            if (diferenciaMs > 0) {
                safeSetTimeout(async () => {
                    const diagnosticoActualizado = await prisma.diagnostico_prenez.findFirst({
                        where: { 
                            prenez_id: diagnostico.prenez_id,
                            deleted_at: null 
                        },
                        include: {
                            partos: {
                                where: {
                                    deleted_at: null
                                }
                            }
                        }
                    });
                    
                    if (diagnosticoActualizado && diagnosticoActualizado.partos.length === 0) {
                        await DiagnosticoPrenezController.crearNotificacionRecordatorioParto(diagnosticoActualizado, hembra);
                    }
                }, diferenciaMs);
            } else {
                const diagnosticoActualizado = await prisma.diagnostico_prenez.findFirst({
                    where: { 
                        prenez_id: diagnostico.prenez_id,
                        deleted_at: null 
                    },
                    include: {
                        partos: {
                            where: {
                                deleted_at: null
                            }
                        }
                    }
                });
                
                if (diagnosticoActualizado && diagnosticoActualizado.partos.length === 0) {
                    await DiagnosticoPrenezController.crearNotificacionRecordatorioParto(diagnosticoActualizado, hembra);
                }
            }
        } catch (error) {
            console.error("Error en programarNotificacionPartoProximo:", error);
        }
    }

    static async crearNotificacionRecordatorioParto(diagnostico, hembra) {
        try {
            const fechaFormateada = DiagnosticoPrenezController.formatearFecha(new Date());
            const fechaPartoFormateada = DiagnosticoPrenezController.formatearFechaCompleta(diagnostico.fecha_probable_parto);

            const ahora = new Date();
            const diferenciaMs = new Date(diagnostico.fecha_probable_parto).getTime() - ahora.getTime();
            const diferenciaDias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

            let mensaje = '';
            let tipo = 'warning';
            let titulo = '';

            if (diferenciaDias <= 0) {
                titulo = `PARTO INMINENTE - ${hembra?.arete || 'Hembra'}`;
                mensaje = `PARTO INMINENTE
Hembra: ${hembra?.arete || 'N/A'}
Parto estimado: HOY (${fechaPartoFormateada})
Acción: Preparar área de parto inmediatamente
Fecha de notificación: ${fechaFormateada}`;
                tipo = 'error';
            } else if (diferenciaDias <= 3) {
                titulo = `Parto Muy Próximo - ${hembra?.arete || 'Hembra'}`;
                mensaje = `PARTO MUY PRÓXIMO
Hembra: ${hembra?.arete || 'N/A'}
Parto estimado: en ${diferenciaDias} días (${fechaPartoFormateada})
Acción: Preparar área de parto
Fecha de notificación: ${fechaFormateada}`;
                tipo = 'error';
            } else if (diferenciaDias <= 7) {
                titulo = `Recordatorio Parto - ${hembra?.arete || 'Hembra'}`;
                mensaje = `RECORDATORIO PARTO
Hembra: ${hembra?.arete || 'N/A'}
Parto estimado: en ${diferenciaDias} días (${fechaPartoFormateada})
Fecha de notificación: ${fechaFormateada}`;
                tipo = 'warning';
            } else {
                titulo = `Recordatorio Parto - ${hembra?.arete || 'Hembra'}`;
                mensaje = `RECORDATORIO PARTO
Hembra: ${hembra?.arete || 'N/A'}
Parto estimado: en ${diferenciaDias} días (${fechaPartoFormateada})
Fecha de notificación: ${fechaFormateada}`;
            }

            await NotificacionController.crearNotificacionParaRol(
                titulo,
                mensaje,
                tipo,
                'parto',
                ['admin', 'veterinario', 'operario']
            );

        } catch (error) {
            console.error("Error en crearNotificacionRecordatorioParto:", error);
        }
    }

    static async crearNotificacionDiagnosticoNegativo(diagnostico, hembra) {
        try {
            const mensaje = `DIAGNÓSTICO NEGATIVO
Hembra: ${hembra?.arete || 'N/A'}
Resultado: Negativo (No preñada)
Método: ${diagnostico.metodo || 'N/A'}
Observación: La hembra no está preñada`;

            await NotificacionController.crearNotificacionParaRol(
                `Diagnóstico Negativo - ${hembra?.arete || 'Hembra'}`,
                mensaje,
                'info',
                'parto',
                ['admin', 'veterinario', 'operario']
            );

        } catch (error) {
            console.error("Error en crearNotificacionDiagnosticoNegativo:", error);
        }
    }

    static async verificarPartosProximos() {
        try {
            const hoy = new Date();
            const unaSemanaDespues = new Date();
            unaSemanaDespues.setDate(hoy.getDate() + 7);

            const diagnosticosProximos = await prisma.diagnostico_prenez.findMany({
                where: {
                    resultado: true,
                    fecha_probable_parto: {
                        gte: hoy,
                        lte: unaSemanaDespues
                    },
                    deleted_at: null
                },
                include: {
                    monta: {
                        include: {
                            hembra: {
                                select: {
                                    arete: true
                                }
                            }
                        }
                    },
                    partos: {
                        where: {
                            deleted_at: null
                        }
                    }
                }
            });

            for (const diagnostico of diagnosticosProximos) {
                if (diagnostico.partos.length === 0) {
                    await DiagnosticoPrenezController.crearNotificacionRecordatorioParto(diagnostico, diagnostico.monta.hembra);
                }
            }

        } catch (error) {
            console.error("Error en verificarPartosProximos:", error);
        }
    }
}
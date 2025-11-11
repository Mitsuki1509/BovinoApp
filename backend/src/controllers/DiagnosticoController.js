import prisma from "../database.js"

export default class DiagnosticoPrenezController {

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

            if (isNaN(idMonta)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID de la monta debe ser un número válido"
                });
            }

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

            if (isNaN(montaId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID de la monta debe ser un número válido"
                });
            }

            const monta = await prisma.evento_monta.findFirst({
                where: { 
                    monta_id: montaId,
                    deleted_at: null 
                },
                include: {
                    diagnosticos: {
                        where: { deleted_at: null }
                    }
                }
            });

            if (!monta) {
                return res.status(400).json({
                    ok: false,
                    msg: "La monta especificada no existe"
                });
            }

            if (monta.diagnosticos.length > 0) {
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

            const nuevoDiagnostico = await prisma.diagnostico_prenez.create({
                data: {
                    monta_id: montaId,
                    metodo: metodo ? metodo.trim() : null,
                    resultado: resultadoBool,
                    fecha_probable_parto: fecha_probable_parto ? new Date(fecha_probable_parto) : null
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
            if (req.usuario.rol !== 'admin') {
                return res.status(403).json({
                    ok: false,
                    msg: "Solo los administradores pueden eliminar diagnósticos"
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

    static async search(req, res) {
        try {
            const { query } = req.query;

            if (!query || query.trim() === '') {
                return res.status(400).json({
                    ok: false,
                    msg: "El parámetro de búsqueda es requerido"
                });
            }

            const searchQuery = query.trim();
            const isNumeric = !isNaN(searchQuery) && !isNaN(parseFloat(searchQuery));

            const diagnosticos = await prisma.diagnostico_prenez.findMany({
                where: {
                    AND: [
                        { deleted_at: null },
                        {
                            OR: [
                                {
                                    metodo: {
                                        contains: searchQuery,
                                        mode: 'insensitive'
                                    }
                                },
                                {
                                    monta: {
                                        hembra: {
                                            arete: {
                                                contains: searchQuery,
                                                mode: 'insensitive'
                                            }
                                        }
                                    }
                                },
                                {
                                    monta: {
                                        macho: {
                                            arete: {
                                                contains: searchQuery,
                                                mode: 'insensitive'
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    ]
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
                msg: "Error al buscar diagnósticos"
            });
        }
    }

    static async getDiagnosticosPositivos(req, res) {
        try {
            const diagnosticos = await prisma.diagnostico_prenez.findMany({
                where: { 
                    resultado: true,
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
                            }
                        }
                    },
                    partos: {
                        where: {
                            deleted_at: null
                        },
                        select: {
                            evento_id: true,
                            fecha: true
                        }
                    }
                },
                orderBy: {
                    fecha_probable_parto: 'asc'
                }
            });

            return res.json({
                ok: true,
                data: diagnosticos
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener los diagnósticos positivos"
            });
        }
    }

    static async getDiagnosticosPorFecha(req, res) {
        try {
            const { fecha } = req.query;
            
            if (!fecha) {
                return res.status(400).json({
                    ok: false,
                    msg: "La fecha es requerida"
                });
            }

            const fechaConsulta = new Date(fecha);
            if (isNaN(fechaConsulta.getTime())) {
                return res.status(400).json({
                    ok: false,
                    msg: "La fecha no es válida"
                });
            }

            const diagnosticos = await prisma.diagnostico_prenez.findMany({
                where: { 
                    fecha_probable_parto: fechaConsulta,
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
                msg: "Error al obtener los diagnósticos por fecha"
            });
        }
    }
}
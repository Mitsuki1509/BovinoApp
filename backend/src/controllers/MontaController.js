import prisma from "../database.js";

export default class MontaController {

    static async generarNumeroMonta(animalHembraId) {
        try {
            const ultimaMonta = await prisma.evento_monta.findFirst({
                where: {
                    animal_hembra_id: animalHembraId,
                    deleted_at: null
                },
                orderBy: {
                    numero_monta: 'desc'
                },
                select: {
                    numero_monta: true
                }
            });

            let siguienteNumero = 1;
            
            if (ultimaMonta && ultimaMonta.numero_monta) {
                siguienteNumero = ultimaMonta.numero_monta + 1;
            }

            return siguienteNumero;
        } catch (error) {
            const totalMontasHembra = await prisma.evento_monta.count({
                where: { 
                    animal_hembra_id: animalHembraId,
                    deleted_at: null 
                }
            });
            return totalMontasHembra + 1;
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
                    monta_id: 'desc'
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
            const rolesPermitidos = ['admin', 'veterinario'];
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
                estado
            } = req.body;

            if (!animal_hembra_id) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID de la hembra es requerido"
                });
            }

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
                    estado: estado !== undefined ? Boolean(estado) : true
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
            const montaAnterior = await prisma.evento_monta.findFirst({
                where: {
                    animal_hembra_id: animalHembraId,
                    numero_monta: numeroMonta - 1,
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

            if (numeroMonta === 1) {
                return { puede: true, mensaje: null };
            }

            if (!montaAnterior) {
                return { 
                    puede: false, 
                    mensaje: `No existe la monta #${numeroMonta - 1}. Debe registrar las montas en orden secuencial.` 
                };
            }

            if (montaAnterior.diagnosticos.length === 0) {
                return { 
                    puede: false, 
                    mensaje: `La monta ${numeroMonta - 1} no tiene diagnóstico registrado. Debe diagnosticar antes de registrar una nueva monta.` 
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
                        mensaje: `La monta ${numeroMonta - 1} tiene diagnóstico positivo pero no ha tenido parto. Espere el parto antes de registrar una nueva monta.` 
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
                estado
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
            if (req.usuario.rol !== 'admin') {
                return res.status(403).json({
                    ok: false,
                    msg: "Solo los administradores pueden eliminar montas"
                });
            }

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

            const montas = await prisma.evento_monta.findMany({
                where: {
                    AND: [
                        { deleted_at: null },
                        {
                            OR: [
                                ...(isNumeric ? [{ numero_monta: parseInt(searchQuery) }] : []),
                                {
                                    hembra: {
                                        arete: {
                                            contains: searchQuery,
                                            mode: 'insensitive'
                                        }
                                    }
                                },
                                {
                                    macho: {
                                        arete: {
                                            contains: searchQuery,
                                            mode: 'insensitive'
                                        }
                                    }
                                },
                                {
                                    descripcion: {
                                        contains: searchQuery,
                                        mode: 'insensitive'
                                    }
                                }
                            ]
                        }
                    ]
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
                },
                orderBy: {
                    monta_id: 'desc'
                }
            });

            return res.json({
                ok: true,
                data: montas
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al buscar montas"
            });
        }
    }
}
import prisma from "../database.js"

export default class PartoController {

    static async getAll(req, res) {
        try {
            const partos = await prisma.evento_parto.findMany({
                where: { 
                    deleted_at: null 
                },
                include: {
                    tipo_evento: {
                        select: {
                            tipo_evento_id: true,
                            nombre: true
                        }
                    },
                    prenez: {
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
                    }
                },
                orderBy: {
                    evento_id: 'desc'
                }
            });

            return res.json({
                ok: true,
                data: partos
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener los partos"
            });
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const partoId = parseInt(id);

            const parto = await prisma.evento_parto.findFirst({
                where: { 
                    evento_id: partoId,
                    deleted_at: null 
                },
                include: {
                    tipo_evento: {
                        select: {
                            tipo_evento_id: true,
                            nombre: true
                        }
                    },
                    prenez: {
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
                            }
                        }
                    }
                }
            });

            if (!parto) {
                return res.status(404).json({
                    ok: false,
                    msg: "Parto no encontrado"
                });
            }

            return res.json({
                ok: true,
                data: parto
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener el parto"
            });
        }
    }

    static async getByDiagnosticoId(req, res) {
        try {
            const { diagnosticoId } = req.params;
            const idDiagnostico = parseInt(diagnosticoId);

            const partos = await prisma.evento_parto.findMany({
                where: { 
                    prenez_id: idDiagnostico,
                    deleted_at: null 
                },
                include: {
                    tipo_evento: {
                        select: {
                            tipo_evento_id: true,
                            nombre: true
                        }
                    }
                },
                orderBy: {
                    evento_id: 'desc'
                }
            });

            return res.json({
                ok: true,
                data: partos
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener los partos del diagnóstico"
            });
        }
    }

    static async create(req, res) {
        try {
            const rolesPermitidos = ['admin', 'veterinario','operario'];
            if (!rolesPermitidos.includes(req.usuario.rol)) {
                return res.status(403).json({
                    ok: false,
                    msg: "No tienes permisos para crear partos"
                });
            }

            const {
                prenez_id,
                tipo_evento_id,
                descripcion,
                fecha
            } = req.body;

            if (!prenez_id) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID del diagnóstico es requerido"
                });
            }

            if (!tipo_evento_id) {
                return res.status(400).json({
                    ok: false,
                    msg: "El tipo de evento es requerido"
                });
            }

            if (!fecha) {
                return res.status(400).json({
                    ok: false,
                    msg: "La fecha del parto es requerida"
                });
            }

            const diagnosticoId = parseInt(prenez_id);
            if (isNaN(diagnosticoId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID del diagnóstico debe ser un número válido"
                });
            }

            const tipoEventoId = parseInt(tipo_evento_id);
            if (isNaN(tipoEventoId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID del tipo de evento debe ser un número válido"
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
                            hembra: true
                        }
                    },
                    partos: {
                        where: { deleted_at: null }
                    }
                }
            });

            if (!diagnosticoExistente) {
                return res.status(400).json({
                    ok: false,
                    msg: "El diagnóstico especificado no existe"
                });
            }

            if (!diagnosticoExistente.resultado) {
                return res.status(400).json({
                    ok: false,
                    msg: "No se puede registrar parto para un diagnóstico negativo"
                });
            }

            if (diagnosticoExistente.partos.length > 0) {
                return res.status(400).json({
                    ok: false,
                    msg: "Ya existe un parto registrado para este diagnóstico. No se puede registrar otro parto para la misma monta."
                });
            }

            const tipoEventoExistente = await prisma.tipo_evento.findFirst({
                where: { 
                    tipo_evento_id: tipoEventoId,
                    deleted_at: null 
                }
            });

            if (!tipoEventoExistente) {
                return res.status(400).json({
                    ok: false,
                    msg: "El tipo de evento especificado no existe"
                });
            }

            const fechaParto = new Date(fecha);
            if (isNaN(fechaParto.getTime())) {
                return res.status(400).json({
                    ok: false,
                    msg: "La fecha del parto no es válida"
                });
            }

            const hoy = new Date();
            const fechaMaxima = new Date();
            fechaMaxima.setDate(fechaMaxima.getDate() + 2);
            
            if (fechaParto > fechaMaxima) {
                return res.status(400).json({
                    ok: false,
                    msg: "La fecha del parto no puede ser futura"
                });
            }

            const nuevoParto = await prisma.evento_parto.create({
                data: {
                    prenez_id: diagnosticoId,
                    tipo_evento_id: tipoEventoId,
                    descripcion: descripcion ? descripcion.trim() : null,
                    fecha: fechaParto
                },
                include: {
                    tipo_evento: {
                        select: {
                            tipo_evento_id: true,
                            nombre: true
                        }
                    },
                    prenez: {
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
                    }
                }
            });

            return res.status(201).json({
                ok: true,
                msg: "Parto registrado exitosamente",
                data: nuevoParto
            });

        } catch (error) {
            if (error.code === 'P2003') {
                return res.status(400).json({
                    ok: false,
                    msg: "El diagnóstico o tipo de evento especificado no existe"
                });
            }

            return res.status(500).json({
                ok: false,
                msg: "Error al registrar el parto",
                error: error.message
            });
        }
    }

    static async update(req, res) {
        try {
            const rolesPermitidos = ['admin', 'veterinario','operario'];
            if (!rolesPermitidos.includes(req.usuario.rol)) {
                return res.status(403).json({
                    ok: false,
                    msg: "No tienes permisos para actualizar partos"
                });
            }

            const { id } = req.params;
            const {
                prenez_id,
                tipo_evento_id,
                descripcion,
                fecha
            } = req.body;

            const partoId = parseInt(id);
            if (isNaN(partoId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID del parto debe ser un número válido"
                });
            }

            const partoExistente = await prisma.evento_parto.findFirst({
                where: { 
                    evento_id: partoId,
                    deleted_at: null 
                }
            });

            if (!partoExistente) {
                return res.status(404).json({
                    ok: false,
                    msg: "Parto no encontrado"
                });
            }

            if (prenez_id !== undefined) {
                const diagnosticoId = parseInt(prenez_id);
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
                    return res.status(400).json({
                        ok: false,
                        msg: "El diagnóstico especificado no existe"
                    });
                }

                if (!diagnosticoExistente.resultado) {
                    return res.status(400).json({
                        ok: false,
                        msg: "No se puede asignar un diagnóstico negativo a un parto"
                    });
                }

                const partoExistenteParaDiagnostico = await prisma.evento_parto.findFirst({
                    where: {
                        prenez_id: diagnosticoId,
                        evento_id: { not: partoId },
                        deleted_at: null
                    }
                });

                if (partoExistenteParaDiagnostico) {
                    return res.status(400).json({
                        ok: false,
                        msg: "Ya existe un parto registrado para este diagnóstico"
                    });
                }
            }

            if (tipo_evento_id !== undefined) {
                const tipoEventoId = parseInt(tipo_evento_id);


                const tipoEventoExistente = await prisma.tipo_evento.findFirst({
                    where: { 
                        tipo_evento_id: tipoEventoId,
                        deleted_at: null 
                    }
                });

                if (!tipoEventoExistente) {
                    return res.status(400).json({
                        ok: false,
                        msg: "El tipo de evento especificado no existe"
                    });
                }
            }

            let fechaParto = partoExistente.fecha;
            if (fecha !== undefined) {
                fechaParto = new Date(fecha);
                if (isNaN(fechaParto.getTime())) {
                    return res.status(400).json({
                        ok: false,
                        msg: "La fecha del parto no es válida"
                    });
                }

                const hoy = new Date();
                const fechaMaxima = new Date();
                fechaMaxima.setDate(fechaMaxima.getDate() + 2);
                
                if (fechaParto > fechaMaxima) {
                    return res.status(400).json({
                        ok: false,
                        msg: "La fecha del parto no puede ser futura"
                    });
                }
            }

            const updateData = {};

            if (prenez_id !== undefined) updateData.prenez_id = parseInt(prenez_id);
            if (tipo_evento_id !== undefined) updateData.tipo_evento_id = parseInt(tipo_evento_id);
            if (descripcion !== undefined) updateData.descripcion = descripcion ? descripcion.trim() : null;
            if (fecha !== undefined) updateData.fecha = fechaParto;

            const partoActualizado = await prisma.evento_parto.update({
                where: { evento_id: partoId },
                data: updateData,
                include: {
                    tipo_evento: {
                        select: {
                            tipo_evento_id: true,
                            nombre: true
                        }
                    },
                    prenez: {
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
                    }
                }
            });

            return res.json({
                ok: true,
                msg: "Parto actualizado exitosamente",
                data: partoActualizado
            });

        } catch (error) {
            if (error.code === 'P2003') {
                return res.status(400).json({
                    ok: false,
                    msg: "El diagnóstico o tipo de evento especificado no existe"
                });
            }

            return res.status(500).json({
                ok: false,
                msg: "Error al actualizar el parto",
                error: error.message
            });
        }
    }

    static async delete(req, res) {
        try {
            if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'veterinario' && req.usuario.rol !== 'operario') {
                return res.status(403).json({
                    ok: false,
                    msg: "Solo los administradores pueden eliminar partos"
                });
            }

            const { id } = req.params;
            const partoId = parseInt(id);

            if (isNaN(partoId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID del parto debe ser un número válido"
                });
            }

            const parto = await prisma.evento_parto.findFirst({
                where: { 
                    evento_id: partoId,
                    deleted_at: null 
                }
            });

            if (!parto) {
                return res.status(404).json({
                    ok: false,
                    msg: "Parto no encontrado"
                });
            }

            await prisma.evento_parto.update({
                where: { evento_id: partoId },
                data: { deleted_at: new Date() }
            });

            return res.json({
                ok: true,
                msg: "Parto eliminado exitosamente"
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al eliminar el parto"
            });
        }
    }

}
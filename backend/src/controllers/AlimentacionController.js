import prisma from "../database.js";

export default class AlimentacionController {

    static async getAll(req, res) {
        try {
            const alimentaciones = await prisma.alimentacion.findMany({
                where: { 
                    deleted_at: null 
                },
                include: {
                    animal: {
                        select: {
                            animal_id: true,
                            arete: true
                        }
                    },
                    insumo: {
                        select: {
                            insumo_id: true,
                            nombre: true,
                            cantidad: true,
                            unidad: {
                                select: {
                                    nombre: true
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
                data: alimentaciones
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener las alimentaciones"
            });
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;

            const alimentacionId = parseInt(id);

            if (isNaN(alimentacionId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID de la alimentación debe ser un número"
                });
            }

            const alimentacion = await prisma.alimentacion.findFirst({
                where: { 
                    alimentacion_id: alimentacionId,
                    deleted_at: null 
                },
                include: {
                    animal: {
                        select: {
                            animal_id: true,
                            arete: true
                        }
                    },
                    insumo: {
                        select: {
                            insumo_id: true,
                            cantidad: true,
                            unidad: {
                                select: {
                                    nombre: true
                                }
                            }
                        }
                    }
                }
            });

            if (!alimentacion) {
                return res.status(404).json({
                    ok: false,
                    msg: "Alimentación no encontrada"
                });
            }

            return res.json({
                ok: true,
                data: alimentacion
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener la alimentación"
            });
        }
    }

    static async create(req, res) {
    try {
        const rolesPermitidos = ['admin', 'veterinario', 'operario'];
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                ok: false,
                msg: "No tienes permisos para crear alimentaciones"
            });
        }

        const {
            animal_id,
            insumo_id,
            cantidad,
            fecha
        } = req.body;

        if (!animal_id || !insumo_id || !cantidad || !fecha) {
            return res.status(400).json({
                ok: false,
                msg: "Los campos animal_id, insumo_id, cantidad y fecha son obligatorios"
            });
        }

        const animalId = parseInt(animal_id);
        const insumoId = parseInt(insumo_id);
        const cantidadInt = parseInt(cantidad);

        if (isNaN(animalId) || isNaN(insumoId) || isNaN(cantidadInt)) {
            return res.status(400).json({
                ok: false,
                msg: "Los IDs y la cantidad deben ser números válidos"
            });
        }

        if (cantidadInt <= 0) {
            return res.status(400).json({
                ok: false,
                msg: "La cantidad debe ser mayor a 0"
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

        const insumo = await prisma.insumos.findFirst({
            where: { 
                insumo_id: insumoId,
                deleted_at: null 
            }
        });

        if (!insumo) {
            return res.status(400).json({
                ok: false,
                msg: "El insumo especificado no existe"
            });
        }

        if (insumo.cantidad < cantidadInt) {
            return res.status(400).json({
                ok: false,
                msg: `Stock insuficiente para el insumo ${insumo.nombre}. Stock disponible: ${insumo.cantidad}`
            });
        }

        const result = await prisma.$transaction(async (prisma) => {
            const nuevaAlimentacion = await prisma.alimentacion.create({
                data: {
                    animal_id: animalId,
                    insumo_id: insumoId,
                    cantidad: cantidadInt,
                    fecha: new Date(fecha)
                },
                include: {
                    animal: {
                        select: {
                            animal_id: true,
                            arete: true
                        }
                    },
                    insumo: {
                        select: {
                            insumo_id: true,
                            nombre: true,
                            cantidad: true,
                            unidad: {
                                select: {
                                    nombre: true
                                }
                            }
                        }
                    }
                }
            });

            await prisma.insumos.update({
                where: { insumo_id: insumoId },
                data: {
                    cantidad: {
                        decrement: cantidadInt
                    }
                }
            });

            return nuevaAlimentacion;
        });

       

        return res.status(201).json({
            ok: true,
            msg: "Alimentación registrada exitosamente",
            data: result
        });

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                ok: false,
                msg: "Ya existe una alimentación con estos datos"
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
            msg: "Error al registrar la alimentación",
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
                    msg: "No tienes permisos para eliminar alimentaciones"
                });
            }

            const { id } = req.params;

            const alimentacionId = parseInt(id);

            if (isNaN(alimentacionId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID de la alimentación debe ser un número"
                });
            }

            const alimentacion = await prisma.alimentacion.findFirst({
                where: { 
                    alimentacion_id: alimentacionId,
                    deleted_at: null 
                }
            });

            if (!alimentacion) {
                return res.status(404).json({
                    ok: false,
                    msg: "Alimentación no encontrada"
                });
            }

            await prisma.$transaction(async (prisma) => {
                await prisma.insumos.update({
                    where: { insumo_id: alimentacion.insumo_id },
                    data: {
                        cantidad: {
                            increment: alimentacion.cantidad
                        }
                    }
                });

                await prisma.alimentacion.update({
                    where: { alimentacion_id: alimentacionId },
                    data: { deleted_at: new Date() }
                });
            });

            return res.json({
                ok: true,
                msg: "Alimentación eliminada exitosamente"
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al eliminar la alimentación"
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

            const alimentaciones = await prisma.alimentacion.findMany({
                where: { 
                    animal_id: id,
                    deleted_at: null 
                },
                include: {
                    insumo: {
                        select: {
                            insumo_id: true,
                            nombre: true,
                            descripcion: true,
                            cantidad: true,
                            unidad: {
                                select: {
                                    nombre: true
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
                data: alimentaciones
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener las alimentaciones del animal"
            });
        }
    }

    static async getByInsumoId(req, res) {
        try {
            const { insumoId } = req.params;

            const id = parseInt(insumoId);

            if (isNaN(id)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID del insumo debe ser un número"
                });
            }

            const insumo = await prisma.insumos.findFirst({
                where: { 
                    insumo_id: id,
                    deleted_at: null 
                }
            });

            if (!insumo) {
                return res.status(404).json({
                    ok: false,
                    msg: "Insumo no encontrado"
                });
            }

            const alimentaciones = await prisma.alimentacion.findMany({
                where: { 
                    insumo_id: id,
                    deleted_at: null 
                },
                include: {
                    animal: {
                        select: {
                            animal_id: true,
                            arete: true
                        }
                    }
                },
                orderBy: {
                    fecha: 'desc'
                }
            });

            return res.json({
                ok: true,
                data: alimentaciones
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener las alimentaciones del insumo"
            });
        }
    }
}
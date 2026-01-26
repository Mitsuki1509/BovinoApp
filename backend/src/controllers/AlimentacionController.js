import prisma from "../database.js";
import NotificacionController from "./NotificacionController.js";

export default class AlimentacionController {
    static STOCK_MINIMO = 10;

    static async generarNumeroAlimentacion() {
        try {
            const totalAlimentaciones = await prisma.alimentacion.count();
            return `ALIM-${(totalAlimentaciones + 1).toString().padStart(4, '0')}`;
        } catch (error) {
            const timestamp = Date.now();
            return `ALIM-${timestamp.toString().slice(-4)}`;
        }
    }

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
                cantidad
            } = req.body;

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
            // Validación 1: Verificar que el insumo tenga stock suficiente
            if (insumo.cantidad < cantidadInt) {
                return res.status(400).json({
                    ok: false,
                    msg: `Stock insuficiente para el insumo ${insumo.nombre}. Stock disponible: ${insumo.cantidad}`
                });
            }

            // Validación 2: Verificar que el insumo tenga más del stock mínimo para poder usarlo
            if (insumo.cantidad <= AlimentacionController.STOCK_MINIMO) {
                return res.status(400).json({
                    ok: false,
                    msg: `No se puede utilizar el insumo "${insumo.nombre}" porque tiene ${insumo.cantidad} unidades (stock mínimo requerido: ${AlimentacionController.STOCK_MINIMO})`
                });
            }

            // Validación 3: Verificar que después de la operación no quede por debajo del stock mínimo
            const stockDespuesOperacion = insumo.cantidad - cantidadInt;
            if (stockDespuesOperacion < AlimentacionController.STOCK_MINIMO) {
                return res.status(400).json({
                    ok: false,
                    msg: `No se puede utilizar esta cantidad. Stock después sería: ${stockDespuesOperacion} unidades (mínimo ${AlimentacionController.STOCK_MINIMO} requerido)`
                });
            }

            const numeroAlimentacion = await AlimentacionController.generarNumeroAlimentacion();

            const result = await prisma.$transaction(async (prisma) => {
                const nuevaAlimentacion = await prisma.alimentacion.create({
                    data: {
                        numero_alimentacion: numeroAlimentacion,
                        animal_id: animalId,
                        insumo_id: insumoId,
                        cantidad: cantidadInt,
                        fecha: new Date() 
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

                const insumoActualizado = await prisma.insumos.update({
                    where: { insumo_id: insumoId },
                    data: {
                        cantidad: {
                            decrement: cantidadInt
                        }
                    }
                });


                // Notificación si queda por debajo del stock mínimo + margen
                if (insumoActualizado.cantidad < (AlimentacionController.STOCK_MINIMO + 5)) {
                    await AlimentacionController.crearNotificacionStockBajo(insumoActualizado);
                }

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

    static async crearNotificacionStockBajo(insumo) {
        try {
            const fechaActual = new Date();
            const dia = String(fechaActual.getDate()).padStart(2, '0');
            const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
            const año = String(fechaActual.getFullYear()).slice(-2);
            const fechaFormateada = `${dia}/${mes}/${año}`;

            const mensaje = `El insumo "${insumo.nombre}" tiene stock bajo. 
            Cantidad actual: ${insumo.cantidad} ${insumo.unidad?.nombre || 'unidades'}. 
            Stock mínimo: ${AlimentacionController.STOCK_MINIMO} ${insumo.unidad?.nombre || 'unidades'}.
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

    static async delete(req, res) {
        try {
            const rolesPermitidos = ['admin', 'veterinario','operario'];
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
                msg: `Alimentación ${alimentacion.numero_alimentacion} eliminada exitosamente`
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

    static async getByNumeroAlimentacion(req, res) {
        try {
            const { numero } = req.params;
            
            if (!numero) {
                return res.status(400).json({
                    ok: false,
                    msg: "El número de alimentación es requerido"
                });
            }

            const alimentacion = await prisma.alimentacion.findFirst({
                where: {
                    numero_alimentacion: numero,
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
                }
            });
            
            if(!alimentacion){
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
}
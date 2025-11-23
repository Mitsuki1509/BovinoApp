import prisma from "../database.js";

export default class CompraAnimalController {

    static async generarNumeroCompra() {
        try {
            const totalCompras = await prisma.compras_animales.count();
            return `COMPRA-${(totalCompras + 1).toString().padStart(4, '0')}`;
        } catch (error) {
            const timestamp = Date.now();
            return `COMPRA-${timestamp.toString().slice(-4)}`;
        }
    }

    static calcularTotal(detalles) {
        return detalles.reduce((total, detalle) => {
            return total + parseFloat(detalle.precio || 0);
        }, 0);
    }

    static async getAll(req, res) {
        try {
            const compras = await prisma.compras_animales.findMany({
                where: { 
                    deleted_at: null 
                },
                include: {
                    proveedor: {
                        select: {
                            proveedor_id: true,
                            nombre_compañia: true,
                            nombre_contacto: true,
                        }
                    },
                    detalles: {
                        where: {
                            deleted_at: null
                        },
                        include: {
                            animal: {
                                select: {
                                    animal_id: true,
                                    arete: true,
                                    raza: {
                                        select: {
                                            nombre: true
                                        }
                                    },
                                    sexo: true,
                                    fecha_nacimiento: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    compra_animal_id: 'desc'
                }
            });

            const comprasConTotal = compras.map(compra => ({
                ...compra,
                total: CompraAnimalController.calcularTotal(compra.detalles)
            }));

            return res.json({
                ok: true,
                data: comprasConTotal
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener las compras de animales"
            });
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const compraId = parseInt(id);

            const compra = await prisma.compras_animales.findFirst({
                where: {
                    compra_animal_id: compraId,
                    deleted_at: null
                },
                include: {
                    proveedor: {
                        select: {
                            proveedor_id: true,
                            nombre_compañia: true,
                            nombre_contacto: true,
                        }
                    },
                    detalles: {
                        where: {
                            deleted_at: null
                        },
                        include: {
                            animal: {
                                select: {
                                    animal_id: true,
                                    arete: true,
                                    raza: {
                                        select: {
                                            nombre: true
                                        }
                                    },
                                    sexo: true,
                                    fecha_nacimiento: true,
                                    lote: {
                                        select: {
                                            codigo: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            
            if(!compra){
                return res.status(404).json({
                    ok: false,
                    msg: "Compra no encontrada"
                });
            }

            const compraConTotal = {
                ...compra,
                total: CompraAnimalController.calcularTotal(compra.detalles)
            };
            
            return res.json({
                ok: true,
                data: compraConTotal
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener la compra"
            });
        }
    }

    static async create(req, res) {
        try {
            if(req.usuario.rol !== 'admin' && req.usuario.rol !== 'contable'){
                return res.status(403).json({
                    ok: false,
                    msg: "No tienes permisos para crear una compra. Solo administradores y contables pueden realizar esta acción."
                });
            }

            const { proveedor_id, fecha, detalles } = req.body;

            if (!proveedor_id || !fecha || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
                return res.status(400).json({
                    ok: false,
                    msg: "El proveedor, la fecha y al menos un detalle son requeridos"
                });
            }

            const proveedorId = parseInt(proveedor_id);
            const fechaCompra = new Date(fecha);

            const proveedorExistente = await prisma.proveedores.findUnique({
                where: {
                    proveedor_id: proveedorId,
                    deleted_at: null
                }
            });

            if (!proveedorExistente) {
                return res.status(400).json({
                    ok: false,
                    msg: "El proveedor especificado no existe"
                });
            }

            for (const detalle of detalles) {
                if (!detalle.animal_id || !detalle.precio) {
                    return res.status(400).json({
                        ok: false,
                        msg: "Cada detalle debe tener animal_id y precio"
                    });
                }

                const animalId = parseInt(detalle.animal_id);
                const precio = parseFloat(detalle.precio);

                if (isNaN(animalId) || isNaN(precio)) {
                    return res.status(400).json({
                        ok: false,
                        msg: "Los datos del detalle deben ser números válidos"
                    });
                }

                if (precio <= 0) {
                    return res.status(400).json({
                        ok: false,
                        msg: "El precio debe ser mayor a 0"
                    });
                }

                const animalExistente = await prisma.animales.findFirst({
                    where: {
                        animal_id: animalId,
                        deleted_at: null
                    }
                });

                if (!animalExistente) {
                    return res.status(400).json({
                        ok: false,
                        msg: `El animal con ID ${animalId} no existe`
                    });
                }

                const animalEnCompra = await prisma.detalle_compras_animales.findFirst({
                    where: {
                        animal_id: animalId,
                        deleted_at: null
                    }
                });

                if (animalEnCompra) {
                    return res.status(400).json({
                        ok: false,
                        msg: `El animal con ID ${animalId} ya está registrado en otra compra`
                    });
                }
            }

            const numeroCompra = await CompraAnimalController.generarNumeroCompra();

            const result = await prisma.$transaction(async (prisma) => {
                const compra = await prisma.compras_animales.create({
                    data: {
                        numero_compra: numeroCompra,
                        proveedor_id: proveedorId,
                        fecha: fechaCompra
                    }
                });

                for (const detalle of detalles) {
                    const animalId = parseInt(detalle.animal_id);
                    const precio = parseFloat(detalle.precio);

                    await prisma.detalle_compras_animales.create({
                        data: {
                            compra_animal_id: compra.compra_animal_id,
                            animal_id: animalId,
                            precio: precio,
                            observaciones: detalle.observaciones || null
                        }
                    });
                }

                const compraCompleta = await prisma.compras_animales.findFirst({
                    where: {
                        compra_animal_id: compra.compra_animal_id
                    },
                    include: {
                        proveedor: {
                            select: {
                                proveedor_id: true,
                                nombre_compañia: true,
                                nombre_contacto: true,
                            }
                        },
                        detalles: {
                            where: {
                                deleted_at: null
                            },
                            include: {
                                animal: {
                                    select: {
                                        animal_id: true,
                                        arete: true,
                                        raza: {
                                            select: {
                                                nombre: true
                                            }
                                        },
                                        sexo: true,
                                        fecha_nacimiento: true,
                                        lote: {
                                            select: {
                                                codigo: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                return compraCompleta;
            });

            const respuesta = {
                ...result,
                total: CompraAnimalController.calcularTotal(result.detalles)
            };

            return res.status(201).json({
                ok: true,
                msg: "Compra de animales creada exitosamente",
                data: respuesta
            });

        } catch(error) {            
            if (error.code === 'P2002') {
                return res.status(400).json({
                    ok: false,
                    msg: "Ya existe un detalle para este animal en la compra"
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
                msg: "Error interno del servidor al crear compra"
            });
        }
    }

    static async update(req, res) {
        try {
            if(req.usuario.rol !== 'admin' && req.usuario.rol !== 'contable'){
                return res.status(403).json({
                    ok: false,
                    msg: "No tienes permisos para actualizar compras. Solo administradores y contables pueden realizar esta acción."
                });
            }

            const { id } = req.params;
            const { proveedor_id, fecha } = req.body;

            const compraId = parseInt(id);

            const compraExistente = await prisma.compras_animales.findFirst({
                where: {
                    compra_animal_id: compraId,
                    deleted_at: null
                }
            });

            if (!compraExistente) {
                return res.status(404).json({
                    ok: false,
                    msg: "Compra no encontrada"
                });
            }

            let proveedorId = compraExistente.proveedor_id;
            if (proveedor_id !== undefined) {
                proveedorId = parseInt(proveedor_id);
                if (isNaN(proveedorId)) {
                    return res.status(400).json({
                        ok: false,
                        msg: "El ID del proveedor debe ser un número válido"
                    });
                }
            }

            let fechaCompra = compraExistente.fecha;
            if (fecha !== undefined) {
                fechaCompra = new Date(fecha);
                if (isNaN(fechaCompra.getTime())) {
                    return res.status(400).json({
                        ok: false,
                        msg: "La fecha no es válida"
                    });
                }
            }

            const compraActualizada = await prisma.compras_animales.update({
                where: {
                    compra_animal_id: compraId
                },
                data: {
                    proveedor_id: proveedorId,
                    fecha: fechaCompra
                },
                include: {
                    proveedor: {
                        select: {
                            proveedor_id: true,
                            nombre_compañia: true,
                            nombre_contacto: true,
                        }
                    },
                    detalles: {
                        where: {
                            deleted_at: null
                        },
                        include: {
                            animal: {
                                select: {
                                    animal_id: true,
                                    arete: true,
                                    raza: {
                                        select: {
                                            nombre: true
                                        }
                                    },
                                    sexo: true,
                                    fecha_nacimiento: true
                                }
                            }
                        }
                    }
                }
            });

            const respuesta = {
                ...compraActualizada,
                total: CompraAnimalController.calcularTotal(compraActualizada.detalles)
            };

            return res.json({
                ok: true,
                msg: "Compra actualizada exitosamente",
                data: respuesta
            });

        } catch (error) {
            
            if (error.code === 'P2003') {
                return res.status(400).json({
                    ok: false,
                    msg: "El proveedor especificado no existe"
                });
            }

            return res.status(500).json({
                ok: false,
                msg: "Error al actualizar compra"
            });
        }
    }

    static async delete(req, res) {
        try {
            if(req.usuario.rol !== 'admin' && req.usuario.rol !== 'contable'){
                return res.status(403).json({
                    ok: false,
                    msg: "No tienes permisos para eliminar compras. Solo administradores y contables pueden realizar esta acción."
                });
            }

            const { id } = req.params;
            const compraId = parseInt(id);

            const compraExistente = await prisma.compras_animales.findFirst({
                where: {
                    compra_animal_id: compraId,
                    deleted_at: null
                },
                include: {
                    detalles: {
                        where: {
                            deleted_at: null
                        }
                    }
                }
            });

            if (!compraExistente) {
                return res.status(404).json({
                    ok: false,
                    msg: "Compra no encontrada"
                });
            }

            await prisma.$transaction(async (prisma) => {
                await prisma.detalle_compras_animales.updateMany({
                    where: {
                        compra_animal_id: compraId,
                        deleted_at: null
                    },
                    data: {
                        deleted_at: new Date()
                    }
                });

                await prisma.compras_animales.update({
                    where: {
                        compra_animal_id: compraId
                    },
                    data: {
                        deleted_at: new Date()
                    }
                });
            });

            return res.json({
                ok: true,
                msg: "Compra eliminada exitosamente"
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al eliminar compra"
            });
        }
    }

    static async getByNumeroCompra(req, res) {
        try {
            const { numero } = req.params;
            
            if (!numero) {
                return res.status(400).json({
                    ok: false,
                    msg: "El número de compra es requerido"
                });
            }

            const compra = await prisma.compras_animales.findFirst({
                where: {
                    numero_compra: numero,
                    deleted_at: null
                },
                include: {
                    proveedor: {
                        select: {
                            proveedor_id: true,
                            nombre_compañia: true,
                            nombre_contacto: true,
                        }
                    },
                    detalles: {
                        where: {
                            deleted_at: null
                        },
                        include: {
                            animal: {
                                select: {
                                    animal_id: true,
                                    arete: true,
                                    raza: {
                                        select: {
                                            nombre: true
                                        }
                                    },
                                    sexo: true,
                                    fecha_nacimiento: true
                                }
                            }
                        }
                    }
                }
            });
            
            if(!compra){
                return res.status(404).json({
                    ok: false,
                    msg: "Compra no encontrada"
                });
            }

            const compraConTotal = {
                ...compra,
                total: CompraAnimalController.calcularTotal(compra.detalles)
            };
            
            return res.json({
                ok: true,
                data: compraConTotal
            });

        } catch (error) {
            console.error("Error en getByNumeroCompra:", error);
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener la compra por número"
            });
        }
    }

    static async getTotal(req, res) {
        try {
            const { id } = req.params;
            const compraId = parseInt(id);

            const compra = await prisma.compras_animales.findFirst({
                where: {
                    compra_animal_id: compraId,
                    deleted_at: null
                },
                include: {
                    detalles: {
                        where: {
                            deleted_at: null
                        }
                    }
                }
            });

            if (!compra) {
                return res.status(404).json({
                    ok: false,
                    msg: "Compra no encontrada"
                });
            }

            const total = CompraAnimalController.calcularTotal(compra.detalles);

            return res.json({
                ok: true,
                data: { total }
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al calcular el total"
            });
        }
    }
}
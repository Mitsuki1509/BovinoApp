import prisma from "../database.js";

export default class CompraInsumoController {

    static async generarNumeroCompra() {
        try {
            const totalCompras = await prisma.compras_insumos.count();
            return `COMPRA-${(totalCompras + 1).toString().padStart(4, '0')}`;
        } catch (error) {
            const timestamp = Date.now();
            return `COMPRA-${timestamp.toString().slice(-4)}`;
        }
    }

    static calcularTotal(detalles) {
        return detalles.reduce((total, detalle) => {
            return total + (parseFloat(detalle.precio) * parseInt(detalle.cantidad));
        }, 0);
    }

    static async getAll(req, res) {
        try {
            const compras = await prisma.compras_insumos.findMany({
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
                            insumo: {
                                select: {
                                    insumo_id: true,
                                    nombre: true,
                                    tipo_insumo: {
                                        select: {
                                            nombre: true
                                        }
                                    },
                                    unidad: {
                                        select: {
                                            nombre: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    compra_insumo_id: 'desc'
                }
            });

            const comprasConTotal = compras.map(compra => ({
                ...compra,
                total: CompraInsumoController.calcularTotal(compra.detalles)
            }));

            return res.json({
                ok: true,
                data: comprasConTotal
            });

        } catch (error) {
            console.error("Error en getAll:", error);
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener las compras de insumos"
            });
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const compraId = parseInt(id);

            const compra = await prisma.compras_insumos.findFirst({
                where: {
                    compra_insumo_id: compraId,
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
                            insumo: {
                                select: {
                                    insumo_id: true,
                                    nombre: true,
                                    tipo_insumo: {
                                        select: {
                                            nombre: true
                                        }
                                    },
                                    unidad: {
                                        select: {
                                            nombre: true
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
                total: CompraInsumoController.calcularTotal(compra.detalles)
            };
            
            return res.json({
                ok: true,
                data: compraConTotal
            });

        } catch (error) {
            console.error("Error en getById:", error);
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

            if (isNaN(proveedorId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID del proveedor debe ser un número válido"
                });
            }

            if (isNaN(fechaCompra.getTime())) {
                return res.status(400).json({
                    ok: false,
                    msg: "La fecha no es válida"
                });
            }

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
                if (!detalle.insumo_id || !detalle.precio || !detalle.cantidad) {
                    return res.status(400).json({
                        ok: false,
                        msg: "Cada detalle debe tener insumo_id, precio y cantidad"
                    });
                }

                const insumoId = parseInt(detalle.insumo_id);
                const precio = parseFloat(detalle.precio);
                const cantidad = parseInt(detalle.cantidad);

                if (isNaN(insumoId) || isNaN(precio) || isNaN(cantidad)) {
                    return res.status(400).json({
                        ok: false,
                        msg: "Los datos del detalle deben ser números válidos"
                    });
                }

                if (precio <= 0 || cantidad <= 0) {
                    return res.status(400).json({
                        ok: false,
                        msg: "El precio y la cantidad deben ser mayores a 0"
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
                        msg: `El insumo con ID ${insumoId} no existe`
                    });
                }
            }

            const numeroCompra = await CompraInsumoController.generarNumeroCompra();

            const result = await prisma.$transaction(async (prisma) => {
                const compra = await prisma.compras_insumos.create({
                    data: {
                        numero_compra: numeroCompra,
                        proveedor_id: proveedorId,
                        fecha: fechaCompra
                    }
                });

                for (const detalle of detalles) {
                    const insumoId = parseInt(detalle.insumo_id);
                    const precio = parseFloat(detalle.precio);
                    const cantidad = parseInt(detalle.cantidad);

                    await prisma.detalle_compras_insumos.create({
                        data: {
                            compra_insumo_id: compra.compra_insumo_id,
                            insumo_id: insumoId,
                            precio: precio,
                            cantidad: cantidad
                        }
                    });

                    await prisma.insumos.update({
                        where: {
                            insumo_id: insumoId
                        },
                        data: {
                            cantidad: {
                                increment: cantidad
                            }
                        }
                    });
                }

                const compraCompleta = await prisma.compras_insumos.findFirst({
                    where: {
                        compra_insumo_id: compra.compra_insumo_id
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
                                insumo: {
                                    select: {
                                        insumo_id: true,
                                        nombre: true,
                                        tipo_insumo: {
                                            select: {
                                                nombre: true
                                            }
                                        },
                                        unidad: {
                                            select: {
                                                nombre: true
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
                total: CompraInsumoController.calcularTotal(result.detalles)
            };

            return res.status(201).json({
                ok: true,
                msg: "Compra de insumos creada exitosamente",
                data: respuesta
            });

        } catch(error) {
            console.error("Error en create:", error);
            
            if (error.code === 'P2002') {
                return res.status(400).json({
                    ok: false,
                    msg: "Ya existe un detalle para este insumo en la compra"
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

            const compraExistente = await prisma.compras_insumos.findFirst({
                where: {
                    compra_insumo_id: compraId,
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

            const compraActualizada = await prisma.compras_insumos.update({
                where: {
                    compra_insumo_id: compraId
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
                            insumo: {
                                select: {
                                    insumo_id: true,
                                    nombre: true,
                                    tipo_insumo: {
                                        select: {
                                            nombre: true
                                        }
                                    },
                                    unidad: {
                                        select: {
                                            nombre: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const respuesta = {
                ...compraActualizada,
                total: CompraInsumoController.calcularTotal(compraActualizada.detalles)
            };

            return res.json({
                ok: true,
                msg: "Compra actualizada exitosamente",
                data: respuesta
            });

        } catch (error) {
            console.error("Error en update:", error);
            
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
            
            if (isNaN(compraId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID de la compra debe ser un número válido"
                });
            }

            const compraExistente = await prisma.compras_insumos.findFirst({
                where: {
                    compra_insumo_id: compraId,
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
                for (const detalle of compraExistente.detalles) {
                    await prisma.insumos.update({
                        where: {
                            insumo_id: detalle.insumo_id
                        },
                        data: {
                            cantidad: {
                                decrement: detalle.cantidad
                            }
                        }
                    });
                }

                await prisma.detalle_compras_insumos.updateMany({
                    where: {
                        compra_insumo_id: compraId,
                        deleted_at: null
                    },
                    data: {
                        deleted_at: new Date()
                    }
                });

                await prisma.compras_insumos.update({
                    where: {
                        compra_insumo_id: compraId
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
            console.error("Error en delete:", error);
            return res.status(500).json({
                ok: false,
                msg: "Error al eliminar compra"
            });
        }
    }

    static async getTotal(req, res) {
        try {
            const { id } = req.params;
            const compraId = parseInt(id);

            const compra = await prisma.compras_insumos.findFirst({
                where: {
                    compra_insumo_id: compraId,
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

            const total = CompraInsumoController.calcularTotal(compra.detalles);

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
    static async getByNumeroCompra(req, res) {
        try {
            const { numero } = req.params;
            
            if (!numero) {
                return res.status(400).json({
                    ok: false,
                    msg: "El número de compra es requerido"
                });
            }

            const compra = await prisma.compras_insumos.findFirst({
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
                            insumo: {
                                select: {
                                    insumo_id: true,
                                    nombre: true,
                                    tipo_insumo: {
                                        select: {
                                            nombre: true
                                        }
                                    },
                                    unidad: {
                                        select: {
                                            nombre: true
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
                total: CompraInsumoController.calcularTotal(compra.detalles)
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
}
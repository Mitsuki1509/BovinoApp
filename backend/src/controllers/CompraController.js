import prisma from "../database.js"

export default class CompraController {

    static async generarNumeroCompraSimple() {
        try {
            const totalCompras = await prisma.compras.count();
            return `MONTA-${(totalCompras + 1).toString().padStart(4, '0')}`;
        } catch (error) {
            const timestamp = Date.now();
            return `MONTA-${timestamp.toString().slice(-4)}`;
        }
    }

    static async getAll(req, res) {
    try {
        const compras = await prisma.compras.findMany({
            where: { 
                deleted_at: null 
            },
            include: {
                proveedor: {
                    select: {
                        proveedor_id: true,
                        nombre_compañia: true,
                        nombre_contacto: true,
                        telefono_local: true
                    }
                },
                detalle_compras: {
                    where: {
                        deleted_at: null
                    },
                    include: {
                        insumo: {
                            select: {
                                nombre: true,
                                tipo_insumo: {
                                    select: {
                                        nombre: true
                                    }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        detalle_compras: {
                            where: {
                                deleted_at: null
                            }
                        }
                    }
                }
            },
            orderBy: {
                compra_id: 'desc'
            }
        });

        return res.json({
            ok: true,
            data: compras
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            msg: "Error al obtener las compras"
        });
    }
}

    static async getById(req, res) {
    try {
        const { id } = req.params;
        const compraId = parseInt(id);
        
        if (isNaN(compraId)) {
            return res.status(400).json({
                ok: false,
                msg: "El ID de la compra debe ser un número válido"
            });
        }

        const compra = await prisma.compras.findFirst({
            where: {
                compra_id: compraId,
                deleted_at: null
            },
            include: {
                proveedor: {
                    select: {
                        proveedor_id: true,
                        nombre_compañia: true,
                        nombre_contacto: true,
                        telefono_local: true
                    }
                },
                detalle_compras: {
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
                },
                _count: {
                    select: {
                        detalle_compras: {
                            where: {
                                deleted_at: null
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
        
        return res.json({
            ok: true,
            data: compra
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
            if (!req.usuario) {
                return res.status(401).json({
                    ok: false,
                    msg: "No autenticado"
                });
            }

            if(req.usuario.rol !== 'admin' && req.usuario.rol !== 'contable'){
                return res.status(403).json({
                    ok: false,
                    msg: "No tienes permisos para crear una compra. Solo administradores y contables pueden realizar esta acción."
                });
            }

            const { proveedor_id, fecha } = req.body;

            if (!proveedor_id || !fecha) {
                return res.status(400).json({
                    ok: false,
                    msg: "El proveedor y la fecha son requeridos"
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

            const numeroCompra = await CompraController.generarNumeroCompraSimple();

            const compra = await prisma.compras.create({
                data: {
                    numero_compra: numeroCompra,
                    proveedor_id: proveedorId,
                    fecha: fechaCompra
                },
                include: {
                    proveedor: {
                        select: {
                            proveedor_id: true,
                            nombre_compañia: true,
                            nombre_contacto: true,
                            telefono_local: true
                        }
                    }
                }
            });

            return res.status(201).json({
                ok: true,
                msg: "Compra creada exitosamente",
                data: compra
            });

        } catch(error) {
            
            if (error.code === 'P2002') {
                return res.status(400).json({
                    ok: false,
                    msg: "Error: Ya existe una compra con ese número. Intente nuevamente."
                });
            }
            
            if (error.code === 'P2003') {
                return res.status(400).json({
                    ok: false,
                    msg: "El proveedor especificado no existe"
                });
            }

            if (error.name === 'PrismaClientValidationError') {
                return res.status(400).json({
                    ok: false,
                    msg: "Error de validación: Verifique que todos los campos sean correctos"
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
            
            if (isNaN(compraId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID de la compra debe ser un número válido"
                });
            }

            const compraExistente = await prisma.compras.findFirst({
                where: {
                    compra_id: compraId,
                    deleted_at: null
                }
            });

            if (!compraExistente) {
                return res.status(404).json({
                    ok: false,
                    msg: "Compra no encontrada"
                });
            }

            if (proveedor_id !== undefined && !proveedor_id) {
                return res.status(400).json({
                    ok: false,
                    msg: "El proveedor es requerido"
                });
            }

            if (fecha !== undefined && !fecha) {
                return res.status(400).json({
                    ok: false,
                    msg: "La fecha es requerida"
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

            const compraActualizada = await prisma.compras.update({
                where: {
                    compra_id: compraId
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
                            telefono_local: true
                        }
                    }
                }
            });

            return res.json({
                ok: true,
                msg: "Compra actualizada exitosamente",
                data: compraActualizada
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
            
            if (isNaN(compraId)) {
                return res.status(400).json({
                    ok: false,
                    msg: "El ID de la compra debe ser un número válido"
                });
            }

            const compraExistente = await prisma.compras.findFirst({
                where: {
                    compra_id: compraId,
                    deleted_at: null
                },
                include: {
                    detalle_compras: {
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

            if (compraExistente.detalle_compras.length > 0) {
                return res.status(400).json({
                    ok: false,
                    msg: "No se puede eliminar la compra porque tiene detalles de compra asociados"
                });
            }

            await prisma.compras.update({
                where: {
                    compra_id: compraId
                },
                data: {
                    deleted_at: new Date()
                }
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

    static async search(req, res) {
        try {
            const { query } = req.query;

            if (!query || query.trim() === '') {
                return res.status(400).json({
                    ok: false,
                    msg: "El parámetro de búsqueda es requerido"
                });
            }

            const compras = await prisma.compras.findMany({
                where: {
                    AND: [
                        { deleted_at: null },
                        {
                            OR: [
                                {
                                    numero_compra: {
                                        contains: query.trim(),
                                        mode: 'insensitive'
                                    }
                                },
                                {
                                    proveedor: {
                                        nombre_compañia: {
                                            contains: query.trim(),
                                            mode: 'insensitive'
                                        }
                                    }
                                },
                                {
                                    proveedor: {
                                        nombre_contacto: {
                                            contains: query.trim(),
                                            mode: 'insensitive'
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                },
                include: {
                    proveedor: {
                        select: {
                            proveedor_id: true,
                            nombre_compañia: true,
                            nombre_contacto: true
                        }
                    }
                },
                orderBy: {
                    compra_id: 'desc'
                }
            });

            return res.json({
                ok: true,
                data: compras
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error al buscar compras"
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

        const compra = await prisma.compras.findFirst({
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
                        telefono_local: true
                    }
                },
                detalle_compras: {
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
                },
                _count: {
                    select: {
                        detalle_compras: {
                            where: {
                                deleted_at: null
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
        
        return res.json({
            ok: true,
            data: compra
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            msg: "Error al obtener la compra"
        });
    }
}

}
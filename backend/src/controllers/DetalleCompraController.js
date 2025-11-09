import prisma from "../database.js"

export default class DetalleCompraController {

  static async getAll(req, res) {
  try {
    const detalles = await prisma.detalle_compras.findMany({
      where: {
        deleted_at: null
      },
      include: {
        compra: {
          select: {
            compra_id: true,
            numero_compra: true,
            fecha: true,
            proveedor: {
              select: {
                proveedor_id: true,
                nombre_compañia: true,
                nombre_contacto: true
              }
            }
          }
        },
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
      },
      orderBy: {
        detalle_id: 'desc'
      }
    });

    return res.json({
      ok: true,
      data: detalles
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener detalles de compra"
    });
  }
}

  static async create(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'contable') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para crear detalles de compra. Solo administradores y contables pueden realizar esta acción."
        });
      }

      const { compra_id, insumo_id, precio, cantidad } = req.body;

      if (!compra_id) {
        return res.status(400).json({
          ok: false,
          msg: "El ID de la compra es requerido"
        });
      }

      if (!insumo_id) {
        return res.status(400).json({
          ok: false,
          msg: "El ID del insumo es requerido"
        });
      }

      if (!precio || precio <= 0) {
        return res.status(400).json({
          ok: false,
          msg: "El precio debe ser mayor a 0"
        });
      }

      if (!cantidad || cantidad <= 0) {
        return res.status(400).json({
          ok: false,
          msg: "La cantidad debe ser mayor a 0"
        });
      }

      const compraId = parseInt(compra_id);
      const insumoId = parseInt(insumo_id);
      const precioDecimal = parseFloat(precio);
      const cantidadInt = parseInt(cantidad);

      const detalleCompra = await prisma.detalle_compras.create({
        data: {
          compra_id: compraId,
          insumo_id: insumoId,
          precio: precioDecimal,
          cantidad: cantidadInt
        },
        include: {
          insumo: {
            select: {
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
          },
          compra: {
            select: {
              numero_compra: true,
              fecha: true
            }
          }
        }
      });

      await prisma.insumos.update({
        where: {
          insumo_id: insumoId
        },
        data: {
          cantidad: {
            increment: cantidadInt
          }
        }
      });

      return res.status(201).json({
        ok: true,
        msg: "Detalle de compra creado exitosamente",
        data: detalleCompra
      });

    } catch (error) {
      if (error.code === 'P2003') {
        return res.status(400).json({
          ok: false,
          msg: "La compra o el insumo no existen"
        });
      }
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un detalle para este insumo en la compra"
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error al crear detalle de compra"
      });
    }
  }

  static async delete(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'contable') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para eliminar detalles de compra. Solo administradores y contables pueden realizar esta acción."
        });
      }

      const { id } = req.params;
      const detalleId = parseInt(id);
      
      if (isNaN(detalleId)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID del detalle debe ser un número válido"
        });
      }

      const detalleExistente = await prisma.detalle_compras.findFirst({
        where: {
          detalle_id: detalleId,
          deleted_at: null
        }
      });

      if (!detalleExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Detalle de compra no encontrado"
        });
      }

      await prisma.detalle_compras.update({
        where: {
          detalle_id: detalleId
        },
        data: {
          deleted_at: new Date()
        }
      });

      await prisma.insumos.update({
        where: {
          insumo_id: detalleExistente.insumo_id
        },
        data: {
          cantidad: {
            decrement: detalleExistente.cantidad
          }
        }
      });

      return res.json({
        ok: true,
        msg: "Detalle de compra eliminado exitosamente"
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al eliminar detalle de compra"
      });
    }
  }

  static async getByCompraId(req, res) {
    try {
      const { compraId } = req.params;
      const idCompra = parseInt(compraId);
      
      if (isNaN(idCompra)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID de la compra debe ser un número válido"
        });
      }

      const detalles = await prisma.detalle_compras.findMany({
        where: {
          compra_id: idCompra,
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
        },
        orderBy: {
          detalle_id: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: detalles
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener detalles de compra"
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const detalleId = parseInt(id);
      
      if (isNaN(detalleId)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID del detalle debe ser un número válido"
        });
      }

      const detalle = await prisma.detalle_compras.findFirst({
        where: {
          detalle_id: detalleId,
          deleted_at: null
        },
        include: {
          compra: {
            select: {
              compra_id: true,
              numero_compra: true,
              fecha: true,
              proveedor: {
                select: {
                  nombre_compañia: true
                }
              }
            }
          },
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
      });

      if (!detalle) {
        return res.status(404).json({
          ok: false,
          msg: "Detalle de compra no encontrado"
        });
      }

      return res.json({
        ok: true,
        data: detalle
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener detalle de compra"
      });
    }
  }

  static async getByNumeroCompra(req, res) {
    try {
      const { numeroCompra } = req.params;
      
      if (!numeroCompra) {
        return res.status(400).json({
          ok: false,
          msg: "El número de compra es requerido"
        });
      }

      const compra = await prisma.compras.findFirst({
        where: {
          numero_compra: numeroCompra,
          deleted_at: null
        }
      });

      if (!compra) {
        return res.status(404).json({
          ok: false,
          msg: "Compra no encontrada"
        });
      }

      const detalles = await prisma.detalle_compras.findMany({
        where: {
          compra_id: compra.compra_id,
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
        },
        orderBy: {
          detalle_id: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: {
          compra: compra,
          detalles: detalles
        }
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener detalles de compra"
      });
    }
  }

  static async getTotalByCompra(req, res) {
    try {
      const { compraId } = req.params;
      const idCompra = parseInt(compraId);
      
      if (isNaN(idCompra)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID de la compra debe ser un número válido"
        });
      }

      const detalles = await prisma.detalle_compras.findMany({
        where: {
          compra_id: idCompra,
          deleted_at: null
        },
        select: {
          precio: true,
          cantidad: true
        }
      });

      const total = detalles.reduce((sum, detalle) => {
        return sum + (parseFloat(detalle.precio) * detalle.cantidad);
      }, 0);

      return res.json({
        ok: true,
        data: {
          total: total,
          cantidad_detalles: detalles.length
        }
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al calcular total de compra"
      });
    }
  }

  static async getTotalByNumeroCompra(req, res) {
    try {
      const { numeroCompra } = req.params;
      
      if (!numeroCompra) {
        return res.status(400).json({
          ok: false,
          msg: "El número de compra es requerido"
        });
      }

      const compra = await prisma.compras.findFirst({
        where: {
          numero_compra: numeroCompra,
          deleted_at: null
        }
      });

      if (!compra) {
        return res.status(404).json({
          ok: false,
          msg: "Compra no encontrada"
        });
      }

      const detalles = await prisma.detalle_compras.findMany({
        where: {
          compra_id: compra.compra_id,
          deleted_at: null
        },
        select: {
          precio: true,
          cantidad: true
        }
      });

      const total = detalles.reduce((sum, detalle) => {
        return sum + (parseFloat(detalle.precio) * detalle.cantidad);
      }, 0);

      return res.json({
        ok: true,
        data: {
          total: total,
          cantidad_detalles: detalles.length,
          compra: {
            numero_compra: compra.numero_compra,
            fecha: compra.fecha
          }
        }
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al calcular total de compra"
      });
    }
  }
}
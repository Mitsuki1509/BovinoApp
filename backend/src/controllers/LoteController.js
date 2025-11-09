import prisma from "../database.js";

export default class LoteController {

  static async getAll(req, res) {
    try {
      const lotes = await prisma.lotes.findMany({
        where: { 
          deleted_at: null 
        },
        include: {
          potrero: {
            select: {
              potrero_id: true,
              ubicacion: true
            }
          },
          _count: {
            select: {
              animales: {
                where: {
                  deleted_at: null
                }
              }
            }
          }
        },
        orderBy: {
          lote_id: 'desc'
        }
      });

      return res.json({
        ok: true,
        data: lotes
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener los lotes"
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const lote = await prisma.lotes.findUnique({
        where: { 
          lote_id: parseInt(id),
          deleted_at: null 
        },
        include: {
          potrero: {
            select: {
              potrero_id: true,
              ubicacion: true
            }
          },
          animales: {
            where: {
              deleted_at: null
            },
            select: {
              animal_id: true,
              arete: true,
              sexo: true,
              fecha_nacimiento: true
            }
          }
        }
      });

      if (!lote) {
        return res.status(404).json({
          ok: false,
          msg: "Lote no encontrado"
        });
      }

      return res.json({
        ok: true,
        data: lote
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener el lote"
      });
    }
  }

  static async create(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'operario') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para crear lotes. Solo administradores y operarios pueden realizar esta acción."
        });
      }

      const { potrero_id, descripcion, codigo } = req.body;

      if (!codigo || codigo.trim() === '') {
        return res.status(400).json({
          ok: false,
          msg: "El código del lote es requerido"
        });
      }

      if (!descripcion || descripcion.trim() === '') {
        return res.status(400).json({
          ok: false,
          msg: "La descripción del lote es requerida"
        });
      }

      if (!potrero_id) {
        return res.status(400).json({
          ok: false,
          msg: "El potrero es requerido"
        });
      }

      if (codigo.length > 50) {
        return res.status(400).json({
          ok: false,
          msg: "El código no puede tener más de 50 caracteres"
        });
      }

      const codigoExistente = await prisma.lotes.findFirst({
        where: {
          codigo: codigo.trim(),
          deleted_at: null
        }
      });

      if (codigoExistente) {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un lote con este código"
        });
      }

      const potreroId = parseInt(potrero_id);
      const potreroExistente = await prisma.potreros.findUnique({
        where: { 
          potrero_id: potreroId,
          deleted_at: null 
        }
      });

      if (!potreroExistente) {
        return res.status(400).json({
          ok: false,
          msg: "El potrero especificado no existe"
        });
      }

      const lote = await prisma.lotes.create({
        data: {
          codigo: codigo.trim(),
          descripcion: descripcion.trim(),
          potrero_id: potreroId
        },
        include: {
          potrero: {
            select: {
              potrero_id: true,
              ubicacion: true
            }
          }
        }
      });

      return res.status(201).json({
        ok: true,
        msg: "Lote creado exitosamente",
        data: lote
      });

    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un lote con este código"
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error al crear el lote"
      });
    }
  }

  static async update(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'operario') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para actualizar lotes. Solo administradores y operarios pueden realizar esta acción."
        });
      }

      const { id } = req.params;
      const { potrero_id, descripcion, codigo } = req.body;

      const loteId = parseInt(id);

      const loteExistente = await prisma.lotes.findUnique({
        where: { 
          lote_id: loteId,
          deleted_at: null 
        }
      });

      if (!loteExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Lote no encontrado"
        });
      }

      if (codigo !== undefined && (!codigo || codigo.trim() === '')) {
        return res.status(400).json({
          ok: false,
          msg: "El código del lote es requerido"
        });
      }

      if (descripcion !== undefined && (!descripcion || descripcion.trim() === '')) {
        return res.status(400).json({
          ok: false,
          msg: "La descripción del lote es requerida"
        });
      }

      if (potrero_id !== undefined && !potrero_id) {
        return res.status(400).json({
          ok: false,
          msg: "El potrero es requerido"
        });
      }

      if (codigo && codigo.length > 50) {
        return res.status(400).json({
          ok: false,
          msg: "El código no puede tener más de 50 caracteres"
        });
      }

      if (codigo && codigo.trim() !== loteExistente.codigo) {
        const codigoExistente = await prisma.lotes.findFirst({
          where: {
            codigo: codigo.trim(),
            lote_id: { not: loteId },
            deleted_at: null
          }
        });

        if (codigoExistente) {
          return res.status(400).json({
            ok: false,
            msg: "Ya existe un lote con este código"
          });
        }
      }

      if (potrero_id !== undefined) {
        const potreroId = parseInt(potrero_id);
        const potreroExistente = await prisma.potreros.findUnique({
          where: { 
            potrero_id: potreroId,
            deleted_at: null 
          }
        });

        if (!potreroExistente) {
          return res.status(400).json({
            ok: false,
            msg: "El potrero especificado no existe"
          });
        }
      }

      const loteActualizado = await prisma.lotes.update({
        where: { lote_id: loteId },
        data: {
          codigo: codigo ? codigo.trim() : loteExistente.codigo,
          descripcion: descripcion ? descripcion.trim() : loteExistente.descripcion,
          potrero_id: potrero_id !== undefined ? parseInt(potrero_id) : loteExistente.potrero_id
        },
        include: {
          potrero: {
            select: {
              potrero_id: true,
              ubicacion: true
            }
          }
        }
      });

      return res.json({
        ok: true,
        msg: "Lote actualizado exitosamente",
        data: loteActualizado
      });

    } catch (error) {
      console.error("Error actualizando lote:", error);
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un lote con este código"
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar el lote"
      });
    }
  }

  static async delete(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'operario') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para eliminar lotes. Solo administradores y operarios pueden realizar esta acción."
        });
      }

      const { id } = req.params;
      const loteId = parseInt(id);

      const loteExistente = await prisma.lotes.findUnique({
        where: { 
          lote_id: loteId,
          deleted_at: null 
        }
      });

      if (!loteExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Lote no encontrado"
        });
      }

      const animalesEnLote = await prisma.animales.findMany({
        where: {
          lote_id: loteId,
          deleted_at: null
        }
      });

      if (animalesEnLote.length > 0) {
        return res.status(400).json({
          ok: false,
          msg: "No se puede eliminar el lote porque tiene animales asignados"
        });
      }

      await prisma.lotes.update({
        where: { lote_id: loteId },
        data: { deleted_at: new Date() }
      });

      return res.json({
        ok: true,
        msg: "Lote eliminado exitosamente"
      });

    } catch (error) {
      console.error("Error eliminando lote:", error);
      return res.status(500).json({
        ok: false,
        msg: "Error al eliminar el lote"
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

      const lotes = await prisma.lotes.findMany({
        where: {
          AND: [
            { deleted_at: null },
            {
              OR: [
                {
                  descripcion: {
                    contains: query.trim(),
                    mode: 'insensitive'
                  }
                },
                {
                  codigo: {
                    contains: query.trim(),
                    mode: 'insensitive'
                  }
                },
                {
                  potrero: {
                    ubicacion: {
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
          potrero: {
            select: {
              potrero_id: true,
              ubicacion: true
            }
          },
          _count: {
            select: {
              animales: {
                where: {
                  deleted_at: null
                }
              }
            }
          }
        },
        orderBy: {
          lote_id: 'desc'
        }
      });

      return res.json({
        ok: true,
        data: lotes
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al buscar lotes"
      });
    }
  }
}
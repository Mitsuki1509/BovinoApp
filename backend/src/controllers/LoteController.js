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
      console.error("Error obteniendo lotes:", error);
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
      console.error("Error obteniendo lote:", error);
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

      const { potrero_id, descripcion } = req.body;

      if (!descripcion || descripcion.trim() === '') {
        return res.status(400).json({
          ok: false,
          msg: "La descripción es requerida"
        });
      }

      if (potrero_id) {
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

      const lote = await prisma.lotes.create({
        data: {
          descripcion: descripcion.trim(),
          potrero_id: potrero_id ? parseInt(potrero_id) : null
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
      console.error("Error creando lote:", error);
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
      const { potrero_id, descripcion } = req.body;

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

      if (potrero_id !== undefined) {
        if (potrero_id) {
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
      }

      const loteActualizado = await prisma.lotes.update({
        where: { lote_id: loteId },
        data: {
          descripcion: descripcion ? descripcion.trim() : loteExistente.descripcion,
          potrero_id: potrero_id !== undefined ? (potrero_id ? parseInt(potrero_id) : null) : loteExistente.potrero_id
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

  static async getByPotrero(req, res) {
    try {
      const { potreroId } = req.params;
      const idPotrero = parseInt(potreroId);

      const lotes = await prisma.lotes.findMany({
        where: { 
          potrero_id: idPotrero,
          deleted_at: null 
        },
        include: {
          potrero: {
            select: {
              ubicacion: true
            }
          }
        },
        orderBy: {
          lote_id: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: lotes
      });

    } catch (error) {
      console.error("Error obteniendo lotes por potrero:", error);
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener lotes del potrero"
      });
    }
  }

  static async getLotesSinPotrero(req, res) {
    try {
      const lotes = await prisma.lotes.findMany({
        where: { 
          potrero_id: null,
          deleted_at: null 
        },
        orderBy: {
          lote_id: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: lotes
      });

    } catch (error) {
      console.error("Error obteniendo lotes sin potrero:", error);
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener lotes sin potrero asignado"
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
      console.error("Error buscando lotes:", error);
      return res.status(500).json({
        ok: false,
        msg: "Error al buscar lotes"
      });
    }
  }
}
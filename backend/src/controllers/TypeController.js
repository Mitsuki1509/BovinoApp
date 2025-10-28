import prisma from "../database.js";

export default class TypeController {

  static async getType(req, res) {
    try {
      const tiposEvento = await prisma.tipo_evento.findMany({
        where: { 
          deleted_at: null 
        },
        include: {
          padre: {
            select: {
              tipo_evento_id: true,
              nombre: true
            }
          },
          hijos: {
            where: {
              deleted_at: null
            },
            select: {
              tipo_evento_id: true,
              nombre: true
            }
          }
        },
        orderBy: {
          nombre: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: tiposEvento
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener los tipos de evento"
      });
    }
  }

  static async getTypeById(req, res) {
    try {
      const { id } = req.params;

      const tipoEvento = await prisma.tipo_evento.findUnique({
        where: { 
          tipo_evento_id: parseInt(id),
          deleted_at: null 
        },
        include: {
          padre: {
            select: {
              tipo_evento_id: true,
              nombre: true
            }
          },
          hijos: {
            where: {
              deleted_at: null
            },
            select: {
              tipo_evento_id: true,
              nombre: true
            }
          }
        }
      });

      if (!tipoEvento) {
        return res.status(404).json({
          ok: false,
          msg: "Tipo de evento no encontrado"
        });
      }

      return res.json({
        ok: true,
        data: tipoEvento
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener el tipo de evento"
      });
    }
  }

  static async getTypeFather(req, res) {
    try {
      const tiposEventoPadres = await prisma.tipo_evento.findMany({
        where: { 
          padre_id: null,
          deleted_at: null 
        },
        include: {
          hijos: {
            where: {
              deleted_at: null
            },
            select: {
              tipo_evento_id: true,
              nombre: true
            }
          }
        },
        orderBy: {
          nombre: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: tiposEventoPadres
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener los tipos de evento padres"
      });
    }
  }

  static async createType(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'veterinario') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para crear tipos de evento"
        });
      }

      const { nombre, padre_id } = req.body;

      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          ok: false,
          msg: "El nombre es requerido"
        });
      }

      const tipoEventoExistente = await prisma.tipo_evento.findFirst({
        where: { 
          nombre: nombre.trim(),
          deleted_at: null 
        }
      });

      if (tipoEventoExistente) {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un tipo de evento con ese nombre"
        });
      }

      let padreIdNumber = null;
      if (padre_id) {
        padreIdNumber = parseInt(padre_id);
        
        const padreExistente = await prisma.tipo_evento.findUnique({
          where: { 
            tipo_evento_id: padreIdNumber,
            deleted_at: null 
          }
        });

        if (!padreExistente) {
          return res.status(400).json({
            ok: false,
            msg: "El tipo de evento padre especificado no existe"
          });
        }
      }

      const nuevoTipoEvento = await prisma.tipo_evento.create({
        data: {
          nombre: nombre.trim(),
          padre_id: padreIdNumber
        },
        include: {
          padre: {
            select: {
              tipo_evento_id: true,
              nombre: true
            }
          }
        }
      });

      return res.status(201).json({
        ok: true,
        msg: "Tipo de evento creado exitosamente",
        data: nuevoTipoEvento
      });

    } catch (error) {
      console.error("Error creando tipo de evento:", error);
      return res.status(500).json({
        ok: false,
        msg: "Error al crear el tipo de evento"
      });
    }
  }

  static async updateType(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'veterinario') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para actualizar tipos de evento"
        });
      }

      const { id } = req.params;
      const { nombre, padre_id } = req.body;

      const tipoEventoExistente = await prisma.tipo_evento.findUnique({
        where: { 
          tipo_evento_id: parseInt(id),
          deleted_at: null 
        }
      });

      if (!tipoEventoExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Tipo de evento no encontrado"
        });
      }

      if (nombre && nombre.trim() !== '') {
        const nombreExistente = await prisma.tipo_evento.findFirst({
          where: { 
            nombre: nombre.trim(),
            tipo_evento_id: { not: parseInt(id) },
            deleted_at: null 
          }
        });

        if (nombreExistente) {
          return res.status(400).json({
            ok: false,
            msg: "Ya existe otro tipo de evento con ese nombre"
          });
        }
      }

      let padreIdNumber = null;
      if (padre_id !== undefined && padre_id !== null && padre_id !== '') {
        padreIdNumber = parseInt(padre_id);
        
        const padreExistente = await prisma.tipo_evento.findUnique({
          where: { 
            tipo_evento_id: padreIdNumber,
            deleted_at: null 
          }
        });

        if (!padreExistente) {
          return res.status(400).json({
            ok: false,
            msg: "El tipo de evento padre especificado no existe"
          });
        }

        if (padreIdNumber === parseInt(id)) {
          return res.status(400).json({
            ok: false,
            msg: "Un tipo de evento no puede ser padre de sí mismo"
          });
        }

        let currentPadreId = padreIdNumber;
        while (currentPadreId) {
          const currentPadre = await prisma.tipo_evento.findUnique({
            where: { tipo_evento_id: currentPadreId },
            select: { padre_id: true }
          });

          if (currentPadre.padre_id === parseInt(id)) {
            return res.status(400).json({
              ok: false,
              msg: "No se puede crear una jerarquía circular"
            });
          }
          currentPadreId = currentPadre.padre_id;
        }
      } else if (padre_id === '') {
        padreIdNumber = null;
      }

      const tipoEventoActualizado = await prisma.tipo_evento.update({
        where: { tipo_evento_id: parseInt(id) },
        data: {
          ...(nombre && { nombre: nombre.trim() }),
          padre_id: padreIdNumber
        },
        include: {
          padre: {
            select: {
              tipo_evento_id: true,
              nombre: true
            }
          },
          hijos: {
            where: {
              deleted_at: null
            },
            select: {
              tipo_evento_id: true,
              nombre: true
            }
          }
        }
      });

      return res.json({
        ok: true,
        msg: "Tipo de evento actualizado exitosamente",
        data: tipoEventoActualizado
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar el tipo de evento"
      });
    }
  }

  static async deleteType(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'veterinario') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para eliminar tipos de evento"
        });
      }

      const { id } = req.params;

      const tipoEvento = await prisma.tipo_evento.findUnique({
        where: { 
          tipo_evento_id: parseInt(id),
          deleted_at: null 
        },
        include: {
          hijos: {
            where: {
              deleted_at: null
            }
          }
        }
      });

      if (!tipoEvento) {
        return res.status(404).json({
          ok: false,
          msg: "Tipo de evento no encontrado"
        });
      }

      if (tipoEvento.hijos.length > 0) {
        return res.status(400).json({
          ok: false,
          msg: "No se puede eliminar un tipo de evento que tiene sub-tipos asociados. Elimine primero los sub-tipos."
        });
      }

      await prisma.tipo_evento.update({
        where: { tipo_evento_id: parseInt(id) },
        data: { 
          deleted_at: new Date() 
        }
      });

      return res.json({
        ok: true,
        msg: "Tipo de evento eliminado exitosamente"
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al eliminar el tipo de evento"
      });
    }
  }

  static async getChildType(req, res) {
    try {
      const { id } = req.params;

      const hijos = await prisma.tipo_evento.findMany({
        where: { 
          padre_id: parseInt(id),
          deleted_at: null 
        },
        orderBy: {
          nombre: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: hijos
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener los sub-tipos de evento"
      });
    }
  }
}
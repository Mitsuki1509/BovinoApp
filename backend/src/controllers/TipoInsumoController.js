import prisma from "../database.js";

export default class TipoInsumoController {

  static async getAll(req, res) {
    try {
      const tiposInsumo = await prisma.tipo_insumo.findMany({
        where: { 
          deleted_at: null 
        },
        include: {
          _count: {
            select: {
              insumos: {
                where: {
                  deleted_at: null
                }
              }
            }
          }
        },
        orderBy: {
          nombre: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: tiposInsumo
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener los tipos de insumo"
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const tipoInsumoId = parseInt(id);

      const tipoInsumo = await prisma.tipo_insumo.findFirst({
        where: { 
          tipo_insumo_id: tipoInsumoId,
          deleted_at: null 
        },
        include: {
          insumos: {
            where: {
              deleted_at: null
            }
          }
        }
      });

      if (!tipoInsumo) {
        return res.status(404).json({
          ok: false,
          msg: "Tipo de insumo no encontrado"
        });
      }

      return res.json({
        ok: true,
        data: tipoInsumo
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener el tipo de insumo"
      });
    }
  }

  static async create(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'contable') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para crear tipos de insumo. Solo administradores y contables pueden realizar esta acción."
        });
      }

      const { nombre } = req.body;

      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          ok: false,
          msg: "El nombre del tipo de insumo es requerido"
        });
      }

      const tipoExistente = await prisma.tipo_insumo.findFirst({
        where: {
          nombre: nombre.trim(),
          deleted_at: null
        }
      });

      if (tipoExistente) {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un tipo de insumo con este nombre"
        });
      }

      const tipoInsumo = await prisma.tipo_insumo.create({
        data: {
          nombre: nombre.trim()
        }
      });

      return res.status(201).json({
        ok: true,
        msg: "Tipo de insumo creado exitosamente",
        data: tipoInsumo
      });

    } catch (error) {
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un tipo de insumo con este nombre"
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error al crear el tipo de insumo"
      });
    }
  }

  static async update(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'contable') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para actualizar tipos de insumo. Solo administradores y contables pueden realizar esta acción."
        });
      }

      const { id } = req.params;
      const { nombre } = req.body;

      const tipoInsumoId = parseInt(id);

      const tipoExistente = await prisma.tipo_insumo.findFirst({
        where: { 
          tipo_insumo_id: tipoInsumoId,
          deleted_at: null 
        }
      });

      if (!tipoExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Tipo de insumo no encontrado"
        });
      }

      if (nombre !== undefined) {
        if (!nombre || nombre.trim() === '') {
          return res.status(400).json({
            ok: false,
            msg: "El nombre del tipo de insumo es requerido"
          });
        }

        if (nombre.trim() !== tipoExistente.nombre) {
          const tipoConMismoNombre = await prisma.tipo_insumo.findFirst({
            where: {
              nombre: nombre.trim(),
              tipo_insumo_id: { not: tipoInsumoId },
              deleted_at: null
            }
          });

          if (tipoConMismoNombre) {
            return res.status(400).json({
              ok: false,
              msg: "Ya existe otro tipo de insumo con este nombre"
            });
          }
        }
      }

      const tipoActualizado = await prisma.tipo_insumo.update({
        where: { tipo_insumo_id: tipoInsumoId },
        data: {
          nombre: nombre ? nombre.trim() : tipoExistente.nombre
        }
      });

      return res.json({
        ok: true,
        msg: "Tipo de insumo actualizado exitosamente",
        data: tipoActualizado
      });

    } catch (error) {      
      if (error.code === 'P2002') {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un tipo de insumo con este nombre"
        });
      }

      if (error.code === 'P2025') {
        return res.status(404).json({
          ok: false,
          msg: "Tipo de insumo no encontrado"
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar el tipo de insumo"
      });
    }
  }

  static async delete(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'contable') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para eliminar tipos de insumo. Solo administradores y contables pueden realizar esta acción."
        });
      }

      const { id } = req.params;
      const tipoInsumoId = parseInt(id);

      if (isNaN(tipoInsumoId)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID del tipo de insumo debe ser un número válido"
        });
      }

      const tipoExistente = await prisma.tipo_insumo.findFirst({
        where: { 
          tipo_insumo_id: tipoInsumoId,
          deleted_at: null 
        },
        include: {
          _count: {
            select: {
              insumos: {
                where: {
                  deleted_at: null
                }
              }
            }
          }
        }
      });

      if (!tipoExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Tipo de insumo no encontrado"
        });
      }

      if (tipoExistente._count.insumos > 0) {
        return res.status(400).json({
          ok: false,
          msg: "No se puede eliminar el tipo de insumo porque tiene insumos asociados"
        });
      }

      await prisma.tipo_insumo.update({
        where: { tipo_insumo_id: tipoInsumoId },
        data: { deleted_at: new Date() }
      });

      return res.json({
        ok: true,
        msg: "Tipo de insumo eliminado exitosamente"
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al eliminar el tipo de insumo"
      });
    }
  }
}
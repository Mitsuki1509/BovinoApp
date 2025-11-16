import prisma from "../database.js";

export default class MataderoController {

  static async getAll(req, res) {
    try {
      const mataderos = await prisma.mataderos.findMany({
        where: { 
          deleted_at: null 
        },
        orderBy: {
          ubicacion: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: mataderos
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener los mataderos",
        error: error.message
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const mataderoId = parseInt(id);

      if (isNaN(mataderoId)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID del matadero debe ser un número válido"
        });
      }

      const matadero = await prisma.mataderos.findFirst({
        where: { 
          matadero_id: mataderoId,
          deleted_at: null 
        }
      });

      if (!matadero) {
        return res.status(404).json({
          ok: false,
          msg: "Matadero no encontrado"
        });
      }

      return res.json({
        ok: true,
        data: matadero
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener el matadero",
        error: error.message
      });
    }
  }

  static async create(req, res) {
    try {
      const rolesPermitidos = ['admin', 'operario'];
      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para crear mataderos. Solo administradores y operarios pueden realizar esta acción."
        });
      }

      const { ubicacion } = req.body;

      if (!ubicacion || ubicacion.trim() === '') {
        return res.status(400).json({
          ok: false,
          msg: "La ubicación del matadero es requerida"
        });
      }

      const mataderoExistente = await prisma.mataderos.findFirst({
        where: { 
          ubicacion: ubicacion.trim(),
          deleted_at: null 
        }
      });

      if (mataderoExistente) {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un matadero en esta ubicación"
        });
      }

      const nuevoMatadero = await prisma.mataderos.create({
        data: {
          ubicacion: ubicacion.trim()
        }
      });

      return res.status(201).json({
        ok: true,
        msg: "Matadero creado exitosamente",
        data: nuevoMatadero
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al crear el matadero",
        error: error.message
      });
    }
  }

  static async update(req, res) {
    try {
      const rolesPermitidos = ['admin', 'operario'];
      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para actualizar mataderos. Solo administradores y operarios pueden realizar esta acción."
        });
      }

      const { id } = req.params;
      const { ubicacion } = req.body;

      const mataderoId = parseInt(id);

      if (isNaN(mataderoId)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID del matadero debe ser un número válido"
        });
      }

      const mataderoExistente = await prisma.mataderos.findFirst({
        where: { 
          matadero_id: mataderoId,
          deleted_at: null 
        }
      });

      if (!mataderoExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Matadero no encontrado"
        });
      }

      if (ubicacion && ubicacion.trim() !== '') {
        const mataderoConMismaUbicacion = await prisma.mataderos.findFirst({
          where: { 
            ubicacion: ubicacion.trim(),
            matadero_id: { not: mataderoId },
            deleted_at: null 
          }
        });

        if (mataderoConMismaUbicacion) {
          return res.status(400).json({
            ok: false,
            msg: "Ya existe otro matadero en esta ubicación"
          });
        }
      }

      const updateData = {};
      if (ubicacion !== undefined) updateData.ubicacion = ubicacion.trim();

      const mataderoActualizado = await prisma.mataderos.update({
        where: { matadero_id: mataderoId },
        data: updateData
      });

      return res.json({
        ok: true,
        msg: "Matadero actualizado exitosamente",
        data: mataderoActualizado
      });

    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          ok: false,
          msg: "Matadero no encontrado"
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar el matadero",
        error: error.message
      });
    }
  }

  static async delete(req, res) {
    try {
      if (req.usuario.rol !== 'admin') {
        return res.status(403).json({
          ok: false,
          msg: "Solo los administradores pueden eliminar mataderos"
        });
      }

      const { id } = req.params;
      const mataderoId = parseInt(id);

      if (isNaN(mataderoId)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID del matadero debe ser un número válido"
        });
      }

      const matadero = await prisma.mataderos.findFirst({
        where: { 
          matadero_id: mataderoId,
          deleted_at: null 
        },
        include: {
          producciones_carne: {
            where: {
              deleted_at: null
            }
          }
        }
      });

      if (!matadero) {
        return res.status(404).json({
          ok: false,
          msg: "Matadero no encontrado"
        });
      }

      if (matadero.producciones_carne.length > 0) {
        return res.status(400).json({
          ok: false,
          msg: "No se puede eliminar el matadero porque tiene producciones de carne asociadas"
        });
      }

      await prisma.mataderos.update({
        where: { matadero_id: mataderoId },
        data: { 
          deleted_at: new Date() 
        }
      });

      return res.json({
        ok: true,
        msg: "Matadero eliminado exitosamente"
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al eliminar el matadero"
      });
    }
  }
}
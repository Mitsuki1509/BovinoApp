import prisma from "../database.js";

export default class PotreroController {

  static async getAll(req, res) {
    try {
      const potreros = await prisma.potreros.findMany({
        where: { 
          deleted_at: null 
        },
        orderBy: {
          ubicacion: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: potreros
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener los potreros"
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const potrero = await prisma.potreros.findUnique({
        where: { 
          potrero_id: parseInt(id),
          deleted_at: null 
        }
      });

      if (!potrero) {
        return res.status(404).json({
          ok: false,
          msg: "Potrero no encontrado"
        });
      }

      return res.json({
        ok: true,
        data: potrero
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener el potrero"
      });
    }
  }

  static async create(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'operario') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para crear potreros. Solo administradores y operarios pueden realizar esta acción."
        });
      }

      const { ubicacion } = req.body;

      if (!ubicacion || ubicacion.trim() === '') {
        return res.status(400).json({
          ok: false,
          msg: "La ubicación es requerida"
        });
      }

      const potreroExistente = await prisma.potreros.findFirst({
        where: { 
          ubicacion: ubicacion.trim(),
          deleted_at: null 
        }
      });

      if (potreroExistente) {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un potrero con esta ubicación"
        });
      }

      const potrero = await prisma.potreros.create({
        data: {
          ubicacion: ubicacion.trim()
        }
      });

      return res.status(201).json({
        ok: true,
        msg: "Potrero creado exitosamente",
        data: potrero
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al crear el potrero"
      });
    }
  }

  static async update(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'operario') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para actualizar potreros. Solo administradores y operarios pueden realizar esta acción."
        });
      }

      const { id } = req.params;
      const { ubicacion } = req.body;

      const potreroId = parseInt(id);

      const potreroExistente = await prisma.potreros.findUnique({
        where: { 
          potrero_id: potreroId,
          deleted_at: null 
        }
      });

      if (!potreroExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Potrero no encontrado"
        });
      }

      if (ubicacion && ubicacion.trim() !== '') {
        const ubicacionExistente = await prisma.potreros.findFirst({
          where: { 
            ubicacion: ubicacion.trim(),
            deleted_at: null,
            potrero_id: { not: potreroId }
          }
        });

        if (ubicacionExistente) {
          return res.status(400).json({
            ok: false,
            msg: "Ya existe otro potrero con esta ubicación"
          });
        }
      }

      const potreroActualizado = await prisma.potreros.update({
        where: { potrero_id: potreroId },
        data: {
          ubicacion: ubicacion ? ubicacion.trim() : potreroExistente.ubicacion
        }
      });

      return res.json({
        ok: true,
        msg: "Potrero actualizado exitosamente",
        data: potreroActualizado
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar el potrero"
      });
    }
  }

  static async delete(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'operario') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para eliminar potreros. Solo administradores y operarios pueden realizar esta acción."
        });
      }

      const { id } = req.params;
      const potreroId = parseInt(id);

      const potreroExistente = await prisma.potreros.findUnique({
        where: { potrero_id: potreroId }
      });

      if (!potreroExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Potrero no encontrado"
        });
      }

      const lotesConPotrero = await prisma.lotes.findMany({
        where: {
          potrero_id: potreroId,
          deleted_at: null
        }
      });

      if (lotesConPotrero.length > 0) {
        return res.status(400).json({
          ok: false,
          msg: "No se puede eliminar el potrero porque está asignado a uno o más lotes"
        });
      }

      await prisma.potreros.update({
        where: { potrero_id: potreroId },
        data: { deleted_at: new Date() }
      });

      return res.json({
        ok: true,
        msg: "Potrero eliminado exitosamente"
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al eliminar el potrero"
      });
    }
  }

}
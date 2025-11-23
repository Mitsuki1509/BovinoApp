import prisma from "../database.js";

export default class RazaController {

  static async getAll(req, res) {
    try {
      const razas = await prisma.razas.findMany({
        where: { 
          deleted_at: null 
        },
        orderBy: {
          nombre: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: razas
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener las razas"
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const raza = await prisma.razas.findFirst({
        where: { 
          raza_id: parseInt(id),
          deleted_at: null 
        }
      });

      if (!raza) {
        return res.status(404).json({
          ok: false,
          msg: "Raza no encontrada"
        });
      }

      return res.json({
        ok: true,
        data: raza
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener la raza"
      });
    }
  }

  static async create(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'veterinario' && req.usuario.rol !== 'operario') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para crear razas"
        });
      }

      const { nombre, descripcion } = req.body;

      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          ok: false,
          msg: "El nombre de la raza es requerido"
        });
      }

      const razaExistente = await prisma.razas.findFirst({
        where: { 
          nombre: nombre.trim(),
          deleted_at: null 
        }
      });

      if (razaExistente) {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe una raza con este nombre"
        });
      }

      const razaEliminada = await prisma.razas.findFirst({
        where: { 
          nombre: nombre.trim(),
          deleted_at: { not: null }
        }
      });

      let nuevaRaza;

      if (razaEliminada) {
        nuevaRaza = await prisma.razas.update({
          where: { raza_id: razaEliminada.raza_id },
          data: {
            nombre: nombre.trim(),
            descripcion: descripcion?.trim() || null,
            deleted_at: null
          }
        });
      } else {
        nuevaRaza = await prisma.razas.create({
          data: {
            nombre: nombre.trim(),
            descripcion: descripcion?.trim() || null
          }
        });
      }

      return res.status(201).json({
        ok: true,
        msg: razaEliminada ? "Raza reactivada exitosamente" : "Raza creada exitosamente",
        data: nuevaRaza
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al crear la raza"
      });
    }
  }

  static async update(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'veterinario' && req.usuario.rol !== 'operario') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para actualizar razas"
        });
      }

      const { id } = req.params;
      const { nombre, descripcion } = req.body;

      const razaExistente = await prisma.razas.findFirst({
        where: { 
          raza_id: parseInt(id),
          deleted_at: null 
        }
      });

      if (!razaExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Raza no encontrada"
        });
      }

      if (nombre && nombre.trim() !== '') {
        const razaConMismoNombre = await prisma.razas.findFirst({
          where: { 
            nombre: nombre.trim(),
            raza_id: { not: parseInt(id) },
            deleted_at: null 
          }
        });

        if (razaConMismoNombre) {
          return res.status(400).json({
            ok: false,
            msg: "Ya existe otra raza con este nombre"
          });
        }
      }

      const razaActualizada = await prisma.razas.update({
        where: { raza_id: parseInt(id) },
        data: {
          ...(nombre && { nombre: nombre.trim() }),
          ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null })
        }
      });

      return res.json({
        ok: true,
        msg: "Raza actualizada exitosamente",
        data: razaActualizada
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar la raza"
      });
    }
  }

  static async delete(req, res) {
    try {
      if (req.usuario.rol !== 'admin' || req.usuario.rol !== 'operario' || req.usuario.rol !== 'veterinario') {
        return res.status(403).json({
          ok: false,
          msg: "Solo los administradores pueden eliminar razas"
        });
      }

      const { id } = req.params;

      const raza = await prisma.razas.findFirst({
        where: { 
          raza_id: parseInt(id),
          deleted_at: null 
        }
      });

      if (!raza) {
        return res.status(404).json({
          ok: false,
          msg: "Raza no encontrada"
        });
      }

      const animalesConRaza = await prisma.animales.findFirst({
        where: { 
          raza_id: parseInt(id),
          deleted_at: null 
        }
      });

      if (animalesConRaza) {
        return res.status(400).json({
          ok: false,
          msg: "No se puede eliminar la raza porque está asignada a uno o más animales"
        });
      }

      await prisma.razas.update({
        where: { raza_id: parseInt(id) },
        data: { 
          deleted_at: new Date() 
        }
      });

      return res.json({
        ok: true,
        msg: "Raza eliminada exitosamente"
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al eliminar la raza"
      });
    }
  }

}
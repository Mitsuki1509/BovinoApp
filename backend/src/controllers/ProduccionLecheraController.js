import prisma from "../database.js";

export default class ProduccionLecheraController {

  static async generarNumeroProduccion() {
    try {
      const totalProducciones = await prisma.produccion_lechera.count();
      return `LEC-${(totalProducciones + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      const timestamp = Date.now();
      return `LEC-${timestamp.toString().slice(-4)}`;
    }
  }

  static async getAll(req, res) {
    try {
      const producciones = await prisma.produccion_lechera.findMany({
        where: { 
          deleted_at: null 
        },
        include: {
          animal: {
            select: {
              animal_id: true,
              arete: true,
            }
          },
          unidad: {
            select: {
              unidad_id: true,
              nombre: true,
            }
          }
        },
        orderBy: {
          fecha: 'desc'
        }
      });

      return res.json({
        ok: true,
        data: producciones
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener las producciones lecheras",
        error: error.message
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const produccionId = parseInt(id);

      if (isNaN(produccionId)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID de la producción debe ser un número válido"
        });
      }

      const produccion = await prisma.produccion_lechera.findFirst({
        where: { 
          produccion_id: produccionId,
          deleted_at: null 
        },
        include: {
          animal: {
            select: {
              animal_id: true,
              arete: true,
            }
          },
          unidad: {
            select: {
              unidad_id: true,
              nombre: true,
            }
          }
        }
      });

      if (!produccion) {
        return res.status(404).json({
          ok: false,
          msg: "Producción lechera no encontrada"
        });
      }

      return res.json({
        ok: true,
        data: produccion
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener la producción lechera",
        error: error.message
      });
    }
  }

  static async create(req, res) {
    try {
      const rolesPermitidos = ['admin', 'ordeño'];
      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para registrar producciones lecheras. Solo administradores y personal de ordeño pueden realizar esta acción."
        });
      }

      const {
        animal_id,
        unidad_id,
        cantidad,
        fecha,
        descripcion
      } = req.body;

      if (!animal_id || animal_id === 'null' || animal_id === '') {
        return res.status(400).json({
          ok: false,
          msg: "El animal es requerido"
        });
      }

      if (!unidad_id || unidad_id === 'null' || unidad_id === '') {
        return res.status(400).json({
          ok: false,
          msg: "La unidad de medida es requerida"
        });
      }

      if (!cantidad || cantidad <= 0) {
        return res.status(400).json({
          ok: false,
          msg: "La cantidad es requerida y debe ser mayor a 0"
        });
      }

      if (!fecha) {
        return res.status(400).json({
          ok: false,
          msg: "La fecha de producción es requerida"
        });
      }

      const animalId = parseInt(animal_id);
      const unidadId = parseInt(unidad_id);

      const animal = await prisma.animales.findFirst({
        where: { 
          animal_id: animalId,
          deleted_at: null 
        }
      });

      if (!animal) {
        return res.status(400).json({
          ok: false,
          msg: "El animal especificado no existe"
        });
      }

      if (animal.sexo !== 'H') {
        return res.status(400).json({
          ok: false,
          msg: "Solo los animales hembra pueden tener producción lechera"
        });
      }

      const unidad = await prisma.unidades.findFirst({
        where: { 
          unidad_id: unidadId,
          deleted_at: null 
        }
      });

      if (!unidad) {
        return res.status(400).json({
          ok: false,
          msg: "La unidad especificada no existe"
        });
      }

      const produccionExistente = await prisma.produccion_lechera.findFirst({
        where: { 
          animal_id: animalId,
          fecha: new Date(fecha),
          deleted_at: null 
        }
      });

      if (produccionExistente) {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe una producción lechera registrada para este animal en la fecha especificada"
        });
      }

      const numeroProduccion = await ProduccionLecheraController.generarNumeroProduccion();

      const data = {
        animal_id: animalId,
        unidad_id: unidadId,
        numero_produccion: numeroProduccion,
        cantidad: parseInt(cantidad),
        fecha: new Date(fecha)
      };

      if (descripcion && descripcion.trim() !== '') {
        data.descripcion = descripcion;
      }

      const nuevaProduccion = await prisma.produccion_lechera.create({
        data: data,
        include: {
          animal: {
            select: {
              animal_id: true,
              arete: true,
            }
          },
          unidad: {
            select: {
              unidad_id: true,
              nombre: true,
            }
          }
        }
      });

      return res.status(201).json({
        ok: true,
        msg: "Producción lechera registrada exitosamente",
        data: nuevaProduccion
      });

    } catch (error) {
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe una producción lechera para este animal con la fecha de hoy"
        });
      }

      if (error.code === 'P2003') {
        const field = error.meta?.field_name || 'campo';
        return res.status(400).json({
          ok: false,
          msg: `Error de referencia: El ${field} no existe`
        });
      }

      if (error.name === 'PrismaClientValidationError') {
        return res.status(400).json({
          ok: false,
          msg: "Error de validación: Verifique que todos los campos sean correctos",
          error: error.message
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error interno del servidor al crear la producción lechera",
        error: error.message,
        code: error.code
      });
    }
  }

  static async update(req, res) {
    try {
      const rolesPermitidos = ['admin', 'ordeño'];
      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para actualizar producciones lecheras. Solo administradores y personal de ordeño pueden realizar esta acción."
        });
      }

      const { id } = req.params;
      const {
        animal_id,
        unidad_id,
        cantidad,
        fecha,
        descripcion
      } = req.body;

      const produccionId = parseInt(id);

      if (isNaN(produccionId)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID de la producción debe ser un número válido"
        });
      }

      const produccionExistente = await prisma.produccion_lechera.findFirst({
        where: { 
          produccion_id: produccionId,
          deleted_at: null 
        }
      });

      if (!produccionExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Producción lechera no encontrada"
        });
      }

      if (cantidad !== undefined && cantidad <= 0) {
        return res.status(400).json({
          ok: false,
          msg: "La cantidad debe ser mayor a 0"
        });
      }

      if (animal_id !== undefined) {
        const animalId = parseInt(animal_id);
        const animal = await prisma.animales.findFirst({
          where: { 
            animal_id: animalId,
            deleted_at: null 
          }
        });

        if (!animal) {
          return res.status(400).json({
            ok: false,
            msg: "El animal especificado no existe"
          });
        }

        if (animal.sexo !== 'H') {
          return res.status(400).json({
            ok: false,
            msg: "Solo los animales hembra pueden tener producción lechera"
          });
        }
      }

      if (unidad_id !== undefined) {
        const unidadId = parseInt(unidad_id);
        const unidad = await prisma.unidades.findFirst({
          where: { 
            unidad_id: unidadId,
            deleted_at: null 
          }
        });

        if (!unidad) {
          return res.status(400).json({
            ok: false,
            msg: "La unidad especificada no existe"
          });
        }
      }

      if ((animal_id !== undefined || fecha !== undefined)) {
        const animalId = animal_id ? parseInt(animal_id) : produccionExistente.animal_id;
        const fechaProduccion = fecha ? new Date(fecha) : produccionExistente.fecha;

        const produccionDuplicada = await prisma.produccion_lechera.findFirst({
          where: { 
            animal_id: animalId,
            fecha: fechaProduccion,
            produccion_id: { not: produccionId },
            deleted_at: null 
          }
        });

        if (produccionDuplicada) {
          return res.status(400).json({
            ok: false,
            msg: "Ya existe otra producción lechera para este animal en la fecha especificada"
          });
        }
      }

      const updateData = {};

      if (animal_id !== undefined) updateData.animal_id = parseInt(animal_id);
      if (unidad_id !== undefined) updateData.unidad_id = parseInt(unidad_id);
      if (cantidad !== undefined) updateData.cantidad = parseInt(cantidad);
      if (fecha !== undefined) updateData.fecha = new Date(fecha);
      if (descripcion !== undefined) updateData.descripcion = descripcion;

      const produccionActualizada = await prisma.produccion_lechera.update({
        where: { produccion_id: produccionId },
        data: updateData,
        include: {
          animal: {
            select: {
              animal_id: true,
              arete: true,
            }
          },
          unidad: {
            select: {
              unidad_id: true,
              nombre: true,
            }
          }
        }
      });

      return res.json({
        ok: true,
        msg: "Producción lechera actualizada exitosamente",
        data: produccionActualizada
      });

    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe una producción lechera para este animal en la fecha especificada"
        });
      }

      if (error.code === 'P2025') {
        return res.status(404).json({
          ok: false,
          msg: "Producción lechera no encontrada"
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar la producción lechera",
        error: error.message
      });
    }
  }

  static async delete(req, res) {
    try {
      if (req.usuario.rol !== 'admin' || req.usuario.rol !== 'ordeño' ) {
        return res.status(403).json({
          ok: false,
          msg: "Solo los administradores pueden eliminar producciones lecheras"
        });
      }

      const { id } = req.params;
      const produccionId = parseInt(id);

      if (isNaN(produccionId)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID de la producción debe ser un número válido"
        });
      }

      const produccion = await prisma.produccion_lechera.findFirst({
        where: { 
          produccion_id: produccionId,
          deleted_at: null 
        }
      });

      if (!produccion) {
        return res.status(404).json({
          ok: false,
          msg: "Producción lechera no encontrada"
        });
      }

      await prisma.produccion_lechera.update({
        where: { produccion_id: produccionId },
        data: { 
          deleted_at: new Date() 
        }
      });

      return res.json({
        ok: true,
        msg: "Producción lechera eliminada exitosamente"
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al eliminar la producción lechera"
      });
    }
  }

  static async getByAnimal(req, res) {
    try {
      const { animalId } = req.params;
      const id = parseInt(animalId);

      if (isNaN(id)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID del animal debe ser un número válido"
        });
      }

      const animal = await prisma.animales.findFirst({
        where: { 
          animal_id: id,
          deleted_at: null 
        }
      });

      if (!animal) {
        return res.status(404).json({
          ok: false,
          msg: "Animal no encontrado"
        });
      }

      const producciones = await prisma.produccion_lechera.findMany({
        where: { 
          animal_id: id,
          deleted_at: null 
        },
        include: {
          unidad: {
            select: {
              unidad_id: true,
              nombre: true,
            }
          }
        },
        orderBy: {
          fecha: 'desc'
        }
      });

      return res.json({
        ok: true,
        data: {
          animal: animal,
          producciones: producciones
        }
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener las producciones lecheras del animal"
      });
    }
  }

  static async getUnidades(req, res) {
    try {
      const unidades = await prisma.unidades.findMany({
        where: { 
          deleted_at: null 
        },
        orderBy: {
          nombre: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: unidades
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener las unidades"
      });
    }
  }

  static async getByNumeroProduccion(req, res) {
    try {
      const { numero } = req.params;
      
      if (!numero) {
        return res.status(400).json({
          ok: false,
          msg: "El número de producción es requerido"
        });
      }

      const produccion = await prisma.produccion_lechera.findFirst({
        where: {
          numero_produccion: numero,
          deleted_at: null
        },
        include: {
          animal: {
            select: {
              animal_id: true,
              arete: true
            }
          },
          unidad: {
            select: {
              unidad_id: true,
              nombre: true,
            }
          }
        }
      });
      
      if(!produccion){
        return res.status(404).json({
          ok: false,
          msg: "Producción lechera no encontrada"
        });
      }
      
      return res.json({
        ok: true,
        data: produccion
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener la producción lechera"
      });
    }
  }
}
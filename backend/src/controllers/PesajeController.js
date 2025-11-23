import prisma from "../database.js";

export default class PesajeController {

  static async generarNumeroPesaje() {
    try {
      const totalPesajes = await prisma.pesajes.count();
      return `PES-${(totalPesajes + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      const timestamp = Date.now();
      return `PES-${timestamp.toString().slice(-4)}`;
    }
  }

  static async getAll(req, res) {
    try {
      const pesajes = await prisma.pesajes.findMany({
        where: { 
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
        },
        orderBy: {
          fecha: 'desc'
        }
      });

      return res.json({
        ok: true,
        data: pesajes
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener los pesajes",
        error: error.message
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const pesajeId = parseInt(id);

      const pesaje = await prisma.pesajes.findFirst({
        where: { 
          pesaje_id: pesajeId,
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

      if (!pesaje) {
        return res.status(404).json({
          ok: false,
          msg: "Pesaje no encontrado"
        });
      }

      return res.json({
        ok: true,
        data: pesaje
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener el pesaje",
        error: error.message
      });
    }
  }

  static async create(req, res) {
    try {
      const rolesPermitidos = ['admin', 'operario','veterinario'];
      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para crear pesajes. Solo administradores y operarios pueden realizar esta acción."
        });
      }

      const {
        animal_id,
        unidad_id,
        peso,
        fecha
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

      if (!peso || peso <= 0) {
        return res.status(400).json({
          ok: false,
          msg: "El peso es requerido y debe ser mayor a 0"
        });
      }

      if (!fecha) {
        return res.status(400).json({
          ok: false,
          msg: "La fecha del pesaje es requerida"
        });
      }

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

      const pesajeExistente = await prisma.pesajes.findFirst({
        where: { 
          animal_id: animalId,
          fecha: new Date(fecha),
          deleted_at: null 
        }
      });

      if (pesajeExistente) {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un pesaje para este animal en la fecha especificada"
        });
      }

      const numeroPesaje = await PesajeController.generarNumeroPesaje();

      const data = {
        animal_id: animalId,
        unidad_id: unidadId,
        numero_pesaje: numeroPesaje,
        peso: parseFloat(peso),
        fecha: new Date(fecha)
      };

      const nuevoPesaje = await prisma.pesajes.create({
        data: data,
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

      return res.status(201).json({
        ok: true,
        msg: "Pesaje creado exitosamente",
        data: nuevoPesaje
      });

    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un pesaje para este animal en la fecha especificada"
        });
      }

      if (error.code === 'P2003') {
        return res.status(400).json({
          ok: false,
          msg: "Error de referencia: El animal o la unidad no existen"
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error al crear el pesaje",
        error: error.message,
        fullError: error.toString()
      });
    }
  }

  static async update(req, res) {
    try {
      const rolesPermitidos = ['admin', 'operario', 'veterinario'];
      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para actualizar pesajes. Solo administradores y operarios pueden realizar esta acción."
        });
      }

      const { id } = req.params;
      const {
        animal_id,
        unidad_id,
        peso,
        fecha
      } = req.body;

      const pesajeId = parseInt(id);

      if (isNaN(pesajeId)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID del pesaje debe ser un número válido"
        });
      }

      const pesajeExistente = await prisma.pesajes.findFirst({
        where: { 
          pesaje_id: pesajeId,
          deleted_at: null 
        }
      });

      if (!pesajeExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Pesaje no encontrado"
        });
      }

      if (peso !== undefined && peso <= 0) {
        return res.status(400).json({
          ok: false,
          msg: "El peso debe ser mayor a 0"
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
        const animalId = animal_id ? parseInt(animal_id) : pesajeExistente.animal_id;
        const fechaPesaje = fecha ? new Date(fecha) : pesajeExistente.fecha;

        const pesajeDuplicado = await prisma.pesajes.findFirst({
          where: { 
            animal_id: animalId,
            fecha: fechaPesaje,
            pesaje_id: { not: pesajeId },
            deleted_at: null 
          }
        });

        if (pesajeDuplicado) {
          return res.status(400).json({
            ok: false,
            msg: "Ya existe otro pesaje para este animal en la fecha especificada"
          });
        }
      }

      const updateData = {};

      if (animal_id !== undefined) updateData.animal_id = parseInt(animal_id);
      if (unidad_id !== undefined) updateData.unidad_id = parseInt(unidad_id);
      if (peso !== undefined) updateData.peso = parseFloat(peso);
      if (fecha !== undefined) updateData.fecha = new Date(fecha);

      const pesajeActualizado = await prisma.pesajes.update({
        where: { pesaje_id: pesajeId },
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
        msg: "Pesaje actualizado exitosamente",
        data: pesajeActualizado
      });

    } catch (error) {
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un pesaje para este animal en la fecha especificada"
        });
      }

      if (error.code === 'P2025') {
        return res.status(404).json({
          ok: false,
          msg: "Pesaje no encontrado"
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar el pesaje",
        error: error.message
      });
    }
  }

  static async delete(req, res) {
    try {
      if (req.usuario.rol !== 'admin' || req.usuario.rol !== 'veterinario' || req.usuario.rol !== 'operario' ) {
        return res.status(403).json({
          ok: false,
          msg: "Solo los administradores pueden eliminar pesajes"
        });
      }

      const { id } = req.params;
      const pesajeId = parseInt(id);

      if (isNaN(pesajeId)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID del pesaje debe ser un número válido"
        });
      }

      const pesaje = await prisma.pesajes.findFirst({
        where: { 
          pesaje_id: pesajeId,
          deleted_at: null 
        }
      });

      if (!pesaje) {
        return res.status(404).json({
          ok: false,
          msg: "Pesaje no encontrado"
        });
      }

      await prisma.pesajes.update({
        where: { pesaje_id: pesajeId },
        data: { 
          deleted_at: new Date() 
        }
      });

      return res.json({
        ok: true,
        msg: "Pesaje eliminado exitosamente"
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al eliminar el pesaje"
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

      const pesajes = await prisma.pesajes.findMany({
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
          pesajes: pesajes
        }
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener los pesajes del animal"
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

  static async getByNumeroPesaje(req, res) {
    try {
      const { numero } = req.params;
      
      if (!numero) {
        return res.status(400).json({
          ok: false,
          msg: "El número de pesaje es requerido"
        });
      }

      const pesaje = await prisma.pesajes.findFirst({
        where: {
          numero_pesaje: numero,
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
      
      if(!pesaje){
        return res.status(404).json({
          ok: false,
          msg: "Pesaje no encontrado"
        });
      }
      
      return res.json({
        ok: true,
        data: pesaje
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener el pesaje"
      });
    }
  }

}
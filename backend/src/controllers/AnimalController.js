import prisma from "../database.js";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export default class AnimalController {

  static async getAnimales(req, res) {
    try {
      const animales = await prisma.animales.findMany({
        where: { 
          deleted_at: null 
        },
        include: {
          madre: {
            select: {
              animal_id: true,
              arete: true
            }
          },
          padre: {
            select: {
              animal_id: true,
              arete: true
            }
          },
          lote: {
            select: {
              lote_id: true,
              descripcion: true
            }
          },
          raza: {
            select: {
              raza_id: true,
              nombre: true
            }
          }
        },
        orderBy: {
          arete: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: animales
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener los animales"
      });
    }
  }

  static async getAnimalById(req, res) {
    try {
      const { id } = req.params;

      const animalId = parseInt(id);

      if (isNaN(animalId)) {
        return res.status(400).json({
          ok: false,
          msg: "El id del animal debe ser un número"
        });
      }

      const animal = await prisma.animales.findFirst({
        where: { 
          animal_id: animalId,
          deleted_at: null 
        },
        include: {
          madre: {
            select: {
              animal_id: true,
              arete: true,
              sexo: true,
              fecha_nacimiento: true
            }
          },
          padre: {
            select: {
              animal_id: true,
              arete: true,
              sexo: true,
              fecha_nacimiento: true
            }
          },
          lote: {
            select: {
              lote_id: true,
              descripcion: true
            }
          },
          raza: {
            select: {
              raza_id: true,
              nombre: true,
              descripcion: true
            }
          }
        }
      });

      if (!animal) {
        return res.status(404).json({
          ok: false,
          msg: "Animal no encontrado"
        });
      }

      return res.json({
        ok: true,
        data: animal
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener el animal"
      });
    }
  }

  static async createAnimal(req, res) {
    try {
      const rolesPermitidos = ['admin', 'veterinario', 'operario', 'contable'];
      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para crear animales. Solo administradores, veterinarios, operarios y contables pueden realizar esta acción."
        });
      }

      const {
        animal_madre_id,
        animal_padre_id,
        lote_id,
        raza_id,
        arete,
        sexo,
        fecha_destete,
        fecha_nacimiento
      } = req.body;

      if (!arete || arete.trim() === '') {
        return res.status(400).json({
          ok: false,
          msg: "El arete del animal es requerido"
        });
      }

      if (!sexo || !['M', 'H'].includes(sexo)) {
        return res.status(400).json({
          ok: false,
          msg: "El sexo debe ser 'M' (macho) o 'H' (hembra)"
        });
      }

      if (!fecha_nacimiento) {
        return res.status(400).json({
          ok: false,
          msg: "La fecha de nacimiento es requerida"
        });
      }

      const animalExistente = await prisma.animales.findFirst({
        where: { 
          arete: arete.trim(),
          deleted_at: null 
        }
      });

      if (animalExistente) {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un animal con este arete"
        });
      }

      if (animal_madre_id && animal_madre_id !== 'null' && animal_madre_id !== '') {
        const madreId = parseInt(animal_madre_id);
        const madre = await prisma.animales.findFirst({
          where: { 
            animal_id: madreId,
            deleted_at: null 
          }
        });

        if (!madre) {
          return res.status(400).json({
            ok: false,
            msg: "La madre especificada no existe"
          });
        }

        if (madre.sexo !== 'H') {
          return res.status(400).json({
            ok: false,
            msg: "El animal especificado como madre debe ser hembra"
          });
        }
      }

      if (animal_padre_id && animal_padre_id !== 'null' && animal_padre_id !== '') {
        const padreId = parseInt(animal_padre_id);
        const padre = await prisma.animales.findFirst({
          where: { 
            animal_id: padreId,
            deleted_at: null 
          }
        });

        if (!padre) {
          return res.status(400).json({
            ok: false,
            msg: "El padre especificado no existe"
          });
        }

        if (padre.sexo !== 'M') {
          return res.status(400).json({
            ok: false,
            msg: "El animal especificado como padre debe ser macho"
          });
        }
      }

      if (lote_id && lote_id !== 'null' && lote_id !== '') {
        const loteId = parseInt(lote_id);
        const lote = await prisma.lotes.findFirst({
          where: { 
            lote_id: loteId,
            deleted_at: null 
          }
        });

        if (!lote) {
          return res.status(400).json({
            ok: false,
            msg: "El lote especificado no existe"
          });
        }
      }

      if (raza_id && raza_id !== 'null' && raza_id !== '') {
        const razaId = parseInt(raza_id);
        const raza = await prisma.razas.findFirst({
          where: { 
            raza_id: razaId,
            deleted_at: null 
          }
        });

        if (!raza) {
          return res.status(400).json({
            ok: false,
            msg: "La raza especificada no existe"
          });
        }
      }

      const file = req.file;
      let imagenNombre = null;

      if (file) {
        const ext = path.extname(file.originalname);
        imagenNombre = crypto.randomUUID() + ext;

        await fs.writeFile(`./public/uploads/animal_images/${imagenNombre}`, file.buffer);
      }

      const fechaNacimientoDate = new Date(fecha_nacimiento);
      if (isNaN(fechaNacimientoDate.getTime())) {
        return res.status(400).json({
          ok: false,
          msg: "La fecha de nacimiento no es válida"
        });
      }

      let fechaDesteteDate = null;
      if (fecha_destete && fecha_destete !== 'null' && fecha_destete !== '') {
        fechaDesteteDate = new Date(fecha_destete);
        if (isNaN(fechaDesteteDate.getTime())) {
          fechaDesteteDate = null;
        }
      }


      const nuevoAnimal = await prisma.animales.create({
        data: {
          animal_madre_id: animal_madre_id && animal_madre_id !== 'null' && animal_madre_id !== '' 
            ? parseInt(animal_madre_id) 
            : null,
          animal_padre_id: animal_padre_id && animal_padre_id !== 'null' && animal_padre_id !== '' 
            ? parseInt(animal_padre_id) 
            : null,
          lote_id: lote_id && lote_id !== 'null' && lote_id !== '' 
            ? parseInt(lote_id) 
            : null,
          raza_id: raza_id && raza_id !== 'null' && raza_id !== '' 
            ? parseInt(raza_id) 
            : null,
          imagen: imagenNombre ? `http://localhost:3000/uploads/animal_images/${imagenNombre}` : null,
          arete: arete.trim(),
          sexo: sexo,
          fecha_destete: fechaDesteteDate,
          fecha_nacimiento: fechaNacimientoDate
        },
        include: {
          madre: {
            select: {
              animal_id: true,
              arete: true
            }
          },
          padre: {
            select: {
              animal_id: true,
              arete: true
            }
          },
          lote: {
            select: {
              lote_id: true,
              descripcion: true
            }
          },
          raza: {
            select: {
              raza_id: true,
              nombre: true
            }
          }
        }
      });

      return res.status(201).json({
        ok: true,
        msg: "Animal creado exitosamente",
        data: nuevoAnimal
      });

    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({
          ok: false,
          msg: "El número de arete ya existe en el sistema"
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error al crear el animal",
        error: error.message
      });
    }
  }

  static async updateAnimal(req, res) {
    try {
      const rolesPermitidos = ['admin', 'veterinario', 'operario', 'contable'];
      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para actualizar animales. Solo administradores, veterinarios, operarios y contables pueden realizar esta acción."
        });
      }

      const { id } = req.params;
      const {
        animal_madre_id,
        animal_padre_id,
        lote_id,
        raza_id,
        arete,
        sexo,
        fecha_destete,
        fecha_nacimiento
      } = req.body;

      const animalId = parseInt(id);

      if (isNaN(animalId)) {
        return res.status(400).json({
          ok: false,
          msg: "El id del animal debe ser un número"
        });
      }

      const animalExistente = await prisma.animales.findFirst({
        where: { 
          animal_id: animalId,
          deleted_at: null 
        }
      });

      if (!animalExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Animal no encontrado"
        });
      }

      if (arete && arete.trim() !== '') {
        const animalConMismoArete = await prisma.animales.findFirst({
          where: { 
            arete: arete.trim(),
            animal_id: { not: animalId },
            deleted_at: null 
          }
        });

        if (animalConMismoArete) {
          return res.status(400).json({
            ok: false,
            msg: "Ya existe otro animal con este arete"
          });
        }
      }

      if (sexo && !['M', 'H'].includes(sexo)) {
        return res.status(400).json({
          ok: false,
          msg: "El sexo debe ser 'M' (macho) o 'H' (hembra)"
        });
      }

      if (animal_madre_id !== undefined) {
        if (animal_madre_id === '' || animal_madre_id === 'null') {
        } else if (animal_madre_id) {
          const madreId = parseInt(animal_madre_id);
          const madre = await prisma.animales.findFirst({
            where: { 
              animal_id: madreId,
              deleted_at: null 
            }
          });

          if (!madre) {
            return res.status(400).json({
              ok: false,
              msg: "La madre especificada no existe"
            });
          }

          if (madre.sexo !== 'H') {
            return res.status(400).json({
              ok: false,
              msg: "El animal especificado como madre debe ser hembra"
            });
          }
        }
      }

      if (animal_padre_id !== undefined) {
        if (animal_padre_id === '' || animal_padre_id === 'null') {
        } else if (animal_padre_id) {
          const padreId = parseInt(animal_padre_id);
          const padre = await prisma.animales.findFirst({
            where: { 
              animal_id: padreId,
              deleted_at: null 
            }
          });

          if (!padre) {
            return res.status(400).json({
              ok: false,
              msg: "El padre especificado no existe"
            });
          }

          if (padre.sexo !== 'M') {
            return res.status(400).json({
              ok: false,
              msg: "El animal especificado como padre debe ser macho"
            });
          }
        }
      }

      if (lote_id !== undefined) {
        if (lote_id === '' || lote_id === 'null') {
        } else if (lote_id) {
          const loteId = parseInt(lote_id);
          const lote = await prisma.lotes.findFirst({
            where: { 
              lote_id: loteId,
              deleted_at: null 
            }
          });

          if (!lote) {
            return res.status(400).json({
              ok: false,
              msg: "El lote especificado no existe"
            });
          }
        }
      }

      if (raza_id !== undefined) {
        if (raza_id === '' || raza_id === 'null') {
        } else if (raza_id) {
          const razaId = parseInt(raza_id);
          const raza = await prisma.razas.findFirst({
            where: { 
              raza_id: razaId,
              deleted_at: null 
            }
          });

          if (!raza) {
            return res.status(400).json({
              ok: false,
              msg: "La raza especificada no existe"
            });
          }
        }
      }

      const file = req.file;
      let imagenNombre = null;

      if (file) {
        const ext = path.extname(file.originalname);
        imagenNombre = crypto.randomUUID() + ext;

        await fs.writeFile(`./public/uploads/animal_images/${imagenNombre}`, file.buffer);
      }

      const updateData = {};

      if (arete !== undefined) updateData.arete = arete.trim();
      if (sexo !== undefined) updateData.sexo = sexo;

      if (animal_madre_id !== undefined) {
        updateData.animal_madre_id = animal_madre_id && animal_madre_id !== 'null' && animal_madre_id !== '' 
          ? parseInt(animal_madre_id) 
          : null;
      }
      
      if (animal_padre_id !== undefined) {
        updateData.animal_padre_id = animal_padre_id && animal_padre_id !== 'null' && animal_padre_id !== '' 
          ? parseInt(animal_padre_id) 
          : null;
      }
      
      if (lote_id !== undefined) {
        updateData.lote_id = lote_id && lote_id !== 'null' && lote_id !== '' 
          ? parseInt(lote_id) 
          : null;
      }
      
      if (raza_id !== undefined) {
        updateData.raza_id = raza_id && raza_id !== 'null' && raza_id !== '' 
          ? parseInt(raza_id) 
          : null;
      }

      if (imagenNombre) {
        updateData.imagen = `http://localhost:3000/uploads/animal_images/${imagenNombre}`;
      }

      if (fecha_nacimiento && fecha_nacimiento !== 'null' && fecha_nacimiento !== '') {
        const fechaNacimientoDate = new Date(fecha_nacimiento);
        if (!isNaN(fechaNacimientoDate.getTime())) {
          updateData.fecha_nacimiento = fechaNacimientoDate;
        }
      }

      if (fecha_destete !== undefined) {
        if (fecha_destete && fecha_destete !== 'null' && fecha_destete !== '') {
          const fechaDesteteDate = new Date(fecha_destete);
          if (!isNaN(fechaDesteteDate.getTime())) {
            updateData.fecha_destete = fechaDesteteDate;
          }
        } else {
          updateData.fecha_destete = null;
        }
      }

      const animalActualizado = await prisma.animales.update({
        where: { animal_id: animalId },
        data: updateData,
        include: {
          madre: {
            select: {
              animal_id: true,
              arete: true
            }
          },
          padre: {
            select: {
              animal_id: true,
              arete: true
            }
          },
          lote: {
            select: {
              lote_id: true,
              descripcion: true
            }
          },
          raza: {
            select: {
              raza_id: true,
              nombre: true
            }
          }
        }
      });

      return res.json({
        ok: true,
        msg: "Animal actualizado exitosamente",
        data: animalActualizado
      });

    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({
          ok: false,
          msg: "El número de arete ya existe en el sistema"
        });
      }

      if (error.code === 'P2025') {
        return res.status(404).json({
          ok: false,
          msg: "Animal no encontrado"
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar el animal",
        error: error.message
      });
    }
  }

  static async deleteAnimal(req, res) {
    try {
      if (req.usuario.rol !== 'admin') {
        return res.status(403).json({
          ok: false,
          msg: "Solo los administradores pueden eliminar animales"
        });
      }

      const { id } = req.params;

      const animalId = parseInt(id);

      if (isNaN(animalId)) {
        return res.status(400).json({
          ok: false,
          msg: "El id del animal debe ser un número"
        });
      }

      const animal = await prisma.animales.findFirst({
        where: { 
          animal_id: animalId,
          deleted_at: null 
        }
      });

      if (!animal) {
        return res.status(404).json({
          ok: false,
          msg: "Animal no encontrado"
        });
      }

      const hijosConMadre = await prisma.animales.findFirst({
        where: { 
          animal_madre_id: animalId,
          deleted_at: null 
        }
      });

      const hijosConPadre = await prisma.animales.findFirst({
        where: { 
          animal_padre_id: animalId,
          deleted_at: null 
        }
      });

      if (hijosConMadre || hijosConPadre) {
        return res.status(400).json({
          ok: false,
          msg: "No se puede eliminar el animal porque es padre/madre de otros animales"
        });
      }

      await prisma.animales.update({
        where: { animal_id: animalId },
        data: { 
          deleted_at: new Date() 
        }
      });

      return res.json({
        ok: true,
        msg: "Animal eliminado exitosamente"
      });

    } catch (error) {
      console.error('Error en deleteAnimal:', error);
      return res.status(500).json({
        ok: false,
        msg: "Error al eliminar el animal"
      });
    }
  }

  static async searchAnimales(req, res) {
    try {
      const { query } = req.query;

      if (!query || !query.trim()) {
        return res.status(400).json({
          ok: false,
          msg: "El término de búsqueda es requerido"
        });
      }

      const animales = await prisma.animales.findMany({
        where: {
          AND: [
            { deleted_at: null },
            {
              OR: [
                { arete: { contains: query.trim(), mode: 'insensitive' } }
              ]
            }
          ]
        },
        include: {
          madre: {
            select: {
              animal_id: true,
              arete: true
            }
          },
          padre: {
            select: {
              animal_id: true,
              arete: true
            }
          },
          lote: {
            select: {
              lote_id: true,
              descripcion: true
            }
          },
          raza: {
            select: {
              raza_id: true,
              nombre: true
            }
          }
        },
        orderBy: {
          arete: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: animales
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al buscar animales"
      });
    }
  }
}
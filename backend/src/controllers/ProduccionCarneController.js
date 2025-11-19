import prisma from "../database.js";

export default class ProduccionCarneController {

  static async getAll(req, res) {
    try {
      const producciones = await prisma.produccion_carne.findMany({
        where: { 
          deleted_at: null 
        },
        include: {
          animal: {
            select: {
              animal_id: true,
              arete: true,
              sexo: true,
              fecha_nacimiento: true
            }
          },
          matadero: {
            select: {
              matadero_id: true,
              ubicacion: true
            }
          },
          pesaje: {
            select: {
              pesaje_id: true,
              peso: true,
              fecha: true
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
        msg: "Error al obtener las producciones de carne",
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

      const produccion = await prisma.produccion_carne.findFirst({
        where: { 
          produccion_id: produccionId,
          deleted_at: null 
        },
        include: {
          animal: {
            select: {
              animal_id: true,
              arete: true,
              sexo: true,
              fecha_nacimiento: true,
              raza: {
                select: {
                  nombre: true
                }
              }
            }
          },
          matadero: {
            select: {
              matadero_id: true,
              ubicacion: true
            }
          },
          pesaje: {
            select: {
              pesaje_id: true,
              peso: true,
              fecha: true,
              unidad: {
                select: {
                  nombre: true
                }
              }
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
          msg: "Producción de carne no encontrada"
        });
      }

      return res.json({
        ok: true,
        data: produccion
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener la producción de carne",
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
        msg: "No tienes permisos para registrar producciones de carne. Solo administradores y operarios pueden realizar esta acción."
      });
    }

    const {
      animal_id,
      matadero_id,
      pesaje_id,
      unidad_id,
      peso_canal,
      fecha
    } = req.body;

    console.log('🔍 Datos recibidos:', req.body);

    // Validaciones de campos requeridos
    if (!animal_id || animal_id === 'null' || animal_id === '') {
      return res.status(400).json({
        ok: false,
        msg: "El animal es requerido"
      });
    }

    if (!matadero_id || matadero_id === 'null' || matadero_id === '') {
      return res.status(400).json({
        ok: false,
        msg: "El matadero es requerido"
      });
    }

    if (!unidad_id || unidad_id === 'null' || unidad_id === '') {
      return res.status(400).json({
        ok: false,
        msg: "La unidad de medida es requerida"
      });
    }

    if (!peso_canal || peso_canal <= 0) {
      return res.status(400).json({
        ok: false,
        msg: "El peso de la canal es requerido y debe ser mayor a 0"
      });
    }

    if (!fecha) {
      return res.status(400).json({
        ok: false,
        msg: "La fecha de producción es requerida"
      });
    }

    // Convertir IDs a números
    const animalId = parseInt(animal_id);
    const mataderoId = parseInt(matadero_id);
    const unidadId = parseInt(unidad_id);

    // Validar que el animal existe y está activo
    const animal = await prisma.animales.findFirst({
      where: { 
        animal_id: animalId,
        deleted_at: null 
      },
      include: {
        raza: {
          select: {
            nombre: true
          }
        }
      }
    });

    if (!animal) {
      return res.status(400).json({
        ok: false,
        msg: "El animal especificado no existe o ya fue dado de baja"
      });
    }

    console.log('🔍 Animal encontrado:', animal.arete);

    // Validar que el matadero existe
    const matadero = await prisma.mataderos.findFirst({
      where: { 
        matadero_id: mataderoId,
        deleted_at: null 
      }
    });

    if (!matadero) {
      return res.status(400).json({
        ok: false,
        msg: "El matadero especificado no existe"
      });
    }

    // Validar que la unidad existe
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

    let pesajeId = null;

    // Si no se proporciona pesaje_id, crear uno automáticamente
    if (!pesaje_id || pesaje_id === 'null' || pesaje_id === '') {
      console.log('🔍 Creando pesaje automáticamente...');
      
      // Generar número de pesaje único
      const ultimoPesaje = await prisma.pesajes.findFirst({
        orderBy: { pesaje_id: 'desc' }
      });
      
      const numeroPesaje = ultimoPesaje ? 
        `PES-${String(ultimoPesaje.pesaje_id + 1).padStart(4, '0')}` : 
        'PES-0001';

      // Crear el pesaje automáticamente
      const nuevoPesaje = await prisma.pesajes.create({
        data: {
          animal_id: animalId,
          unidad_id: unidadId,
          peso: parseFloat(peso_canal),
          fecha: new Date(fecha),
          numero_pesaje: numeroPesaje
        }
      });

      pesajeId = nuevoPesaje.pesaje_id;
      console.log('🔍 Pesaje creado automáticamente con ID:', pesajeId);
    } else {
      // Usar el pesaje_id proporcionado
      pesajeId = parseInt(pesaje_id);
      const pesaje = await prisma.pesajes.findFirst({
        where: { 
          pesaje_id: pesajeId,
          deleted_at: null 
        }
      });

      if (!pesaje) {
        return res.status(400).json({
          ok: false,
          msg: "El pesaje especificado no existe"
        });
      }
    }

    // Verificar que no exista ya una producción para este animal
    const produccionExistente = await prisma.produccion_carne.findFirst({
      where: { 
        animal_id: animalId,
        deleted_at: null 
      }
    });

    if (produccionExistente) {
      return res.status(400).json({
        ok: false,
        msg: "Ya existe una producción de carne registrada para este animal"
      });
    }

    console.log('🔍 Iniciando transacción para crear producción y dar de baja animal...');

    // Usar transacción para asegurar que ambas operaciones se completen
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear la producción de carne
      const nuevaProduccion = await tx.produccion_carne.create({
        data: {
          animal_id: animalId,
          matadero_id: mataderoId,
          pesaje_id: pesajeId,
          unidad_id: unidadId,
          peso_canal: parseFloat(peso_canal),
          fecha: new Date(fecha)
        },
        include: {
          animal: {
            select: {
              animal_id: true,
              arete: true,
              sexo: true,
              fecha_nacimiento: true,
              raza: {
                select: {
                  nombre: true
                }
              }
            }
          },
          matadero: {
            select: {
              matadero_id: true,
              ubicacion: true
            }
          },
          pesaje: {
            select: {
              pesaje_id: true,
              peso: true,
              fecha: true,
              numero_pesaje: true
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

      console.log('🔍 Producción creada:', nuevaProduccion.produccion_id);

      // 2. Hacer soft delete del animal (marcar como eliminado)
      const animalActualizado = await tx.animales.update({
        where: { animal_id: animalId },
        data: { 
          deleted_at: new Date()
        },
        select: {
          animal_id: true,
          arete: true,
          deleted_at: true
        }
      });

      console.log('🔍 Animal marcado como eliminado:', animalActualizado.animal_id);

      return nuevaProduccion;
    });

    console.log('🔍 Transacción completada exitosamente');

    return res.status(201).json({
      ok: true,
      msg: `Producción de carne registrada exitosamente para el animal ${animal.arete}. El animal ha sido dado de baja del sistema.`,
      data: result
    });

  } catch (error) {
    console.error('❌ ERROR en create:', error);
    
    // Manejo específico de errores de Prisma
    if (error.code === 'P2002') {
      return res.status(400).json({
        ok: false,
        msg: "Ya existe una producción de carne registrada para este animal"
      });
    }

    if (error.code === 'P2003') {
      const field = error.meta?.field_name || '';
      let campo = 'campo referenciado';
      
      if (field.includes('animal_id')) campo = 'animal';
      else if (field.includes('matadero_id')) campo = 'matadero';
      else if (field.includes('unidad_id')) campo = 'unidad';
      else if (field.includes('pesaje_id')) campo = 'pesaje';
      
      return res.status(400).json({
        ok: false,
        msg: `Error de referencia: El ${campo} no existe`
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        ok: false,
        msg: "No se pudo encontrar el registro para actualizar"
      });
    }

    return res.status(500).json({
      ok: false,
      msg: "Error al registrar la producción de carne",
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
          msg: "No tienes permisos para actualizar producciones de carne. Solo administradores y operarios pueden realizar esta acción."
        });
      }

      const { id } = req.params;
      const {
        matadero_id,
        pesaje_id,
        unidad_id,
        peso_canal,
        fecha
      } = req.body;

      const produccionId = parseInt(id);

      if (isNaN(produccionId)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID de la producción debe ser un número válido"
        });
      }

      const produccionExistente = await prisma.produccion_carne.findFirst({
        where: { 
          produccion_id: produccionId,
          deleted_at: null 
        }
      });

      if (!produccionExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Producción de carne no encontrada"
        });
      }

      if (peso_canal !== undefined && peso_canal <= 0) {
        return res.status(400).json({
          ok: false,
          msg: "El peso de la canal debe ser mayor a 0"
        });
      }

      if (matadero_id !== undefined) {
        const mataderoId = parseInt(matadero_id);
        const matadero = await prisma.mataderos.findFirst({
          where: { 
            matadero_id: mataderoId,
            deleted_at: null 
          }
        });

        if (!matadero) {
          return res.status(400).json({
            ok: false,
            msg: "El matadero especificado no existe"
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

      let pesajeId = produccionExistente.pesaje_id;
      
      if (pesaje_id !== undefined && pesaje_id !== 'null' && pesaje_id !== '') {
        pesajeId = parseInt(pesaje_id);
        const pesaje = await prisma.pesajes.findFirst({
          where: { 
            pesaje_id: pesajeId,
            deleted_at: null 
          }
        });

        if (!pesaje) {
          return res.status(400).json({
            ok: false,
            msg: "El pesaje especificado no existe"
          });
        }
      }

      const updateData = {};

      if (matadero_id !== undefined) updateData.matadero_id = parseInt(matadero_id);
      if (unidad_id !== undefined) updateData.unidad_id = parseInt(unidad_id);
      if (pesaje_id !== undefined) updateData.pesaje_id = pesajeId;
      if (peso_canal !== undefined) updateData.peso_canal = parseFloat(peso_canal);
      if (fecha !== undefined) updateData.fecha = new Date(fecha);

      const produccionActualizada = await prisma.produccion_carne.update({
        where: { produccion_id: produccionId },
        data: updateData,
        include: {
          animal: {
            select: {
              animal_id: true,
              arete: true,
              sexo: true,
              fecha_nacimiento: true
            }
          },
          matadero: {
            select: {
              matadero_id: true,
              ubicacion: true
            }
          },
          pesaje: {
            select: {
              pesaje_id: true,
              peso: true,
              fecha: true
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
        msg: "Producción de carne actualizada exitosamente",
        data: produccionActualizada
      });

    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          ok: false,
          msg: "Producción de carne no encontrada"
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar la producción de carne",
        error: error.message
      });
    }
  }

  static async delete(req, res) {
    try {
      if (req.usuario.rol !== 'admin') {
        return res.status(403).json({
          ok: false,
          msg: "Solo los administradores pueden eliminar producciones de carne"
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

      const produccion = await prisma.produccion_carne.findFirst({
        where: { 
          produccion_id: produccionId,
          deleted_at: null 
        }
      });

      if (!produccion) {
        return res.status(404).json({
          ok: false,
          msg: "Producción de carne no encontrada"
        });
      }

      await prisma.produccion_carne.update({
        where: { produccion_id: produccionId },
        data: { 
          deleted_at: new Date() 
        }
      });

      return res.json({
        ok: true,
        msg: "Producción de carne eliminada exitosamente"
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al eliminar la producción de carne"
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

      const producciones = await prisma.produccion_carne.findMany({
        where: { 
          animal_id: id,
          deleted_at: null 
        },
        include: {
          matadero: {
            select: {
              matadero_id: true,
              ubicacion: true
            }
          },
          pesaje: {
            select: {
              pesaje_id: true,
              peso: true,
              fecha: true
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
        data: {
          animal: animal,
          producciones: producciones
        }
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener las producciones de carne del animal"
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

  static async getMataderos(req, res) {
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
        msg: "Error al obtener los mataderos"
      });
    }
  }
static async getPesajesDisponibles(req, res) {
  try {
    console.log('🔍 Buscando pesajes disponibles...');
    
    // Primero obtener todos los pesajes activos
    const todosPesajes = await prisma.pesajes.findMany({
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
            nombre: true,
          }
        },
        producciones_carne: {
          where: {
            deleted_at: null
          },
          select: {
            produccion_id: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    // Filtrar en JavaScript los pesajes que NO tienen producción de carne asociada
    const pesajesDisponibles = todosPesajes.filter(pesaje => 
      pesaje.producciones_carne.length === 0
    );

    console.log(`🔍 Se encontraron ${pesajesDisponibles.length} pesajes disponibles de ${todosPesajes.length} totales`);

    return res.json({
      ok: true,
      data: pesajesDisponibles
    });

  } catch (error) {
    console.error('❌ ERROR en getPesajesDisponibles:', error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener los pesajes disponibles",
      error: error.message
    });
  }
}
}
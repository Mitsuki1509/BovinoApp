import prisma from "../database.js";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import NotificacionController from "./NotificacionController.js";

export default class InsumoController {

  static async getAll(req, res) {
    try {
      const insumos = await prisma.insumos.findMany({
        where: { 
          deleted_at: null 
        },
        include: {
          tipo_insumo: {
            select: {
              tipo_insumo_id: true,
              nombre: true
            }
          },
          unidad: {
            select: {
              unidad_id: true,
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
        data: insumos
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener los insumos"
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const insumoId = parseInt(id);

      if (isNaN(insumoId)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID del insumo debe ser un número válido"
        });
      }

      const insumo = await prisma.insumos.findFirst({
        where: { 
          insumo_id: insumoId,
          deleted_at: null 
        },
        include: {
          tipo_insumo: {
            select: {
              tipo_insumo_id: true,
              nombre: true
            }
          },
          unidad: {
            select: {
              unidad_id: true,
              nombre: true
            }
          }
        }
      });

      if (!insumo) {
        return res.status(404).json({
          ok: false,
          msg: "Insumo no encontrado"
        });
      }

      return res.json({
        ok: true,
        data: insumo
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al obtener el insumo"
      });
    }
  }

  static async create(req, res) {
    try {
      const rolesPermitidos = ['admin', 'contable'];
      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para crear insumos. Solo administradores y contables pueden realizar esta acción."
        });
      }

      const {
        tipo_insumo_id,
        nombre,
        cantidad,
        unidad_id,
        descripcion
      } = req.body;
      
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          ok: false,
          msg: "El nombre del insumo es requerido"
        });
      }

      if (!cantidad || cantidad < 0) {
        return res.status(400).json({
          ok: false,
          msg: "La cantidad es requerida y debe ser mayor o igual a 0"
        });
      }

      if (!tipo_insumo_id || tipo_insumo_id === 'null' || tipo_insumo_id === '') {
        return res.status(400).json({
          ok: false,
          msg: "El tipo de insumo es requerido"
        });
      }

      if (!unidad_id || unidad_id === 'null' || unidad_id === '') {
        return res.status(400).json({
          ok: false,
          msg: "La unidad de medida es requerida"
        });
      }

      const tipoInsumoId = parseInt(tipo_insumo_id);
      const tipoInsumo = await prisma.tipo_insumo.findFirst({
        where: { 
          tipo_insumo_id: tipoInsumoId,
          deleted_at: null 
        }
      });

      if (!tipoInsumo) {
        return res.status(400).json({
          ok: false,
          msg: "El tipo de insumo especificado no existe"
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

      const insumoExistente = await prisma.insumos.findFirst({
        where: { 
          nombre: nombre.trim(),
          deleted_at: null 
        }
      });

      if (insumoExistente) {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un insumo con este nombre"
        });
      }

      const file = req.file;
      let imagenNombre = null;

      if (file) {
        const ext = path.extname(file.originalname);
        imagenNombre = crypto.randomUUID() + ext;
        await fs.writeFile(`./public/uploads/insumo_images/${imagenNombre}`, file.buffer);
      }

      const data = {
        nombre: nombre.trim(),
        imagen: imagenNombre ? `http://localhost:3000/uploads/insumo_images/${imagenNombre}` : null,
        cantidad: parseInt(cantidad),
        descripcion: descripcion ? descripcion.trim() : null,
        tipo_insumo_id: tipoInsumoId, 
        unidad_id: unidadId 
      };

      const nuevoInsumo = await prisma.insumos.create({
        data: data,
        include: {
          tipo_insumo: {
            select: {
              tipo_insumo_id: true,
              nombre: true
            }
          },
          unidad: {
            select: {
              unidad_id: true,
              nombre: true
            }
          }
        }
      });

      if (nuevoInsumo.cantidad < 10) {
      }

      return res.status(201).json({
        ok: true,
        msg: "Insumo creado exitosamente",
        data: nuevoInsumo
      });

    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un insumo con este nombre"
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error al crear el insumo",
        error: error.message
      });
    }
  }

  static async update(req, res) {
    try {
      const rolesPermitidos = ['admin', 'contable'];
      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para actualizar insumos. Solo administradores y contables pueden realizar esta acción."
        });
      }

      const { id } = req.params;
      const {
        tipo_insumo_id,
        nombre,
        cantidad,
        unidad_id,
        descripcion
      } = req.body;

      const insumoId = parseInt(id);

      if (isNaN(insumoId)) {
        return res.status(400).json({
          ok: false,
          msg: "El ID del insumo debe ser un número válido"
        });
      }

      const insumoExistente = await prisma.insumos.findFirst({
        where: { 
          insumo_id: insumoId,
          deleted_at: null 
        }
      });

      if (!insumoExistente) {
        return res.status(404).json({
          ok: false,
          msg: "Insumo no encontrado"
        });
      }

      if (nombre && nombre.trim() !== '') {
        const insumoConMismoNombre = await prisma.insumos.findFirst({
          where: { 
            nombre: nombre.trim(),
            insumo_id: { not: insumoId },
            deleted_at: null 
          }
        });

        if (insumoConMismoNombre) {
          return res.status(400).json({
            ok: false,
            msg: "Ya existe otro insumo con este nombre"
          });
        }
      }

      if (cantidad !== undefined && cantidad < 0) {
        return res.status(400).json({
          ok: false,
          msg: "La cantidad debe ser mayor o igual a 0"
        });
      }

      if (tipo_insumo_id !== undefined) {
        if (!tipo_insumo_id || tipo_insumo_id === 'null' || tipo_insumo_id === '') {
          return res.status(400).json({
            ok: false,
            msg: "El tipo de insumo es requerido"
          });
        }
      }

      if (unidad_id !== undefined) {
        if (!unidad_id || unidad_id === 'null' || unidad_id === '') {
          return res.status(400).json({
            ok: false,
            msg: "La unidad de medida es requerida"
          });
        }
      }

      if (tipo_insumo_id !== undefined) {
        const tipoInsumoId = parseInt(tipo_insumo_id);
        const tipoInsumo = await prisma.tipo_insumo.findFirst({
          where: { 
            tipo_insumo_id: tipoInsumoId,
            deleted_at: null 
          }
        });

        if (!tipoInsumo) {
          return res.status(400).json({
            ok: false,
            msg: "El tipo de insumo especificado no existe"
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

      const file = req.file;
      let imagenNombre = null;

      if (file) {
        const ext = path.extname(file.originalname);
        imagenNombre = crypto.randomUUID() + ext;
        await fs.writeFile(`./public/uploads/insumo_images/${imagenNombre}`, file.buffer);
      }

      const updateData = {};

      if (nombre !== undefined) updateData.nombre = nombre.trim();
      if (cantidad !== undefined) updateData.cantidad = parseInt(cantidad);
      if (descripcion !== undefined) updateData.descripcion = descripcion ? descripcion.trim() : null;

      if (tipo_insumo_id !== undefined) {
        updateData.tipo_insumo_id = parseInt(tipo_insumo_id);
      }
      
      if (unidad_id !== undefined) {
        updateData.unidad_id = parseInt(unidad_id);
      }

      if (imagenNombre) {
        updateData.imagen = `http://localhost:3000/uploads/insumo_images/${imagenNombre}`;
      }

      const insumoActualizado = await prisma.insumos.update({
        where: { insumo_id: insumoId },
        data: updateData,
        include: {
          tipo_insumo: {
            select: {
              tipo_insumo_id: true,
              nombre: true
            }
          },
          unidad: {
            select: {
              unidad_id: true,
              nombre: true
            }
          }
        }
      });

      if (insumoActualizado.cantidad < 10) {
        await StockService.crearNotificacionStockBajo(insumoActualizado);
      }

      return res.json({
        ok: true,
        msg: "Insumo actualizado exitosamente",
        data: insumoActualizado
      });

    } catch (error) {      
      if (error.code === 'P2002') {
        return res.status(400).json({
          ok: false,
          msg: "Ya existe un insumo con este nombre"
        });
      }

      if (error.code === 'P2025') {
        return res.status(404).json({
          ok: false,
          msg: "Insumo no encontrado"
        });
      }

      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar el insumo",
        error: error.message
      });
    }
  }

  static async delete(req, res) {
    try {
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'contable') {
        return res.status(403).json({
          ok: false,
          msg: "Solo los administradores y contables pueden eliminar insumos"
        });
      }

      const { id } = req.params;
      const insumoId = parseInt(id);

      const insumo = await prisma.insumos.findFirst({
        where: { 
          insumo_id: insumoId,
          deleted_at: null 
        },
        include: {
          _count: {
            select: {
              alimentaciones: {
                where: {
                  deleted_at: null
                }
              },
              detalle_compras_insumos: {
                where: {
                  deleted_at: null
                }
              },
              evento_insumos: {
                where: {
                  deleted_at: null
                }
              }
            }
          }
        }
      });

      if (!insumo) {
        return res.status(404).json({
          ok: false,
          msg: "Insumo no encontrado"
        });
      }

      if (insumo._count.alimentaciones > 0 || 
          insumo._count.detalle_compras_insumos > 0 || 
          insumo._count.evento_insumos > 0) {
        return res.status(400).json({
          ok: false,
          msg: "No se puede eliminar el insumo porque está siendo usado en alimentaciones, compras o eventos sanitarios"
        });
      }

      await prisma.insumos.update({
        where: { insumo_id: insumoId },
        data: { 
          deleted_at: new Date() 
        }
      });

      return res.json({
        ok: true,
        msg: "Insumo eliminado exitosamente"
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al eliminar el insumo"
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

}
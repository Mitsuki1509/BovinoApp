import prisma from "../database.js"

export default class ProveedorController {
    static async getProveedores(req, res){
        try{
            const proveedores = await prisma.proveedores.findMany({
                where: {
                    deleted_at: null
                }, 
                orderBy:{
                    nombre_compañia: 'asc'
                }
            })
            return res.json({
                ok: true, 
                data: proveedores
            })
        }catch(error){
            return res.status(500).json({
                ok:false,
                msg: "Error al obtener los proveedores"
            })
        }
    }
    static async getProveedorById(req, res){
        try{
            const {id} = req.params;
            const proveedor = await prisma.proveedores.findFirst({
                where:{
                    proveedor_id: parseInt(id),
                    deleted_at: null
                }
            })
            if(!proveedor){
                return res.status(404).json({
                    ok: false,
                    msg: "Proveedor no encontrado"
                })
            }
            return res.json({
                ok:true,
                data: proveedor
            })
        }catch(error){
            return res.status(500).json({
                ok: false,
                msg: "Error al obtener el proveedor"
            })
        }
    }
    static async createProveedor(req, res){
        try{
            if(req.usuario.rol !== 'admin' && req.usuario.rol !== 'contable'){
                return res.status(403).json({
                    ok:false,
                    msg: "No tienes permisos para crear proveedores"
                })
            }
            const { nombre_compañia, nombre_contacto,
                 telefono_local} = req.body;

            if(!nombre_compañia || nombre_compañia.trim() === ''){
                return res.status(400).json({
                    ok: false,
                    msg: "El nombre de la compañia es requerida"
                })
            }
            if(!nombre_contacto || nombre_contacto.trim() === ''){
                return res.status(400).json({
                    ok: false,
                    msg: "El nombre del contacto es requerido"
                })
            }
              if (!telefono_local || telefono_local.trim() === '') {
                return res.status(400).json({
                    ok: false,
                    msg: "El teléfono es requerido"
                })
            }

            const telefonoRegex = /^[0-9]{8}$/;
            if (!telefonoRegex.test(telefono_local.trim())) {
                return res.status(400).json({
                    ok: false,
                    msg: "El teléfono debe tener exactamente 8 dígitos numéricos"
                });
            }
            const compañiaExiste = await prisma.proveedores.findFirst({
                where: {
                    nombre_compañia: nombre_compañia.trim(),
                    deleted_at: null
                }
            })

            if(compañiaExiste){
                return res.status(400).json({
                    ok:false,
                    msg: "Ya existe un proveedor con este nombre"
                })
            }
            const compañiaEliminada = await prisma.proveedores.findFirst({
                where:{
                    nombre_compañia: nombre_compañia.trim(),
                    deleted_at: {not: null}
                }
            })
            let nuevaCompañia

            if(compañiaEliminada){
                nuevaCompañia = await prisma.proveedores.update({
                    where:{proveedor_id: compañiaEliminada.proveedor_id},
                    data:{
                        nombre_compañia: nombre_compañia.trim(),
                        nombre_contacto: nombre_contacto.trim(),
                        telefono_local: telefono_local.trim(),
                        deleted_at: null
                    }
                })
            }else{
                nuevaCompañia = await prisma.proveedores.create({
                    data:{
                        nombre_compañia: nombre_compañia.trim(),
                        nombre_contacto: nombre_contacto.trim(),
                        telefono_local: telefono_local.trim(),
                    }
                })
            }
            return res.status(201).json({
                ok:true,
                msg: compañiaEliminada ? "Proveedor reactivado existosamente" : "Proveedor creado existosamente",
                data: nuevaCompañia
            })
        }catch(error){
            return res.status(500).json({
                ok: false,
                msg: "Error al crear proveedor"
            })
        }
    }
    static async updateProveedor(req, res){
        try{
            if(req.usuario.rol !== 'admin' && req.usuario.rol !== 'contable'){
                return res.status(403).json({
                    ok: false,
                    msg: "No tienes permisos para actualizar proveedores"
                })
            }
            const {id} = req. params
            const {nombre_compañia, nombre_contacto,
                telefono_local} = req.body;

            const compañiaExiste = await prisma.proveedores.findFirst({
                where: {
                    proveedor_id: parseInt(id),
                    deleted_at: null
                }
            })

            if(!compañiaExiste){
                return res.status(400).json({
                    ok:false,
                    msg: "Proveedor no encontrado"
                })
            }
            
              if (telefono_local && telefono_local.trim() !== '') {
                const telefonoRegex = /^[0-9]{8}$/;
                if (!telefonoRegex.test(telefono_local.trim())) {
                    return res.status(400).json({
                        ok: false,
                        msg: "El teléfono debe tener exactamente 8 dígitos numéricos"
                    });
                }
            }

            if(nombre_compañia && nombre_compañia.trim() !== ''){
                const compañiaMismoNombre = await prisma.proveedores.findFirst({
                    where:{
                        nombre_compañia: nombre_compañia.trim(),
                        proveedor_id: {
                            not: parseInt(id)
                        },
                        deleted_at: null
                    }
                })
                if(compañiaMismoNombre){
                    return res.status(400).json({
                        ok: false,
                        msg: "Ya existe otro proveedor con ese nombre"
                    })
                }
            }
            const proveedorActualizado = await prisma.proveedores.update({
                where: { proveedor_id: parseInt(id) },
                data: {
                    ...(nombre_compañia && { nombre_compañia: nombre_compañia.trim() }),
                    ...(nombre_contacto !== undefined && { nombre_contacto: nombre_contacto?.trim() || null }),
                    ...(telefono_local && { telefono_local: telefono_local.trim() })
                }
            });
            return res.json({
                ok:true,
                msg:"Proveedor actualizado existosamente",
                data:proveedorActualizado
            })

        }catch(error){
            return res.status(500).json({
                ok: false,
                msg: "Error al actualizar proveedor"
            })
        }
    }
    static async deleteProveedor(req, res){
        try{
            if(req.usuario.rol !== 'admin' && req.usuario.rol !== 'contable'){
                return res.status(403).json({
                    ok:false,
                    msg: "No tiene permisos para eliminar proveedor"
                })
            }
            const {id} = req.params
            const proveedorId = parseInt(id)

            const proveedor = await prisma.proveedores.findFirst({
                where:{
                    proveedor_id: proveedorId,
                    deleted_at: null
                }
            })
            
            if(!proveedor){
                return res.status(404).json({
                    ok: false,
                    msg: "Proveedor no encontrado"
                })
            }

            const comprasAnimales = await prisma.compras_animales.findFirst({
                where: {
                    proveedor_id: proveedorId,
                    deleted_at: null
                }
            })

            const comprasInsumos = await prisma.compras_insumos.findFirst({
                where: {
                    proveedor_id: proveedorId,
                    deleted_at: null
                }
            })

            if(comprasAnimales || comprasInsumos){
                return res.status(400).json({
                    ok: false,
                    msg: "No se puede eliminar proveedor porque tiene compras asociadas"
                })
            }

            await prisma.proveedores.update({
                where: {
                    proveedor_id: proveedorId    
                },
                data: {
                    deleted_at: new Date()
                }
            })
            
            return res.json({
                ok: true,
                msg: "Proveedor eliminado exitosamente"
            })

        } catch(error) {
            console.error('Error en deleteProveedor:', error)
            return res.status(500).json({
                ok: false,
                msg: "Error al eliminar proveedor"
            })
        }
    }

}
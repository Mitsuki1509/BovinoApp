import prisma from "../database.js"

function convertBigInt(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigInt);
  }
  
  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        newObj[key] = convertBigInt(obj[key]);
      }
    }
    return newObj;
  }
  
  return obj;
}

const getStartOfDay = (date) => {
  const localDate = new Date(date);
  return new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
};

const getEndOfDay = (date) => {
  const localDate = new Date(date);
  return new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 23, 59, 59, 999);
};

export default class DashboardController {

    static async getKPIsPrincipales(req, res) {
        try {
            
            const hoy = new Date();
            const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

            const inicioHoy = getStartOfDay(hoy);
            const finHoy = getEndOfDay(hoy);

            const [
                totalAnimales, 
                produccionHoy, 
                animalesEnTratamiento, 
                montasEsteMes
            ] = await Promise.all([
                prisma.animales.count({ 
                    where: { 
                        deleted_at: null 
                    } 
                }),
                
                prisma.produccion_lechera.aggregate({
                    where: {
                        deleted_at: null,
                        fecha: {
                            gte: inicioHoy,
                            lte: finHoy
                        }
                    },
                    _sum: { 
                        cantidad: true 
                    }
                }),
                
                prisma.evento_sanitario.groupBy({
                    by: ['animal_id'],
                    where: {
                        deleted_at: null,
                        estado: 'Pendiente',
                        fecha: { 
                            gte: hace30Dias 
                        }
                    }
                }).then(results => results.length), 
                
                prisma.evento_monta.count({
                    where: {
                        deleted_at: null,
                        fecha: { 
                            gte: inicioMes 
                        }
                    }
                })
            ]);

            const responseData = {
                totalAnimales: Number(totalAnimales) || 0,
                produccionHoy: Number(produccionHoy._sum?.cantidad) || 0,
                animalesEnTratamiento: Number(animalesEnTratamiento) || 0,
                montasEsteMes: Number(montasEsteMes) || 0
            };

            return res.json({
                ok: true,
                data: responseData
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error interno al cargar KPIs principales",
                error: error.message
            });
        }
    }
static async getTendenciaProduccion(req, res) {
    try {
        const { dias = 30 } = req.query;
        
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - parseInt(dias));
        const fechaInicioAjustada = getStartOfDay(fechaInicio);

        const [
            produccionPorDia, 
            eventosReproductivos, 
            eventosSanitarios, 
            produccionPorRaza
        ] = await Promise.all([
            prisma.produccion_lechera.groupBy({
                by: ['fecha'],
                where: {
                    deleted_at: null,
                    fecha: { gte: fechaInicioAjustada }
                },
                _sum: {
                    cantidad: true
                },
                orderBy: {
                    fecha: 'asc'
                }
            }),

            prisma.evento_monta.groupBy({
                by: ['fecha'],
                where: {
                    deleted_at: null,
                    fecha: { gte: fechaInicioAjustada }
                },
                _count: {
                    monta_id: true
                },
                orderBy: {
                    fecha: 'asc'
                }
            }),

            prisma.evento_sanitario.groupBy({
                by: ['fecha'],
                where: {
                    deleted_at: null,
                    fecha: { gte: fechaInicioAjustada }
                },
                _count: {
                    evento_sanitario_id: true
                },
                orderBy: {
                    fecha: 'asc'
                }
            }),

            prisma.$queryRaw`
                SELECT 
                    r.nombre as raza,
                    COALESCE(SUM(pl.cantidad), 0) as total_produccion,
                    COUNT(DISTINCT pl.animal_id) as total_vacas
                FROM produccion_lechera pl
                INNER JOIN animales a ON pl.animal_id = a.animal_id AND a.deleted_at IS NULL
                INNER JOIN razas r ON a.raza_id = r.raza_id AND r.deleted_at IS NULL
                WHERE pl.deleted_at IS NULL 
                    AND pl.fecha >= ${fechaInicioAjustada}
                GROUP BY r.raza_id, r.nombre
                ORDER BY total_produccion DESC
            `
        ]);

        const responseData = {
            produccion: produccionPorDia.map(item => ({
                fecha: item.fecha.toISOString().split('T')[0], 
                cantidad: Number(item._sum?.cantidad) || 0
            })),
            reproduccion: eventosReproductivos.map(item => ({
                fecha: item.fecha.toISOString().split('T')[0],
                cantidad: Number(item._count?.monta_id) || 0
            })),
            salud: eventosSanitarios.map(item => ({
                fecha: item.fecha.toISOString().split('T')[0], 
                cantidad: Number(item._count?.evento_sanitario_id) || 0
            })),
            produccionPorRaza: convertBigInt(produccionPorRaza)
        };


        return res.json({
            ok: true,
            data: responseData
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            msg: "Error interno al cargar tendencias",
            error: error.message
        });
    }
}

    static async getDistribucionAnimales(req, res) {
        try {
            const [distribucionCategoria, distribucionRaza, distribucionLote] = await Promise.all([
                prisma.$queryRaw`
                    SELECT 
                        CASE 
                            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) < 1 THEN 'Ternero'
                            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 1 AND 2 AND sexo = 'H' THEN 'Vaquilla'
                            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) > 2 AND sexo = 'H' THEN 'Vaca'
                            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) > 2 AND sexo = 'M' THEN 'Toro'
                            ELSE 'Otro'
                        END as categoria,
                        COUNT(*) as cantidad
                    FROM animales 
                    WHERE deleted_at IS NULL
                    GROUP BY 
                        CASE 
                            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) < 1 THEN 'Ternero'
                            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 1 AND 2 AND sexo = 'H' THEN 'Vaquilla'
                            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) > 2 AND sexo = 'H' THEN 'Vaca'
                            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) > 2 AND sexo = 'M' THEN 'Toro'
                            ELSE 'Otro'
                        END
                    ORDER BY cantidad DESC
                `,

                prisma.razas.findMany({
                    where: { deleted_at: null },
                    include: {
                        animales: {
                            where: { deleted_at: null },
                            select: { animal_id: true }
                        }
                    }
                }).then(razas => 
                    razas.map(raza => ({
                        categoria: raza.nombre,
                        cantidad: raza.animales.length
                    }))
                ),

                prisma.lotes.findMany({
                    where: { deleted_at: null },
                    include: {
                        animales: {
                            where: { deleted_at: null },
                            select: { animal_id: true }
                        }
                    }
                }).then(lotes => 
                    lotes.map(lote => ({
                        categoria: lote.codigo || lote.descripcion || 'Sin lote',
                        cantidad: lote.animales.length
                    }))
                )
            ]);

            const responseData = {
                porRaza: distribucionRaza,
                porCategoria: convertBigInt(distribucionCategoria),
                porLote: distribucionLote
            };

            return res.json({
                ok: true,
                data: responseData
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error interno al cargar distribución",
                error: error.message
            });
        }
    }

    static async getMetricasReproduccion(req, res) {
        try {
            const ultimos30Dias = new Date();
            ultimos30Dias.setDate(ultimos30Dias.getDate() - 30);
            const inicio30Dias = getStartOfDay(ultimos30Dias);

            const [
                montasRecientes, 
                diagnosticosRecientes, 
                partosRecientes, 
                vacasPreñadas
            ] = await Promise.all([
                prisma.evento_monta.count({
                    where: {
                        deleted_at: null,
                        fecha: { gte: inicio30Dias }
                    }
                }),
                
                prisma.diagnostico_prenez.findMany({
                    where: {
                        deleted_at: null,

                        monta: {
                            fecha: { gte: inicio30Dias }
                        }
                    },
                    select: {
                        resultado: true,
                        monta: {
                            select: {
                                fecha: true
                            }
                        }
                    }
                }),
                
                prisma.evento_parto.count({
                    where: {
                        deleted_at: null,
                        fecha: { gte: inicio30Dias }
                    }
                }),
                
                prisma.diagnostico_prenez.findMany({
                    where: {
                        deleted_at: null,
                        resultado: true,
                        monta: {
                            fecha: { gte: inicio30Dias }
                        },
                        partos: {
                            none: {
                                deleted_at: null
                            }
                        }
                    },
                    select: {
                        prenez_id: true
                    }
                }).then(results => results.length) 
            ]);



            let positivas = 0;
            let negativas = 0;
            
            diagnosticosRecientes.forEach(diagnostico => {
                if (diagnostico.resultado === true) positivas++;
                else if (diagnostico.resultado === false) negativas++;
            });

            const totalDiagnosticos = positivas + negativas;
            const tasaPreñez = totalDiagnosticos > 0 ? (positivas / totalDiagnosticos) * 100 : 0;
            const eficienciaReproductiva = montasRecientes > 0 ? (positivas / montasRecientes) * 100 : 0;

            const responseData = {
                montasUltimos30Dias: Number(montasRecientes) || 0,
                partosUltimos30Dias: Number(partosRecientes) || 0,
                tasaPreñez: Math.round(tasaPreñez) || 0,
                diagnosticosPositivos: Number(positivas) || 0,
                diagnosticosNegativos: Number(negativas) || 0,
                vacasPreñadasActuales: Number(vacasPreñadas) || 0,
                eficienciaReproductiva: Math.round(eficienciaReproductiva) || 0
            };


            return res.json({
                ok: true,
                data: responseData
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error interno al cargar métricas de reproducción",
                error: error.message
            });
        }
    }

    static async getAlertasSistema(req, res) {
        try {
            
            const hoy = new Date();
            const inicioHoy = getStartOfDay(hoy);
            const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
            const inicio7Dias = getStartOfDay(hace7Dias);

            const [
                eventosPendientes, 
                partosProximos, 
                stockBajo, 
                vacasSinProduccion
            ] = await Promise.all([
                prisma.evento_sanitario.findMany({
                    where: {
                        deleted_at: null,
                        estado: 'Pendiente',
                        fecha: { lte: hoy }
                    },
                    include: {
                        animal: {
                            select: {
                                arete: true
                            }
                        },
                        tipo_evento: {
                            select: {
                                nombre: true
                            }
                        }
                    },
                    take: 10
                }),

                prisma.diagnostico_prenez.findMany({
                    where: {
                        deleted_at: null,
                        resultado: true,
                        fecha_probable_parto: {
                            gte: inicioHoy,
                            lte: new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)
                        },
                        partos: {
                            none: {
                                deleted_at: null
                            }
                        }
                    },
                    include: {
                        monta: {
                            include: {
                                hembra: {
                                    select: {
                                        arete: true
                                    }
                                }
                            }
                        }
                    },
                    take: 10
                }),

                prisma.insumos.findMany({
                    where: {
                        deleted_at: null,
                        cantidad: { lt: 10 }
                    },
                    take: 10
                }),

                prisma.$queryRaw`
                    SELECT a.animal_id, a.arete
                    FROM animales a
                    WHERE a.deleted_at IS NULL 
                    AND a.sexo = 'H'
                    AND a.animal_id NOT IN (
                        SELECT DISTINCT pl.animal_id 
                        FROM produccion_lechera pl 
                        WHERE pl.deleted_at IS NULL 
                        AND pl.fecha >= ${inicio7Dias}
                    )
                    LIMIT 10
                `
            ]);

            const alertas = [];

            eventosPendientes.forEach(evento => {
                alertas.push({
                    id: `evento-${evento.evento_sanitario_id}`,
                    tipo: 'salud',
                    titulo: `Evento pendiente: ${evento.tipo_evento?.nombre || 'Sin nombre'}`,
                    descripcion: `Animal ${evento.animal?.arete || 'Desconocido'}`,
                    severidad: 'alta',
                    fecha: evento.fecha
                });
            });

            partosProximos.forEach(diagnostico => {
                const diasRestantes = Math.ceil((new Date(diagnostico.fecha_probable_parto) - hoy) / (1000 * 60 * 60 * 24));
                alertas.push({
                    id: `parto-${diagnostico.prenez_id}`,
                    tipo: 'reproduccion',
                    titulo: `Parto próximo: ${diagnostico.monta?.hembra?.arete || 'Desconocido'}`,
                    descripcion: `${diasRestantes} días restantes`,
                    severidad: diasRestantes <= 3 ? 'alta' : 'media',
                    fecha: diagnostico.fecha_probable_parto
                });
            });

            stockBajo.forEach(insumo => {
                alertas.push({
                    id: `stock-${insumo.insumo_id}`,
                    tipo: 'inventario',
                    titulo: `Stock bajo: ${insumo.nombre}`,
                    descripcion: `Cantidad: ${insumo.cantidad} unidades`,
                    severidad: insumo.cantidad < 5 ? 'alta' : 'media',
                    fecha: hoy
                });
            });

            const vacasSinProd = convertBigInt(vacasSinProduccion);
            vacasSinProd.forEach(vaca => {
                alertas.push({
                    id: `produccion-${vaca.animal_id}`,
                    tipo: 'produccion',
                    titulo: `Vaca sin producción: ${vaca.arete}`,
                    descripcion: `Sin producción en 7 días`,
                    severidad: 'media',
                    fecha: hoy
                });
            });

            return res.json({
                ok: true,
                data: alertas
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                msg: "Error interno al cargar alertas",
                error: error.message
            });
        }
    }
}
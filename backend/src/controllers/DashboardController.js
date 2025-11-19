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

export default class DashboardController {

    static async getKPIsPrincipales(req, res) {
        try {
            console.log('📊 Iniciando getKPIsPrincipales...');
            
            const hoy = new Date();
            const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            const hace30Dias = new Date();
            hace30Dias.setDate(hoy.getDate() - 30);

            // Consultas optimizadas con datos reales
            const [totalAnimales, produccionHoy, animalesEnTratamiento, montasEsteMes] = await Promise.all([
                // Total de animales activos
                prisma.animales.count({ 
                    where: { 
                        deleted_at: null 
                    } 
                }),
                
                // Producción de hoy - SUM real de produccion_lechera
                prisma.produccion_lechera.aggregate({
                    where: {
                        deleted_at: null,
                        fecha: {
                            gte: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
                        }
                    },
                    _sum: { 
                        cantidad: true 
                    }
                }),
                
                // Animales con eventos sanitarios pendientes (últimos 30 días)
                prisma.evento_sanitario.count({
                    where: {
                        deleted_at: null,
                        estado: 'Pendiente',
                        fecha: { 
                            gte: hace30Dias 
                        }
                    },
                    distinct: ['animal_id']
                }),
                
                // Montas este mes - datos reales de evento_monta
                prisma.evento_monta.count({
                    where: {
                        deleted_at: null,
                        fecha: { 
                            gte: inicioMes 
                        }
                    }
                })
            ]);

            console.log('✅ KPIs calculados con datos reales');

            return res.json({
                ok: true,
                data: {
                    totalAnimales: Number(totalAnimales) || 0,
                    produccionHoy: Number(produccionHoy._sum?.cantidad) || 0,
                    animalesEnTratamiento: Number(animalesEnTratamiento) || 0,
                    montasEsteMes: Number(montasEsteMes) || 0
                }
            });

        } catch (error) {
            console.error('❌ Error en getKPIsPrincipales:', error);
            return res.status(500).json({
                ok: false,
                msg: "Error interno al cargar KPIs principales",
                error: error.message
            });
        }
    }

    static async getTendenciaProduccion(req, res) {
        try {
            console.log('📈 Iniciando getTendenciaProduccion...');
            const { dias = 30 } = req.query;
            
            const fechaInicio = new Date();
            fechaInicio.setDate(fechaInicio.getDate() - parseInt(dias));
            fechaInicio.setHours(0, 0, 0, 0);

            console.log('📅 Fecha inicio:', fechaInicio, 'Días:', dias);

            // 1. Producción lechera REAL por día
            const produccionPorDia = await prisma.produccion_lechera.groupBy({
                by: ['fecha'],
                where: {
                    deleted_at: null,
                    fecha: { gte: fechaInicio }
                },
                _sum: {
                    cantidad: true
                },
                orderBy: {
                    fecha: 'asc'
                }
            });

            // 2. Eventos reproductivos REALES (montas)
            const eventosReproductivos = await prisma.evento_monta.groupBy({
                by: ['fecha'],
                where: {
                    deleted_at: null,
                    fecha: { gte: fechaInicio }
                },
                _count: {
                    monta_id: true
                },
                orderBy: {
                    fecha: 'asc'
                }
            });

            // 3. Eventos sanitarios REALES
            const eventosSanitarios = await prisma.evento_sanitario.groupBy({
                by: ['fecha'],
                where: {
                    deleted_at: null,
                    fecha: { gte: fechaInicio }
                },
                _count: {
                    evento_sanitario_id: true
                },
                orderBy: {
                    fecha: 'asc'
                }
            });

            // 4. Producción lechera por raza REAL
            const produccionPorRaza = await prisma.$queryRaw`
                SELECT 
                    r.nombre as raza,
                    SUM(pl.cantidad) as total_produccion,
                    COUNT(DISTINCT pl.animal_id) as total_vacas
                FROM produccion_lechera pl
                JOIN animales a ON pl.animal_id = a.animal_id
                JOIN razas r ON a.raza_id = r.raza_id
                WHERE pl.deleted_at IS NULL 
                    AND pl.fecha >= ${fechaInicio}
                    AND a.deleted_at IS NULL
                GROUP BY r.nombre
                ORDER BY total_produccion DESC
            `;

            console.log('✅ Datos reales cargados para tendencias');

            return res.json({
                ok: true,
                data: {
                    produccion: produccionPorDia.map(item => ({
                        fecha: item.fecha,
                        cantidad: Number(item._sum?.cantidad) || 0
                    })),
                    reproduccion: eventosReproductivos.map(item => ({
                        fecha: item.fecha,
                        cantidad: Number(item._count?.monta_id) || 0
                    })),
                    salud: eventosSanitarios.map(item => ({
                        fecha: item.fecha,
                        cantidad: Number(item._count?.evento_sanitario_id) || 0
                    })),
                    produccionPorRaza: convertBigInt(produccionPorRaza)
                }
            });

        } catch (error) {
            console.error('❌ Error en getTendenciaProduccion:', error);
            return res.status(500).json({
                ok: false,
                msg: "Error interno al cargar tendencias",
                error: error.message
            });
        }
    }

    static async getDistribucionAnimales(req, res) {
        try {
            console.log('🐄 Iniciando getDistribucionAnimales...');

            // Distribución por categoría REAL basada en edad y sexo
            const distribucionCategoria = await prisma.$queryRaw`
                SELECT 
                    CASE 
                        WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 1 THEN 'Ternero'
                        WHEN DATE_PART('year', AGE(fecha_nacimiento)) BETWEEN 1 AND 2 AND sexo = 'H' THEN 'Vaquilla'
                        WHEN DATE_PART('year', AGE(fecha_nacimiento)) > 2 AND sexo = 'H' THEN 'Vaca'
                        WHEN DATE_PART('year', AGE(fecha_nacimiento)) > 2 AND sexo = 'M' THEN 'Toro'
                        ELSE 'Otro'
                    END as categoria,
                    COUNT(*) as cantidad
                FROM animales 
                WHERE deleted_at IS NULL
                GROUP BY categoria
                ORDER BY cantidad DESC
            `;

            // Distribución por raza REAL
            const distribucionRaza = await prisma.animales.groupBy({
                by: ['raza_id'],
                where: { deleted_at: null },
                _count: { animal_id: true }
            });

            // Enriquecer con nombres de razas
            const razasConNombres = await Promise.all(
                distribucionRaza.map(async (item) => {
                    const raza = await prisma.razas.findUnique({
                        where: { raza_id: item.raza_id }
                    });
                    return {
                        categoria: raza?.nombre || 'Sin raza',
                        cantidad: Number(item._count.animal_id)
                    };
                })
            );

            // Distribución por lote REAL
            const distribucionLote = await prisma.animales.groupBy({
                by: ['lote_id'],
                where: { deleted_at: null },
                _count: { animal_id: true }
            });

            const lotesConNombres = await Promise.all(
                distribucionLote.map(async (item) => {
                    const lote = await prisma.lotes.findUnique({
                        where: { lote_id: item.lote_id }
                    });
                    return {
                        categoria: lote?.codigo || 'Sin lote',
                        cantidad: Number(item._count.animal_id)
                    };
                })
            );

            console.log('✅ Distribución real calculada');

            return res.json({
                ok: true,
                data: {
                    porRaza: razasConNombres,
                    porCategoria: convertBigInt(distribucionCategoria),
                    porLote: lotesConNombres
                }
            });

        } catch (error) {
            console.error('❌ Error en getDistribucionAnimales:', error);
            return res.status(500).json({
                ok: false,
                msg: "Error interno al cargar distribución",
                error: error.message
            });
        }
    }

    static async getMetricasReproduccion(req, res) {
        try {
            console.log('🔬 Iniciando getMetricasReproduccion...');
            
            const ultimos30Dias = new Date();
            ultimos30Dias.setDate(ultimos30Dias.getDate() - 30);

            // Métricas REALES de reproducción
            const [montasRecientes, diagnosticosRecientes, partosRecientes, vacasPreñadas] = await Promise.all([
                // Montas últimos 30 días
                prisma.evento_monta.count({
                    where: {
                        deleted_at: null,
                        fecha: { gte: ultimos30Dias }
                    }
                }),
                
                // Diagnósticos de preñez últimos 30 días
                prisma.diagnostico_prenez.findMany({
                    where: {
                        deleted_at: null,
                        fecha: { gte: ultimos30Dias }
                    },
                    select: {
                        resultado: true
                    }
                }),
                
                // Partos últimos 30 días
                prisma.evento_parto.count({
                    where: {
                        deleted_at: null,
                        fecha: { gte: ultimos30Dias }
                    }
                }),
                
                // Vacas con diagnóstico positivo sin parto (preñadas actualmente)
                prisma.diagnostico_prenez.count({
                    where: {
                        deleted_at: null,
                        resultado: true,
                        fecha: { gte: ultimos30Dias },
                        partos: {
                            none: {
                                deleted_at: null
                            }
                        }
                    }
                })
            ]);

            // Calcular métricas REALES
            let positivas = 0;
            let negativas = 0;
            
            if (Array.isArray(diagnosticosRecientes)) {
                diagnosticosRecientes.forEach(diagnostico => {
                    if (diagnostico.resultado === true) positivas++;
                    else if (diagnostico.resultado === false) negativas++;
                });
            }

            const totalDiagnosticos = positivas + negativas;
            const tasaPreñez = totalDiagnosticos > 0 ? (positivas / totalDiagnosticos) * 100 : 0;

            console.log('✅ Métricas reproducción reales calculadas');

            return res.json({
                ok: true,
                data: {
                    montasUltimos30Dias: Number(montasRecientes) || 0,
                    partosUltimos30Dias: Number(partosRecientes) || 0,
                    tasaPreñez: Math.round(tasaPreñez) || 0,
                    diagnosticosPositivos: Number(positivas) || 0,
                    diagnosticosNegativos: Number(negativas) || 0,
                    vacasPreñadasActuales: Number(vacasPreñadas) || 0,
                    eficienciaReproductiva: montasRecientes > 0 ? Math.round((positivas / montasRecientes) * 100) : 0
                }
            });

        } catch (error) {
            console.error('❌ Error en getMetricasReproduccion:', error);
            return res.status(500).json({
                ok: false,
                msg: "Error interno al cargar métricas de reproducción",
                error: error.message
            });
        }
    }

    static async getAlertasSistema(req, res) {
        try {
            console.log('🚨 Iniciando getAlertasSistema...');

            const hoy = new Date();
            const hace7Dias = new Date();
            hace7Dias.setDate(hoy.getDate() - 7);

            // Alertas REALES del sistema
            const [eventosPendientes, partosProximos, stockBajo, vacasSinProduccion] = await Promise.all([
                // Eventos sanitarios pendientes
                prisma.evento_sanitario.findMany({
                    where: {
                        deleted_at: null,
                        estado: 'Pendiente',
                        fecha: { lte: hoy } // Eventos que ya deberían haberse realizado
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

                // Partos próximos (próximos 7 días)
                prisma.diagnostico_prenez.findMany({
                    where: {
                        deleted_at: null,
                        resultado: true,
                        fecha_probable_parto: {
                            gte: hoy,
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

                // Insumos con stock bajo (< 10 unidades)
                prisma.insumos.findMany({
                    where: {
                        deleted_at: null,
                        cantidad: { lt: 10 }
                    },
                    take: 10
                }),

                // Vacas que no han producido en los últimos 7 días
                prisma.$queryRaw`
                    SELECT a.animal_id, a.arete
                    FROM animales a
                    WHERE a.deleted_at IS NULL 
                    AND a.sexo = 'H'
                    AND a.animal_id NOT IN (
                        SELECT DISTINCT pl.animal_id 
                        FROM produccion_lechera pl 
                        WHERE pl.deleted_at IS NULL 
                        AND pl.fecha >= ${hace7Dias}
                    )
                    LIMIT 10
                `
            ]);

            const alertas = [];

            // Alertas por eventos pendientes
            eventosPendientes.forEach(evento => {
                alertas.push({
                    id: `evento-${evento.evento_sanitario_id}`,
                    tipo: 'salud',
                    titulo: `Evento pendiente: ${evento.tipo_evento.nombre}`,
                    descripcion: `Animal ${evento.animal.arete} - Fecha: ${new Date(evento.fecha).toLocaleDateString('es-ES')}`,
                    severidad: 'alta',
                    fecha: evento.fecha
                });
            });

            // Alertas por partos próximos
            partosProximos.forEach(diagnostico => {
                const diasRestantes = Math.ceil((new Date(diagnostico.fecha_probable_parto) - hoy) / (1000 * 60 * 60 * 24));
                alertas.push({
                    id: `parto-${diagnostico.prenez_id}`,
                    tipo: 'reproduccion',
                    titulo: `Parto próximo: ${diagnostico.monta.hembra.arete}`,
                    descripcion: `Fecha estimada: ${new Date(diagnostico.fecha_probable_parto).toLocaleDateString('es-ES')} (${diasRestantes} días)`,
                    severidad: diasRestantes <= 3 ? 'alta' : 'media',
                    fecha: diagnostico.fecha_probable_parto
                });
            });

            // Alertas por stock bajo
            stockBajo.forEach(insumo => {
                alertas.push({
                    id: `stock-${insumo.insumo_id}`,
                    tipo: 'inventario',
                    titulo: `Stock bajo: ${insumo.nombre}`,
                    descripcion: `Cantidad actual: ${insumo.cantidad} unidades`,
                    severidad: insumo.cantidad < 5 ? 'alta' : 'media',
                    fecha: hoy
                });
            });

            // Alertas por vacas sin producción
            const vacasSinProd = convertBigInt(vacasSinProduccion);
            vacasSinProd.forEach(vaca => {
                alertas.push({
                    id: `produccion-${vaca.animal_id}`,
                    tipo: 'produccion',
                    titulo: `Vaca sin producción: ${vaca.arete}`,
                    descripcion: `Sin registro de producción en los últimos 7 días`,
                    severidad: 'media',
                    fecha: hoy
                });
            });

            console.log('✅ Alertas reales generadas:', alertas.length);

            return res.json({
                ok: true,
                data: alertas
            });

        } catch (error) {
            console.error('❌ Error en getAlertasSistema:', error);
            return res.status(500).json({
                ok: false,
                msg: "Error interno al cargar alertas",
                error: error.message
            });
        }
    }

    static async getDashboardCompleto(req, res) {
        try {
            console.log('🏠 Iniciando getDashboardCompleto...');

            const [kpis, tendencia, distribucion, metricasReproduccion, alertas] = await Promise.all([
                this.getKPIsPrincipales(req, res).then(r => r.data).catch(() => null),
                this.getTendenciaProduccion(req, res).then(r => r.data).catch(() => null),
                this.getDistribucionAnimales(req, res).then(r => r.data).catch(() => null),
                this.getMetricasReproduccion(req, res).then(r => r.data).catch(() => null),
                this.getAlertasSistema(req, res).then(r => r.data).catch(() => [])
            ]);

            console.log('✅ Dashboard completo cargado');

            return res.json({
                ok: true,
                data: {
                    kpis,
                    tendencia,
                    distribucion,
                    metricasReproduccion,
                    alertas
                }
            });

        } catch (error) {
            console.error('❌ Error en getDashboardCompleto:', error);
            return res.status(500).json({
                ok: false,
                msg: "Error interno al cargar dashboard completo",
                error: error.message
            });
        }
    }
}
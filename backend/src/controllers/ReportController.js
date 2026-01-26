import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import transporter from '../config/emailConfig.js';

const prisma = new PrismaClient();

export default class ReportController {

  static async enviarReporteCorreo(req, res) {
    try {
      const { 
        email, 
        reportType, 
        fechaInicio, 
        fechaFin,
        usuarioSolicitante 
      } = req.body;

      if (!email || !reportType) {
        return res.status(400).json({
          ok: false,
          msg: "Email y tipo de reporte son requeridos"
        });
      }

      const fechaFinHastaHoy = fechaFin ? new Date(fechaFin) : new Date();
      const fechaInicioObj = fechaInicio ? new Date(fechaInicio) : new Date('2000-01-01');

      const excelBuffer = await ReportController.generarExcelReport(
        reportType, 
        fechaInicioObj, 
        fechaFinHastaHoy
      );

      await ReportController.enviarEmailConAdjunto(
        email,
        reportType,
        excelBuffer,
        fechaInicioObj.toISOString().split('T')[0],
        fechaFinHastaHoy.toISOString().split('T')[0],
        usuarioSolicitante
      );

      return res.json({
        ok: true,
        msg: `Reporte ${reportType} enviado exitosamente a ${email}`
      });

    } catch (error) {
      console.error('Error en enviarReporteCorreo:', error);
      return res.status(500).json({
        ok: false,
        msg: "Error interno al enviar reporte",
        error: error.message
      });
    }
  }

  static async generarExcelReport(reportType, fechaInicio, fechaFin) {
    const workbook = new ExcelJS.Workbook();

    switch (reportType) {
      case 'inventario-insumos':
        return await ReportController.generarReporteInventario(workbook);
      
      case 'compras-insumos':
        return await ReportController.generarReporteComprasInsumos(workbook, fechaInicio, fechaFin);
      
      case 'compras-animales':
        return await ReportController.generarReporteComprasAnimales(workbook, fechaInicio, fechaFin);
      
      case 'produccion-lechera':
        return await ReportController.generarReporteProduccionLechera(workbook, fechaInicio, fechaFin);
      
      case 'eventos-sanitarios':
        return await ReportController.generarReporteEventosSanitarios(workbook, fechaInicio, fechaFin);
      
      case 'metricas-financieras':
        return await ReportController.generarReporteMetricasFinancieras(workbook, fechaInicio, fechaFin);
      
      default:
        throw new Error('Tipo de reporte no válido');
    }
  }

  static async generarReporteInventario(workbook) {
    const worksheet = workbook.addWorksheet('Inventario Insumos');

    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'INFORME DE INVENTARIO DE INSUMOS';
    worksheet.getCell('A1').font = { 
      size: 16, 
      bold: true, 
      color: { argb: 'FFFFFF' } 
    };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2E86AB' }
    };
    worksheet.getCell('A1').alignment = { 
      horizontal: 'center',
      vertical: 'middle'
    };

    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = 'SISTEMA DE GESTIÓN BOVINO - DEPARTAMENTO DE INVENTARIOS';
    worksheet.getCell('A2').font = { 
      size: 12, 
      bold: true,
      italic: true 
    };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:F3');
    worksheet.getCell('A3').value = `FECHA DE GENERACIÓN: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    worksheet.getCell('A3').font = { bold: true };
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A4:F4');
    worksheet.getCell('A4').value = 'RESPONSABLE: SISTEMA AUTOMATIZADO DE REPORTES';
    worksheet.getCell('A4').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A5:F5');
    worksheet.getCell('A5').value = 'PROPÓSITO: CONTROL Y GESTIÓN DE STOCK DE INSUMOS';
    worksheet.getCell('A5').font = { italic: true };
    worksheet.getCell('A5').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    const headers = ['ID', 'NOMBRE DEL INSUMO', 'TIPO', 'CANTIDAD DISPONIBLE', 'UNIDAD DE MEDIDA', 'DESCRIPCIÓN'];
    worksheet.addRow(headers);

    const insumos = await prisma.insumos.findMany({
      where: { deleted_at: null },
      include: {
        tipo_insumo: true,
        unidad: true
      },
      orderBy: { nombre: 'asc' }
    });

    insumos.forEach(insumo => {
      worksheet.addRow([
        insumo.insumo_id,
        insumo.nombre,
        insumo.tipo_insumo?.nombre || 'N/A',
        insumo.cantidad,
        insumo.unidad?.nombre || 'N/A',
        insumo.descripcion || 'Sin descripción'
      ]);
    });

    worksheet.getRow(7).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E86AB' } };
      cell.alignment = { horizontal: 'center' };
    });

    const totalRow = insumos.length + 8;
    
    let totalCantidad = 0;
    let bajoStock = 0;
    let tiposCount = {};
    
    insumos.forEach(insumo => {
      totalCantidad += insumo.cantidad;
      if (insumo.cantidad < 10) bajoStock++;
      
      const tipo = insumo.tipo_insumo?.nombre || 'Sin tipo';
      tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
    });

    const tiposUnicos = Object.keys(tiposCount).length;

    worksheet.mergeCells(`A${totalRow}:C${totalRow}`);
    worksheet.getCell(`A${totalRow}`).value = 'ESTADÍSTICAS DEL INVENTARIO';
    worksheet.getCell(`A${totalRow}`).font = { bold: true, size: 12, color: { argb: '2E86AB' } };

    worksheet.getRow(totalRow + 1).values = ['Total de Insumos:', insumos.length, '', 'Cantidad Total:', totalCantidad];
    worksheet.getRow(totalRow + 2).values = ['Insumos Bajo Stock (<10):', bajoStock, '', '% Bajo Stock:', `${((bajoStock / insumos.length) * 100 || 0).toFixed(1)}%`];
    worksheet.getRow(totalRow + 3).values = ['Tipos de Insumos:', tiposUnicos, '', 'Fecha de Corte:', new Date().toLocaleDateString()];
    worksheet.getRow(totalRow + 4).values = ['Promedio por Tipo:', (insumos.length / tiposUnicos || 0).toFixed(1), '', 'Promedio Stock:', (totalCantidad / insumos.length || 0).toFixed(1)];

    return await workbook.xlsx.writeBuffer();
  }

  static async generarReporteComprasInsumos(workbook, fechaInicio, fechaFin) {
    const worksheet = workbook.addWorksheet('Compras Insumos');

    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = 'REPORTE FINANCIERO DE COMPRAS DE INSUMOS';
    worksheet.getCell('A1').font = { 
      size: 16, 
      bold: true, 
      color: { argb: 'FFFFFF' } 
    };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'A23B72' }
    };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:H2');
    worksheet.getCell('A2').value = 'ÁREA DE COMPRAS - CONTROL DE ADQUISICIONES';
    worksheet.getCell('A2').font = { size: 12, bold: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:H3');
    worksheet.getCell('A3').value = `PERÍODO CONTABLE: ${fechaInicio.toLocaleDateString()} AL ${fechaFin.toLocaleDateString()}`;
    worksheet.getCell('A3').font = { bold: true };
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A4:H4');
    worksheet.getCell('A4').value = `FECHA DE EMISIÓN: ${new Date().toLocaleDateString()} - HORA: ${new Date().toLocaleTimeString()}`;
    worksheet.getCell('A4').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A5:H5');
    worksheet.getCell('A5').value = 'MONEDA: CÓRDOBAS (C$)';
    worksheet.getCell('A5').font = { italic: true };
    worksheet.getCell('A5').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    const headers = ['NÚMERO DE COMPRA', 'FECHA DE COMPRA', 'PROVEEDOR', 'INSUMO', 'CANTIDAD', 'PRECIO UNIT.', 'TOTAL COMPRA', 'OBSERVACIONES'];
    worksheet.addRow(headers);

    const compras = await prisma.compras_insumos.findMany({
      where: {
        deleted_at: null,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        proveedor: true,
        detalles: {
          include: {
            insumo: true
          }
        }
      },
      orderBy: { fecha: 'desc' }
    });

    let totalGeneral = 0;
    let totalCompras = 0;
    let totalItems = 0;
    let proveedores = new Set();
    
    compras.forEach(compra => {
      proveedores.add(compra.proveedor?.nombre_compañia || 'Sin proveedor');
      totalCompras++;
      
      compra.detalles.forEach(detalle => {
        totalItems++;
        const total = Number(detalle.precio) * detalle.cantidad;
        totalGeneral += total;
        worksheet.addRow([
          compra.numero_compra,
          compra.fecha.toLocaleDateString(),
          compra.proveedor?.nombre_compañia || 'N/A',
          detalle.insumo.nombre,
          detalle.cantidad,
          `C$ ${Number(detalle.precio).toFixed(2)}`,
          `C$ ${total.toFixed(2)}`,
          ''
        ]);
      });
    });

    worksheet.getRow(7).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'A23B72' } };
      cell.alignment = { horizontal: 'center' };
    });

    const startRow = 7 + totalItems + 2;
    const promedioPorCompra = totalCompras > 0 ? totalGeneral / totalCompras : 0;
    const promedioPorItem = totalItems > 0 ? totalGeneral / totalItems : 0;
    const diasPeriodo = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) || 1;
    const comprasPorDia = totalCompras / diasPeriodo;

    worksheet.mergeCells(`A${startRow}:H${startRow}`);
    worksheet.getCell(`A${startRow}`).value = 'ESTADÍSTICAS Y RESUMEN';
    worksheet.getCell(`A${startRow}`).font = { bold: true, size: 14, color: { argb: 'A23B72' } };
    worksheet.getCell(`A${startRow}`).alignment = { horizontal: 'center' };

    const statsRows = [
      ['Total de Compras:', totalCompras, '', 'Total de Items:', totalItems],
      ['Monto Total General:', `C$ ${totalGeneral.toFixed(2)}`, '', 'Promedio por Compra:', `C$ ${promedioPorCompra.toFixed(2)}`],
      ['Promedio por Item:', `C$ ${promedioPorItem.toFixed(2)}`, '', 'Proveedores Diferentes:', proveedores.size],
      ['Período Analizado:', `${fechaInicio.toLocaleDateString()} a ${fechaFin.toLocaleDateString()}`, '', 'Días del Período:', diasPeriodo],
      ['Compras por Día:', comprasPorDia.toFixed(2), '', 'Fecha de Generación:', new Date().toLocaleDateString()]
    ];

    statsRows.forEach((row, index) => {
      const currentRow = startRow + 1 + index;
      worksheet.getRow(currentRow).values = row;
      
      if (index % 2 === 0) {
        worksheet.getRow(currentRow).eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } };
        });
      }
    });

    return await workbook.xlsx.writeBuffer();
  }

  static async generarReporteComprasAnimales(workbook, fechaInicio, fechaFin) {
    const worksheet = workbook.addWorksheet('Compras Animales');

    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'REGISTRO OFICIAL DE ADQUISICIÓN DE GANADO';
    worksheet.getCell('A1').font = { 
      size: 16, 
      bold: true, 
      color: { argb: 'FFFFFF' } 
    };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F18F01' }
    };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = 'DEPARTAMENTO DE PRODUCCIÓN BOVINA';
    worksheet.getCell('A2').font = { size: 12, bold: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:G3');
    worksheet.getCell('A3').value = `PERÍODO DE ADQUISICIONES: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`;
    worksheet.getCell('A3').font = { bold: true };
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A4:G4');
    worksheet.getCell('A4').value = `DOCUMENTO GENERADO: ${new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`;
    worksheet.getCell('A4').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A5:G5');
    worksheet.getCell('A5').value = 'FINALIDAD: CONTROL PATRIMONIAL Y GESTIÓN DE HATO';
    worksheet.getCell('A5').font = { italic: true };
    worksheet.getCell('A5').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    const headers = ['N° COMPRA', 'FECHA', 'PROVEEDOR', 'ANIMAL (ARETE)', 'SEXO', 'PRECIO', 'OBSERVACIONES'];
    worksheet.addRow(headers);

    const compras = await prisma.compras_animales.findMany({
      where: {
        deleted_at: null,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        proveedor: true,
        detalles: {
          include: {
            animal: {
              include: {
                raza: true
              }
            }
          }
        }
      }
    });

    let totalCompras = 0;
    let machosCount = 0;
    let hembrasCount = 0;
    let animalesPorCompra = {};
    let totalComprasRegistros = 0;
    let razasCount = {};
    
    compras.forEach(compra => {
      totalComprasRegistros++;
      
      compra.detalles.forEach(detalle => {
        const precio = Number(detalle.precio);
        totalCompras += precio;
        
        if (detalle.animal.sexo === 'M') {
          machosCount++;
        } else if (detalle.animal.sexo === 'H') {
          hembrasCount++;
        }
        
        const raza = detalle.animal.raza?.nombre || 'Sin raza';
        razasCount[raza] = (razasCount[raza] || 0) + 1;
        
        if (!animalesPorCompra[compra.numero_compra]) {
          animalesPorCompra[compra.numero_compra] = 0;
        }
        animalesPorCompra[compra.numero_compra]++;
        
        worksheet.addRow([
          compra.numero_compra,
          compra.fecha.toLocaleDateString(),
          compra.proveedor?.nombre_compañia || 'N/A',
          detalle.animal.arete,
          detalle.animal.sexo === 'M' ? 'Macho' : 'Hembra',
          `C$ ${precio.toFixed(2)}`,
          detalle.observaciones || 'Sin observaciones'
        ]);
      });
    });

    worksheet.getRow(7).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F18F01' } };
      cell.alignment = { horizontal: 'center' };
    });

    const totalAnimales = machosCount + hembrasCount;
    const promedioPorAnimal = totalAnimales > 0 ? totalCompras / totalAnimales : 0;
    const comprasConAnimales = Object.keys(animalesPorCompra).length;
    const promedioAnimalesPorCompra = comprasConAnimales > 0 ? totalAnimales / comprasConAnimales : 0;
    const razasDiferentes = Object.keys(razasCount).length;
    
    const startRow = 7 + totalAnimales + 2;
    
    worksheet.mergeCells(`A${startRow}:G${startRow}`);
    worksheet.getCell(`A${startRow}`).value = 'ANÁLISIS ESTADÍSTICO DE COMPRAS';
    worksheet.getCell(`A${startRow}`).font = { bold: true, size: 14, color: { argb: 'F18F01' } };
    worksheet.getCell(`A${startRow}`).alignment = { horizontal: 'center' };

    const statsRows = [
      ['Total de Animales Comprados:', totalAnimales, '', 'Compras Realizadas:', totalComprasRegistros],
      ['Total Machos:', machosCount, '', 'Total Hembras:', hembrasCount],
      ['Porcentaje Machos:', `${((machosCount / totalAnimales) * 100 || 0).toFixed(1)}%`, '', 'Porcentaje Hembras:', `${((hembrasCount / totalAnimales) * 100 || 0).toFixed(1)}%`],
      ['Inversión Total:', `C$ ${totalCompras.toFixed(2)}`, '', 'Promedio por Animal:', `C$ ${promedioPorAnimal.toFixed(2)}`],
      ['Promedio Animales por Compra:', promedioAnimalesPorCompra.toFixed(1), '', 'Razas Diferentes:', razasDiferentes],
      ['Compra con más Animales:', Math.max(...Object.values(animalesPorCompra)), '', 'Fecha de Análisis:', new Date().toLocaleDateString()]
    ];

    statsRows.forEach((row, index) => {
      const currentRow = startRow + 1 + index;
      worksheet.getRow(currentRow).values = row;
      
      if (index % 2 === 0) {
        worksheet.getRow(currentRow).eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5E6' } };
        });
      }
    });

    return await workbook.xlsx.writeBuffer();
  }

  static async generarReporteProduccionLechera(workbook, fechaInicio, fechaFin) {
    const worksheet = workbook.addWorksheet('Producción Lechera');

    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'INFORME TÉCNICO DE PRODUCCIÓN LECHERA';
    worksheet.getCell('A1').font = { 
      size: 16, 
      bold: true, 
      color: { argb: 'FFFFFF' } 
    };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '3BB273' }
    };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = 'DEPARTAMENTO DE PRODUCCIÓN LÁCTEA';
    worksheet.getCell('A2').font = { size: 12, bold: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:F3');
    worksheet.getCell('A3').value = `PERÍODO DE ANÁLISIS: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`;
    worksheet.getCell('A3').font = { bold: true };
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A4:F4');
    worksheet.getCell('A4').value = `REPORTE GENERADO EL: ${new Date().toLocaleDateString()} A LAS ${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}`;
    worksheet.getCell('A4').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A5:F5');
    worksheet.getCell('A5').value = 'UNIDAD DE MEDIDA: LITROS (L)';
    worksheet.getCell('A5').font = { italic: true };
    worksheet.getCell('A5').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    const headers = ['FECHA DE ORDEÑO', 'ANIMAL (ARETE)', 'RAZA', 'CANTIDAD (LITROS)', 'UNIDAD', 'DESCRIPCIÓN'];
    worksheet.addRow(headers);

    const produccion = await prisma.produccion_lechera.findMany({
      where: {
        deleted_at: null,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        animal: {
          include: {
            raza: true
          }
        },
        unidad: true
      },
      orderBy: { fecha: 'desc' }
    });

    let totalLitros = 0;
    let animalesUnicos = new Set();
    let produccionPorFecha = {};
    
    produccion.forEach(item => {
      totalLitros += item.cantidad;
      animalesUnicos.add(item.animal?.arete || 'Desconocido');
      
      const fecha = item.fecha.toLocaleDateString();
      produccionPorFecha[fecha] = (produccionPorFecha[fecha] || 0) + item.cantidad;
      
      worksheet.addRow([
        fecha,
        item.animal?.arete || 'N/A',
        item.animal?.raza?.nombre || 'Sin raza',
        item.cantidad,
        item.unidad?.nombre || 'N/A',
        item.descripcion || 'Sin descripción'
      ]);
    });

    worksheet.getRow(7).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3BB273' } };
      cell.alignment = { horizontal: 'center' };
    });

    const totalRow = produccion.length + 8;
    const diasPeriodo = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) || 1;
    const promedioDiario = diasPeriodo > 0 ? totalLitros / diasPeriodo : 0;
    const promedioPorAnimal = animalesUnicos.size > 0 ? totalLitros / animalesUnicos.size : 0;
    const promedioPorRegistro = produccion.length > 0 ? totalLitros / produccion.length : 0;
    
    const fechasUnicas = Object.keys(produccionPorFecha).length;
    const promedioPorDiaConDatos = fechasUnicas > 0 ? totalLitros / fechasUnicas : 0;

    worksheet.mergeCells(`A${totalRow}:B${totalRow}`);
    worksheet.getCell(`A${totalRow}`).value = 'MÉTRICAS DE PRODUCCIÓN LECHERA';
    worksheet.getCell(`A${totalRow}`).font = { bold: true, size: 12, color: { argb: '3BB273' } };

    const statsRows = [
      ['PRODUCCIÓN TOTAL DEL PERÍODO:', totalLitros, '', 'Litros', 'Promedio Diario Total:', promedioDiario.toFixed(2)],
      ['NÚMERO DE REGISTROS:', produccion.length, '', 'Animales Diferentes:', animalesUnicos.size, 'Promedio por Animal:', promedioPorAnimal.toFixed(2)],
      ['PROMEDIO POR REGISTRO:', promedioPorRegistro.toFixed(2), '', 'Días con Producción:', fechasUnicas, 'Promedio por Día con Datos:', promedioPorDiaConDatos.toFixed(2)],
      ['DÍAS DEL PERÍODO:', diasPeriodo, '', 'Fechas sin Producción:', diasPeriodo - fechasUnicas, 'Eficiencia de Ordeño:', `${((fechasUnicas / diasPeriodo) * 100).toFixed(1)}%`],
      ['FECHA DE MAYOR PRODUCCIÓN:', Object.keys(produccionPorFecha).reduce((a, b) => produccionPorFecha[a] > produccionPorFecha[b] ? a : b, 'N/A'), '', 'Litros en esa Fecha:', Math.max(...Object.values(produccionPorFecha), 0), 'Fecha de Análisis:', new Date().toLocaleDateString()]
    ];

    statsRows.forEach((row, index) => {
      const currentRow = totalRow + 1 + index;
      worksheet.getRow(currentRow).values = row;
      
      if (index % 2 === 0) {
        worksheet.getRow(currentRow).eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0FFF4' } };
        });
      }
    });

    return await workbook.xlsx.writeBuffer();
  }

  static async generarReporteEventosSanitarios(workbook, fechaInicio, fechaFin) {
    const worksheet = workbook.addWorksheet('Eventos Sanitarios');

    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'REPORTE SANITARIO Y VETERINARIO DEL HATO';
    worksheet.getCell('A1').font = { 
      size: 16, 
      bold: true, 
      color: { argb: 'FFFFFF' } 
    };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'DB3069' }
    };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = 'DEPARTAMENTO DE SANIDAD ANIMAL';
    worksheet.getCell('A2').font = { size: 12, bold: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:G3');
    worksheet.getCell('A3').value = `VIGILANCIA EPIDEMIOLÓGICA: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`;
    worksheet.getCell('A3').font = { bold: true };
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A4:G4');
    worksheet.getCell('A4').value = `DOCUMENTO VÁLIDO PARA CONTROL SANITARIO - EMITIDO: ${new Date().toLocaleDateString()}`;
    worksheet.getCell('A4').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A5:G5');
    worksheet.getCell('A5').value = 'CLASIFICACIÓN: INFORMACIÓN CONFIDENCIAL - USO INTERNO';
    worksheet.getCell('A5').font = { italic: true };
    worksheet.getCell('A5').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    const headers = ['N° EVENTO', 'FECHA', 'ANIMAL', 'TIPO DE EVENTO', 'ESTADO ACTUAL', 'DIAGNÓSTICO', 'TRATAMIENTO APLICADO'];
    worksheet.addRow(headers);

    const eventos = await prisma.evento_sanitario.findMany({
      where: {
        deleted_at: null,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        animal: true,
        tipo_evento: true
      },
      orderBy: { fecha: 'desc' }
    });

    eventos.forEach(evento => {
      worksheet.addRow([
        evento.numero_evento || 'N/A',
        evento.fecha.toLocaleDateString(),
        evento.animal?.arete || 'N/A',
        evento.tipo_evento?.nombre || 'N/A',
        evento.estado || 'Pendiente',
        evento.diagnostico || 'Sin diagnóstico',
        evento.tratamiento || 'Sin tratamiento'
      ]);
    });

    worksheet.getRow(7).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DB3069' } };
      cell.alignment = { horizontal: 'center' };
    });

    const totalRow = eventos.length + 8;
    const eventosResueltos = eventos.filter(e => e.estado === 'Resuelto' || e.estado === 'resuelto').length;
    const eventosPendientes = eventos.filter(e => e.estado === 'Pendiente' || e.estado === 'pendiente').length;
    const eventosEnProceso = eventos.filter(e => e.estado === 'En Proceso' || e.estado === 'en proceso').length;
    const animalesAfectados = new Set(eventos.map(e => e.animal?.arete).filter(Boolean)).size;
    
    const diasPeriodo = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) || 1;
    const eventosPorDia = eventos.length / diasPeriodo;
    const eventosPorAnimal = animalesAfectados > 0 ? eventos.length / animalesAfectados : 0;
    const tasaResolucion = eventos.length > 0 ? (eventosResueltos / eventos.length) * 100 : 0;
    const tiempoPromedioResolucion = eventosResueltos > 0 ? diasPeriodo / eventosResueltos : 0;

    worksheet.mergeCells(`A${totalRow}:C${totalRow}`);
    worksheet.getCell(`A${totalRow}`).value = 'ESTADÍSTICAS SANITARIAS COMPLETAS';
    worksheet.getCell(`A${totalRow}`).font = { bold: true, size: 12, color: { argb: 'DB3069' } };

    const statsRows = [
      ['Total de Eventos:', eventos.length, '', 'Eventos Resueltos:', eventosResueltos, 'Tasa de Resolución:', `${tasaResolucion.toFixed(1)}%`],
      ['Eventos Pendientes:', eventosPendientes, '', 'Eventos en Proceso:', eventosEnProceso, 'Animales Afectados:', animalesAfectados],
      ['Eventos por Día:', eventosPorDia.toFixed(2), '', 'Eventos por Animal:', eventosPorAnimal.toFixed(1), 'Tiempo Promedio Resolución:', `${tiempoPromedioResolucion.toFixed(1)} días`],
      ['Período Analizado:', `${fechaInicio.toLocaleDateString()} a ${fechaFin.toLocaleDateString()}`, '', 'Días del Período:', diasPeriodo, 'Fecha de Análisis:', new Date().toLocaleDateString()],
      ['Índice de Salud del Hato:', `${((eventosResueltos / eventos.length) * 100 || 0).toFixed(1)}%`, '', 'Eventos sin Diagnóstico:', eventos.filter(e => !e.diagnostico || e.diagnostico === 'Sin diagnóstico').length, 'Eventos sin Tratamiento:', eventos.filter(e => !e.tratamiento || e.tratamiento === 'Sin tratamiento').length]
    ];

    statsRows.forEach((row, index) => {
      const currentRow = totalRow + 1 + index;
      worksheet.getRow(currentRow).values = row;
      
      if (index % 2 === 0) {
        worksheet.getRow(currentRow).eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F5' } };
        });
      }
    });

    return await workbook.xlsx.writeBuffer();
  }

  static async generarReporteMetricasFinancieras(workbook, fechaInicio, fechaFin) {
    const worksheet = workbook.addWorksheet('Métricas Financieras');

    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = 'ANÁLISIS FINANCIERO INTEGRAL DEL SISTEMA BOVINO';
    worksheet.getCell('A1').font = { 
      size: 16, 
      bold: true, 
      color: { argb: 'FFFFFF' } 
    };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '5D5D5D' }
    };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = 'DEPARTAMENTO FINANCIERO Y CONTABLE';
    worksheet.getCell('A2').font = { size: 12, bold: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:E3');
    worksheet.getCell('A3').value = `PERÍODO FISCAL: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`;
    worksheet.getCell('A3').font = { bold: true };
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A4:E4');
    worksheet.getCell('A4').value = `INFORME ELABORADO: ${new Date().toLocaleDateString()} - VERSIÓN 1.0`;
    worksheet.getCell('A4').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A5:E5');
    worksheet.getCell('A5').value = 'MONEDA BASE: CÓRDOBAS NICARAGÜENSES (C$)';
    worksheet.getCell('A5').font = { italic: true };
    worksheet.getCell('A5').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    worksheet.addRow(['INDICADOR FINANCIERO', 'VALOR (C$)', 'CATEGORÍA', 'DETALLE', 'OBSERVACIONES']);

    const [
      totalComprasInsumos,
      totalComprasAnimales,
      insumosBajoStock,
      produccionLechera,
      totalAnimales,
      totalEventosSanitarios
    ] = await Promise.all([
      prisma.detalle_compras_insumos.aggregate({
        where: {
          deleted_at: null,
          compra_insumo: {
            fecha: { gte: fechaInicio, lte: fechaFin }
          }
        },
        _sum: {
          precio: true
        },
        _count: {
          _all: true
        }
      }),

      prisma.detalle_compras_animales.aggregate({
        where: {
          deleted_at: null,
          compra_animal: {
            fecha: { gte: fechaInicio, lte: fechaFin }
          }
        },
        _sum: {
          precio: true
        },
        _count: {
          _all: true
        }
      }),

      prisma.insumos.findMany({
        where: {
          deleted_at: null,
          cantidad: { lt: 10 }
        }
      }),

      prisma.produccion_lechera.aggregate({
        where: {
          deleted_at: null,
          fecha: { gte: fechaInicio, lte: fechaFin }
        },
        _sum: {
          cantidad: true
        }
      }),

      prisma.animales.count({
        where: {
          deleted_at: null,
          fecha_nacimiento: { lte: fechaFin }
        }
      }),

      prisma.evento_sanitario.count({
        where: {
          deleted_at: null,
          fecha: { gte: fechaInicio, lte: fechaFin }
        }
      })
    ]);

    const gastoTotalInsumos = Number(totalComprasInsumos._sum?.precio) || 0;
    const gastoTotalAnimales = Number(totalComprasAnimales._sum?.precio) || 0;
    const gastoTotal = gastoTotalInsumos + gastoTotalAnimales;
    const itemsInsumos = totalComprasInsumos._count?._all || 0;
    const itemsAnimales = totalComprasAnimales._count?._all || 0;
    const totalItemsCompras = itemsInsumos + itemsAnimales;
    const produccionLecheTotal = Number(produccionLechera._sum?.cantidad) || 0;
    
    const diasPeriodo = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) || 1;
    const gastoDiarioPromedio = gastoTotal / diasPeriodo;
    const produccionDiariaPromedio = produccionLecheTotal / diasPeriodo;
    const costoPorAnimal = totalAnimales > 0 ? gastoTotal / totalAnimales : 0;
    const eventosPorAnimal = totalAnimales > 0 ? totalEventosSanitarios / totalAnimales : 0;
    const costoPorLitroLeche = produccionLecheTotal > 0 ? gastoTotal / produccionLecheTotal : 0;

    const metrics = [
      ['GASTO TOTAL DEL SISTEMA', `C$ ${gastoTotal.toFixed(2)}`, 'CONSOLIDADO', 'Suma de todas las adquisiciones', `Promedio diario: C$ ${gastoDiarioPromedio.toFixed(2)}`],
      ['INVERSIÓN EN INSUMOS', `C$ ${gastoTotalInsumos.toFixed(2)}`, 'OPERATIVO', `${itemsInsumos} items comprados`, `Porcentaje: ${((gastoTotalInsumos / gastoTotal) * 100 || 0).toFixed(1)}%`],
      ['INVERSIÓN EN GANADO', `C$ ${gastoTotalAnimales.toFixed(2)}`, 'PATRIMONIAL', `${itemsAnimales} animales adquiridos`, `Promedio por animal: C$ ${(gastoTotalAnimales / itemsAnimales || 0).toFixed(2)}`],
      ['INSUMOS CON STOCK BAJO', insumosBajoStock.length, 'INVENTARIO', `Menos de 10 unidades disponibles`, `Valor estimado: C$ ${(insumosBajoStock.reduce((sum, insumo) => sum + (insumo.cantidad * 1000), 0) / 1000).toFixed(2)}`],
      ['PRODUCCIÓN LECHERA TOTAL', `${produccionLecheTotal} litros`, 'INGRESOS', `Período: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`, `Promedio diario: ${produccionDiariaPromedio.toFixed(2)} litros`],
      ['COSTO POR LITRO DE LECHE', `C$ ${costoPorLitroLeche.toFixed(2)}`, 'EFICIENCIA', 'Costo total / Producción lechera', `Costo operativo por litro producido`],
      ['COSTO POR ANIMAL MANTENIDO', `C$ ${costoPorAnimal.toFixed(2)}`, 'GESTIÓN', `Total animales: ${totalAnimales}`, `Inversión promedio por cabeza`],
      ['EVENTOS SANITARIOS', totalEventosSanitarios, 'SALUD', `Eventos en el período`, `Promedio: ${eventosPorAnimal.toFixed(2)} por animal`],
      ['TOTAL DE ITEMS COMPRADOS', totalItemsCompras, 'LOGÍSTICA', `Insumos: ${itemsInsumos} | Animales: ${itemsAnimales}`, `Promedio: ${(totalItemsCompras / diasPeriodo).toFixed(2)} items/día`],
      ['PERÍODO ANALIZADO', `${diasPeriodo} días`, 'TEMPORAL', `Del ${fechaInicio.toLocaleDateString()} al ${fechaFin.toLocaleDateString()}`, `Fecha de análisis: ${new Date().toLocaleDateString()}`]
    ];

    metrics.forEach(metric => {
      worksheet.addRow(metric);
    });

    worksheet.getRow(7).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '5D5D5D' } };
      cell.alignment = { horizontal: 'center' };
    });

    const startRow = 7 + metrics.length + 2;
    
    worksheet.mergeCells(`A${startRow}:E${startRow}`);
    worksheet.getCell(`A${startRow}`).value = 'RESUMEN EJECUTIVO Y RECOMENDACIONES';
    worksheet.getCell(`A${startRow}`).font = { bold: true, size: 14, color: { argb: '5D5D5D' } };
    worksheet.getCell(`A${startRow}`).alignment = { horizontal: 'center' };

    const resumenRows = [
      ['CONCLUSIÓN PRINCIPAL:', '', '', '', `El sistema ha invertido C$ ${gastoTotal.toFixed(2)} en el período, con ${insumosBajoStock.length} insumos requiriendo atención inmediata.`],
      ['EFICIENCIA OPERATIVA:', '', '', '', `Costo por litro de leche: C$ ${costoPorLitroLeche.toFixed(2)} | Costo por animal: C$ ${costoPorAnimal.toFixed(2)}`],
      ['RECOMENDACIÓN 1:', '', '', '', `${insumosBajoStock.length > 0 ? `Reabastecer ${insumosBajoStock.length} insumos con stock bajo.` : 'Stock de insumos en niveles adecuados.'}`],
      ['RECOMENDACIÓN 2:', '', '', '', `Optimizar compras para reducir costo por litro de leche (actual: C$ ${costoPorLitroLeche.toFixed(2)}).`],
      ['RECOMENDACIÓN 3:', '', '', '', `Monitorear eventos sanitarios: ${totalEventosSanitarios} eventos registrados (${eventosPorAnimal.toFixed(2)} por animal).`],
      ['PRÓXIMA REVISIÓN:', '', '', '', `Programar para: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`]
    ];

    resumenRows.forEach((row, index) => {
      const currentRow = startRow + 1 + index;
      worksheet.getRow(currentRow).values = row;
      
      if (index % 2 === 0) {
        worksheet.getRow(currentRow).eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } };
        });
      }
    });

    return await workbook.xlsx.writeBuffer();
  }

  static async enviarEmailConAdjunto(email, reportType, excelBuffer, fechaInicio, fechaFin, usuarioSolicitante) {
    const reportNames = {
      'inventario-insumos': 'Inventario de Insumos',
      'compras-insumos': 'Compras de Insumos',
      'compras-animales': 'Compras de Animales',
      'produccion-lechera': 'Producción Lechera',
      'eventos-sanitarios': 'Eventos Sanitarios',
      'metricas-financieras': 'Métricas Financieras'
    };

    const mailOptions = {
      from: `Sistema Bovino <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Reporte ${reportNames[reportType]} - ${new Date().toLocaleDateString()}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #2E86AB;">Sistema Bovino - Reporte Generado</h2>
          <p><strong>Reporte:</strong> ${reportNames[reportType]}</p>
          <p><strong>Período:</strong> ${fechaInicio} a ${fechaFin}</p>
          <p><strong>Solicitado por:</strong> ${usuarioSolicitante || 'Sistema'}</p>
          <p>El archivo Excel se encuentra adjunto.</p>
        </div>
      `,
      attachments: [
        {
          filename: `reporte_${reportType}_${fechaInicio}_a_${fechaFin}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
  }

  static async getTiposReporte(req, res) {
    try {
      const reportTypes = [
        { 
          value: 'inventario-insumos', 
          label: 'Inventario de Insumos',
          description: 'Stock actual de todos los insumos'
        },
        { 
          value: 'compras-insumos', 
          label: 'Compras de Insumos',
          description: 'Historial de compras de insumos'
        },
        { 
          value: 'compras-animales', 
          label: 'Compras de Animales', 
          description: 'Historial de compras de animales'
        },
        { 
          value: 'produccion-lechera', 
          label: 'Producción Lechera',
          description: 'Registro de producción de leche'
        },
        { 
          value: 'eventos-sanitarios', 
          label: 'Eventos Sanitarios',
          description: 'Eventos de salud y tratamientos'
        },
        { 
          value: 'metricas-financieras', 
          label: 'Métricas Financieras',
          description: 'KPIs y gastos del período'
        }
      ];

      return res.json({
        ok: true,
        data: reportTypes
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error interno al obtener tipos de reporte",
        error: error.message
      });
    }
  }
}
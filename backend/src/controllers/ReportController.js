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
    worksheet.getCell('A1').value = 'INVENTARIO DE INSUMOS - SISTEMA BOVINO';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = `Generado el: ${new Date().toLocaleDateString()}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    const headers = ['ID', 'Nombre', 'Tipo', 'Cantidad', 'Unidad', 'Descripción'];
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

    worksheet.getRow(3).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E86AB' } };
    });

    return await workbook.xlsx.writeBuffer();
  }

  static async generarReporteComprasInsumos(workbook, fechaInicio, fechaFin) {
    const worksheet = workbook.addWorksheet('Compras Insumos');

    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'COMPRAS DE INSUMOS';
    worksheet.getCell('A1').font = { size: 16, bold: true };

    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `Período: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`;

    const headers = ['N° Compra', 'Fecha', 'Proveedor', 'Insumo', 'Cantidad', 'Precio Unit.', 'Total'];
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

    compras.forEach(compra => {
      compra.detalles.forEach(detalle => {
        const total = Number(detalle.precio) * detalle.cantidad;
        worksheet.addRow([
          compra.numero_compra,
          compra.fecha.toLocaleDateString(),
          compra.proveedor?.nombre_compañia || 'N/A',
          detalle.insumo.nombre,
          detalle.cantidad,
          `C$ ${Number(detalle.precio).toFixed(2)}`,
          `C$ ${total.toFixed(2)}`
        ]);
      });
    });

    worksheet.getRow(3).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'A23B72' } };
    });

    return await workbook.xlsx.writeBuffer();
  }

  static async generarReporteComprasAnimales(workbook, fechaInicio, fechaFin) {
    const worksheet = workbook.addWorksheet('Compras Animales');

    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'COMPRAS DE ANIMALES';
    worksheet.getCell('A1').font = { size: 16, bold: true };

    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = `Período: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`;

    const headers = ['N° Compra', 'Fecha', 'Proveedor', 'Animal', 'Precio', 'Observaciones'];
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
            animal: true
          }
        }
      }
    });

    compras.forEach(compra => {
      compra.detalles.forEach(detalle => {
        worksheet.addRow([
          compra.numero_compra,
          compra.fecha.toLocaleDateString(),
          compra.proveedor?.nombre_compañia || 'N/A',
          detalle.animal.arete,
          `C$ ${Number(detalle.precio).toFixed(2)}`,
          detalle.observaciones || 'Sin observaciones'
        ]);
      });
    });

    worksheet.getRow(3).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F18F01' } };
    });

    return await workbook.xlsx.writeBuffer();
  }

  static async generarReporteProduccionLechera(workbook, fechaInicio, fechaFin) {
    const worksheet = workbook.addWorksheet('Producción Lechera');

    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = 'PRODUCCIÓN LECHERA';
    worksheet.getCell('A1').font = { size: 16, bold: true };

    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = `Período: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`;

    const headers = ['Fecha', 'Animal', 'Cantidad (L)', 'Unidad', 'Descripción'];
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
        animal: true,
        unidad: true
      },
      orderBy: { fecha: 'desc' }
    });

    let totalLitros = 0;
    produccion.forEach(item => {
      totalLitros += item.cantidad;
      worksheet.addRow([
        item.fecha.toLocaleDateString(),
        item.animal?.arete || 'N/A',
        item.cantidad,
        item.unidad?.nombre || 'N/A',
        item.descripcion || 'Sin descripción'
      ]);
    });

    worksheet.addRow([]);
    worksheet.addRow(['TOTAL PRODUCIDO:', '', totalLitros, 'Litros', '']);

    worksheet.getRow(3).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3BB273' } };
    });

    return await workbook.xlsx.writeBuffer();
  }

  static async generarReporteMetricasFinancieras(workbook, fechaInicio, fechaFin) {
    const worksheet = workbook.addWorksheet('Métricas Financieras');

    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'MÉTRICAS FINANCIERAS - SISTEMA BOVINO';
    worksheet.getCell('A1').font = { size: 16, bold: true };

    worksheet.mergeCells('A2:D2');
    worksheet.getCell('A2').value = `Período: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`;

    const [totalComprasInsumos, totalComprasAnimales, insumosBajoStock] = await Promise.all([
      prisma.detalle_compras_insumos.aggregate({
        where: {
          deleted_at: null,
          compra_insumo: {
            fecha: { gte: fechaInicio, lte: fechaFin }
          }
        },
        _sum: {
          precio: true
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
        }
      }),

      prisma.insumos.findMany({
        where: {
          deleted_at: null,
          cantidad: { lt: 10 }
        }
      })
    ]);

    const gastoTotalInsumos = Number(totalComprasInsumos._sum?.precio) || 0;
    const gastoTotalAnimales = Number(totalComprasAnimales._sum?.precio) || 0;
    const gastoTotal = gastoTotalInsumos + gastoTotalAnimales;

    worksheet.addRow(['MÉTRICA', 'VALOR', 'DETALLE']);
    worksheet.addRow(['Gasto Total', `C$ ${gastoTotal.toFixed(2)}`, 'Período completo']);
    worksheet.addRow(['Gasto Insumos', `C$ ${gastoTotalInsumos.toFixed(2)}`, 'Insumos y medicinas']);
    worksheet.addRow(['Gasto Animales', `C$ ${gastoTotalAnimales.toFixed(2)}`, 'Compra de animales']);
    worksheet.addRow(['Insumos Stock Bajo', insumosBajoStock.length, 'Menos de 10 unidades']);
    worksheet.addRow(['Fecha Generación', new Date().toLocaleDateString(), 'Reporte automático']);

    worksheet.getRow(3).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '5D5D5D' } };
    });

    return await workbook.xlsx.writeBuffer();
  }

  static async generarReporteEventosSanitarios(workbook, fechaInicio, fechaFin) {
    const worksheet = workbook.addWorksheet('Eventos Sanitarios');

    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'EVENTOS SANITARIOS';
    worksheet.getCell('A1').font = { size: 16, bold: true };

    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `Período: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`;

    const headers = ['N° Evento', 'Fecha', 'Animal', 'Tipo Evento', 'Estado', 'Diagnóstico', 'Tratamiento'];
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

    worksheet.getRow(3).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DB3069' } };
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
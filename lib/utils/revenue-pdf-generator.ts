/**
 * lib/utils/revenue-pdf-generator.ts
 * 
 * PDF generator voor revenue/inkomsten overzichten. Gebruikt pdf-lib voor Edge Runtime
 * compatibele PDF generatie. Toont inkomsten per klant en project voor een specifieke periode.
 */
import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export interface RevenuePDFEntry {
  clientName: string;
  totalHours: number;
  totalRevenue: number;
  projects: {
    projectName: string;
    hours: number;
    revenue: number;
    rateExBtw: number | null;
  }[];
}

export async function generateRevenuePDF(
  periodType: string,
  periodLabel: string,
  startDate: string,
  endDate: string,
  entries: RevenuePDFEntry[],
  totalHours: number,
  totalRevenue: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = PageSizes.A4[0];
  const pageHeight = PageSizes.A4[1];
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;

  // Header
  page.drawText("Inkomsten Overzicht", {
    x: margin,
    y: yPosition,
    size: 20,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });

  yPosition -= 30;

  // Period info
  page.drawText(`Periode: ${periodLabel}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  yPosition -= 20;

  const dateStart = format(new Date(startDate), "d MMMM yyyy", { locale: nl });
  const dateEnd = format(new Date(endDate), "d MMMM yyyy", { locale: nl });
  page.drawText(`${dateStart} - ${dateEnd}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  yPosition -= 40;

  // Table header
  const tableStartY = yPosition;
  const rowHeight = 20;
  const colWidths = [200, 100, 120];

  // Draw table header
  page.drawRectangle({
    x: margin,
    y: yPosition - rowHeight,
    width: contentWidth,
    height: rowHeight,
    color: rgb(0.9, 0.9, 0.9),
  });

  page.drawText("Klant", {
    x: margin + 5,
    y: yPosition - 15,
    size: 10,
    font: helveticaBoldFont,
  });

  page.drawText("Uren", {
    x: margin + colWidths[0] + 5,
    y: yPosition - 15,
    size: 10,
    font: helveticaBoldFont,
  });

  page.drawText("Inkomsten (ex BTW)", {
    x: margin + colWidths[0] + colWidths[1] + 5,
    y: yPosition - 15,
    size: 10,
    font: helveticaBoldFont,
  });

  yPosition -= rowHeight;

  // Draw entries
  for (const entry of entries) {
    if (yPosition < margin + 60) {
      // New page
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
    }

    // Format hours
    const wholeHours = Math.floor(entry.totalHours);
    const minutes = Math.round((entry.totalHours - wholeHours) * 60);
    const hoursText = minutes === 0 
      ? `${wholeHours}u` 
      : wholeHours === 0 
        ? `${minutes}min`
        : `${wholeHours}u ${minutes}min`;

    // Format revenue
    const revenueText = entry.totalRevenue > 0
      ? `€${entry.totalRevenue.toFixed(2).replace(".", ",")}`
      : "-";

    page.drawText(entry.clientName, {
      x: margin + 5,
      y: yPosition - 12,
      size: 9,
      font: helveticaFont,
    });

    page.drawText(hoursText, {
      x: margin + colWidths[0] + 5,
      y: yPosition - 12,
      size: 9,
      font: helveticaFont,
    });

    page.drawText(revenueText, {
      x: margin + colWidths[0] + colWidths[1] + 5,
      y: yPosition - 12,
      size: 9,
      font: entry.totalRevenue > 0 ? helveticaBoldFont : helveticaFont,
    });

    yPosition -= rowHeight;
  }

  // Draw total line
  yPosition -= 10;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: margin + contentWidth, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  yPosition -= rowHeight;

  const totalHoursText = (() => {
    const wholeHours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - wholeHours) * 60);
    return minutes === 0 
      ? `${wholeHours}u` 
      : wholeHours === 0 
        ? `${minutes}min`
        : `${wholeHours}u ${minutes}min`;
  })();

  page.drawText("TOTAAL", {
    x: margin + 5,
    y: yPosition - 12,
    size: 10,
    font: helveticaBoldFont,
  });

  page.drawText(totalHoursText, {
    x: margin + colWidths[0] + 5,
    y: yPosition - 12,
    size: 10,
    font: helveticaBoldFont,
  });

  page.drawText(`€${totalRevenue.toFixed(2).replace(".", ",")}`, {
    x: margin + colWidths[0] + colWidths[1] + 5,
    y: yPosition - 12,
    size: 10,
    font: helveticaBoldFont,
    color: rgb(0.2, 0.4, 0.8),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

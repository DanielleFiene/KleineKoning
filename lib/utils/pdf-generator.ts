// lib/utils/pdf-generator.ts
// PDF generator using pdf-lib (Edge Runtime compatible)

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';

interface StatementEntry {
  date: string;
  project_name: string;
  description: string;
  duration_minutes: number;
}

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const months = [
      "januari",
      "februari",
      "maart",
      "april",
      "mei",
      "juni",
      "juli",
      "augustus",
      "september",
      "oktober",
      "november",
      "december",
    ];
    return `${day} ${months[month - 1]} ${year}`;
  } catch {
    return dateStr;
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}u ${mins}min` : `${hours}u`;
}

export async function generateStatementPDF(
  clientName: string,
  statementNumber: string,
  periodStart: string,
  periodEnd: string,
  entries: StatementEntry[],
  totalMinutes: number
): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Page setup (A4: 595.28 x 841.89 points)
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  
  // Create first page
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;
  
  // Header
  yPosition = drawHeader(
    page,
    helveticaBoldFont,
    helveticaFont,
    clientName,
    statementNumber,
    periodStart,
    periodEnd,
    yPosition,
    margin,
    contentWidth
  );
  
  // Group entries by date
  const entriesByDate = entries.reduce((acc: Record<string, StatementEntry[]>, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {});
  
  // Draw entries table
  const tableStartY = yPosition - 20;
  yPosition = drawEntriesTable(
    page,
    helveticaFont,
    helveticaBoldFont,
    entriesByDate,
    tableStartY,
    margin,
    contentWidth,
    pageHeight
  );
  
  // If content doesn't fit, create new pages
  const dates = Object.keys(entriesByDate).sort();
  let currentPage = page;
  let currentY = yPosition;
  
  for (const date of dates) {
    const dayEntries = entriesByDate[date];
    const dayTotal = dayEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
    
    // Check if we need a new page
    const estimatedHeight = 40 + (dayEntries.length * 20) + 30; // Date header + entries + day total
    if (currentY - estimatedHeight < margin + 50) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
    }
    
    // Draw date header
    currentY = drawDateHeader(
      currentPage,
      helveticaBoldFont,
      date,
      currentY,
      margin,
      contentWidth
    );
    
    // Draw entries for this date
    for (const entry of dayEntries) {
      if (currentY - 20 < margin + 30) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
      
      currentY = drawEntryRow(
        currentPage,
        helveticaFont,
        entry,
        currentY,
        margin,
        contentWidth
      );
    }
    
    // Draw day total
    if (currentY - 25 < margin + 30) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
    }
    
    currentY = drawDayTotal(
      currentPage,
      helveticaBoldFont,
      dayTotal,
      currentY,
      margin,
      contentWidth
    );
    
    currentY -= 10; // Spacing between days
  }
  
  // Draw total on last page
  if (currentY - 40 < margin + 30) {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    currentY = pageHeight - margin;
  }
  
  drawTotal(
    currentPage,
    helveticaBoldFont,
    totalMinutes,
    currentY,
    margin,
    contentWidth
  );
  
  // Serialize the PDF
  const pdfBytes = await pdfDoc.save();
  return new Uint8Array(pdfBytes);
}

function drawHeader(
  page: PDFPage,
  boldFont: PDFFont,
  font: PDFFont,
  clientName: string,
  statementNumber: string,
  periodStart: string,
  periodEnd: string,
  yPosition: number,
  margin: number,
  width: number
): number {
  const fontSize = 24;
  const lineHeight = 30;
  let y = yPosition;
  
  // Title
  page.drawText('Urenstaat', {
    x: margin,
    y: y,
    size: fontSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= lineHeight;
  
  // Client
  page.drawText('Klant:', {
    x: margin,
    y: y,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  page.drawText(clientName, {
    x: margin + 80,
    y: y,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });
  y -= 18;
  
  // Statement number
  page.drawText('Statementnummer:', {
    x: margin,
    y: y,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  page.drawText(statementNumber, {
    x: margin + 120,
    y: y,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });
  y -= 18;
  
  // Period
  page.drawText('Periode:', {
    x: margin,
    y: y,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  page.drawText(`${formatDate(periodStart)} - ${formatDate(periodEnd)}`, {
    x: margin + 80,
    y: y,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });
  y -= 18;
  
  // Generated date
  const today = new Date().toLocaleDateString('nl-NL');
  page.drawText('Opgesteld op:', {
    x: margin,
    y: y,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  page.drawText(today, {
    x: margin + 100,
    y: y,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });
  y -= 30;
  
  return y;
}

function drawEntriesTable(
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  entriesByDate: Record<string, StatementEntry[]>,
  yPosition: number,
  margin: number,
  width: number,
  pageHeight: number
): number {
  // Draw table header
  const headerY = yPosition;
  const headerHeight = 25;
  
  // Background for header
  page.drawRectangle({
    x: margin,
    y: headerY - headerHeight,
    width: width,
    height: headerHeight,
    color: rgb(0.96, 0.96, 0.96),
  });
  
  // Header text
  page.drawText('Project', {
    x: margin + 5,
    y: headerY - 18,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Omschrijving', {
    x: margin + 120,
    y: headerY - 18,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Duur', {
    x: margin + width - 60,
    y: headerY - 18,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Underline
  page.drawLine({
    start: { x: margin, y: headerY - headerHeight },
    end: { x: margin + width, y: headerY - headerHeight },
    thickness: 2,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  return headerY - headerHeight - 10;
}

function drawDateHeader(
  page: PDFPage,
  boldFont: PDFFont,
  date: string,
  yPosition: number,
  margin: number,
  width: number
): number {
  const headerHeight = 20;
  
  // Background
  page.drawRectangle({
    x: margin,
    y: yPosition - headerHeight,
    width: width,
    height: headerHeight,
    color: rgb(0.91, 0.91, 0.91),
  });
  
  // Date text
  page.drawText(formatDate(date), {
    x: margin + 5,
    y: yPosition - 15,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  return yPosition - headerHeight - 5;
}

function drawEntryRow(
  page: PDFPage,
  font: PDFFont,
  entry: StatementEntry,
  yPosition: number,
  margin: number,
  width: number
): number {
  const rowHeight = 18;
  
  // Project name
  const projectName = entry.project_name || '-';
  page.drawText(projectName, {
    x: margin + 5,
    y: yPosition - 13,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
    maxWidth: 100,
  });
  
  // Description
  const description = entry.description;
  page.drawText(description, {
    x: margin + 120,
    y: yPosition - 13,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
    maxWidth: width - 180,
  });
  
  // Duration (right aligned)
  const durationText = formatDuration(entry.duration_minutes);
  const durationWidth = font.widthOfTextAtSize(durationText, 9);
  page.drawText(durationText, {
    x: margin + width - durationWidth - 5,
    y: yPosition - 13,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  // Bottom border
  page.drawLine({
    start: { x: margin, y: yPosition - rowHeight },
    end: { x: margin + width, y: yPosition - rowHeight },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  
  return yPosition - rowHeight;
}

function drawDayTotal(
  page: PDFPage,
  boldFont: PDFFont,
  totalMinutes: number,
  yPosition: number,
  margin: number,
  width: number
): number {
  const rowHeight = 20;
  
  // Background
  page.drawRectangle({
    x: margin,
    y: yPosition - rowHeight,
    width: width,
    height: rowHeight,
    color: rgb(0.98, 0.98, 0.98),
  });
  
  // "Dagtotaal" text
  page.drawText('Dagtotaal', {
    x: margin + 5,
    y: yPosition - 15,
    size: 9,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Total duration (right aligned)
  const durationText = formatDuration(totalMinutes);
  const durationWidth = boldFont.widthOfTextAtSize(durationText, 9);
  page.drawText(durationText, {
    x: margin + width - durationWidth - 5,
    y: yPosition - 15,
    size: 9,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  return yPosition - rowHeight - 5;
}

function drawTotal(
  page: PDFPage,
  boldFont: PDFFont,
  totalMinutes: number,
  yPosition: number,
  margin: number,
  width: number
): void {
  const totalHeight = 30;
  const y = yPosition - totalHeight;
  
  // Top border
  page.drawLine({
    start: { x: margin, y: y + totalHeight },
    end: { x: margin + width, y: y + totalHeight },
    thickness: 2,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  // "Totaal" text
  page.drawText('Totaal:', {
    x: margin + width - 150,
    y: y + 10,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Total duration
  const durationText = formatDuration(totalMinutes);
  const durationWidth = boldFont.widthOfTextAtSize(durationText, 14);
  page.drawText(durationText, {
    x: margin + width - durationWidth - 5,
    y: y + 10,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
}


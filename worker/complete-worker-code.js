// BELANGRIJK: Voeg eerst pdf-lib toe via Settings → Dependencies → Add dependency → pdf-lib versie 1.17.1

import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';

// Helper functions
function formatDate(dateStr) {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const months = [
      "januari", "februari", "maart", "april", "mei", "juni",
      "juli", "augustus", "september", "oktober", "november", "december",
    ];
    return `${day} ${months[month - 1]} ${year}`;
  } catch {
    return dateStr;
  }
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}u ${mins}min` : `${hours}u`;
}

// Statement PDF functions
async function generateStatementPDF(clientName, statementNumber, periodStart, periodEnd, entries, totalMinutes) {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;
  
  // Header
  page.drawText('Urenstaat', { x: margin, y: yPosition, size: 24, font: helveticaBoldFont, color: rgb(0, 0, 0) });
  yPosition -= 30;
  
  page.drawText('Klant:', { x: margin, y: yPosition, size: 11, font: helveticaBoldFont, color: rgb(0, 0, 0) });
  page.drawText(clientName, { x: margin + 80, y: yPosition, size: 11, font: helveticaFont, color: rgb(0, 0, 0) });
  yPosition -= 18;
  
  page.drawText('Statementnummer:', { x: margin, y: yPosition, size: 11, font: helveticaBoldFont, color: rgb(0, 0, 0) });
  page.drawText(statementNumber, { x: margin + 120, y: yPosition, size: 11, font: helveticaFont, color: rgb(0, 0, 0) });
  yPosition -= 18;
  
  page.drawText('Periode:', { x: margin, y: yPosition, size: 11, font: helveticaBoldFont, color: rgb(0, 0, 0) });
  page.drawText(`${formatDate(periodStart)} - ${formatDate(periodEnd)}`, { x: margin + 80, y: yPosition, size: 11, font: helveticaFont, color: rgb(0, 0, 0) });
  yPosition -= 18;
  
  const today = new Date().toLocaleDateString('nl-NL');
  page.drawText('Opgesteld op:', { x: margin, y: yPosition, size: 11, font: helveticaBoldFont, color: rgb(0, 0, 0) });
  page.drawText(today, { x: margin + 100, y: yPosition, size: 11, font: helveticaFont, color: rgb(0, 0, 0) });
  yPosition -= 30;
  
  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});
  
  // Table header
  const headerHeight = 25;
  page.drawRectangle({ x: margin, y: yPosition - headerHeight, width: contentWidth, height: headerHeight, color: rgb(0.96, 0.96, 0.96) });
  page.drawText('Project', { x: margin + 5, y: yPosition - 18, size: 10, font: helveticaBoldFont, color: rgb(0, 0, 0) });
  page.drawText('Omschrijving', { x: margin + 120, y: yPosition - 18, size: 10, font: helveticaBoldFont, color: rgb(0, 0, 0) });
  page.drawText('Duur', { x: margin + contentWidth - 60, y: yPosition - 18, size: 10, font: helveticaBoldFont, color: rgb(0, 0, 0) });
  page.drawLine({ start: { x: margin, y: yPosition - headerHeight }, end: { x: margin + contentWidth, y: yPosition - headerHeight }, thickness: 2, color: rgb(0.2, 0.2, 0.2) });
  yPosition -= headerHeight + 10;
  
  // Draw entries
  const dates = Object.keys(entriesByDate).sort();
  let currentPage = page;
  let currentY = yPosition;
  
  for (const date of dates) {
    const dayEntries = entriesByDate[date];
    const dayTotal = dayEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
    
    if (currentY - 70 < margin + 50) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
    }
    
    // Date header
    const dateHeaderHeight = 20;
    currentPage.drawRectangle({ x: margin, y: currentY - dateHeaderHeight, width: contentWidth, height: dateHeaderHeight, color: rgb(0.91, 0.91, 0.91) });
    currentPage.drawText(formatDate(date), { x: margin + 5, y: currentY - 15, size: 10, font: helveticaBoldFont, color: rgb(0, 0, 0) });
    currentY -= dateHeaderHeight + 5;
    
    // Entries
    for (const entry of dayEntries) {
      if (currentY - 20 < margin + 30) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
      
      const rowHeight = 18;
      const projectName = entry.project_name || '-';
      currentPage.drawText(projectName, { x: margin + 5, y: currentY - 13, size: 9, font: helveticaFont, color: rgb(0, 0, 0), maxWidth: 100 });
      currentPage.drawText(entry.description, { x: margin + 120, y: currentY - 13, size: 9, font: helveticaFont, color: rgb(0, 0, 0), maxWidth: contentWidth - 180 });
      const durationText = formatDuration(entry.duration_minutes);
      const durationWidth = helveticaFont.widthOfTextAtSize(durationText, 9);
      currentPage.drawText(durationText, { x: margin + contentWidth - durationWidth - 5, y: currentY - 13, size: 9, font: helveticaFont, color: rgb(0, 0, 0) });
      currentPage.drawLine({ start: { x: margin, y: currentY - rowHeight }, end: { x: margin + contentWidth, y: currentY - rowHeight }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
      currentY -= rowHeight;
    }
    
    // Day total
    if (currentY - 25 < margin + 30) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
    }
    
    const dayTotalHeight = 20;
    currentPage.drawRectangle({ x: margin, y: currentY - dayTotalHeight, width: contentWidth, height: dayTotalHeight, color: rgb(0.98, 0.98, 0.98) });
    currentPage.drawText('Dagtotaal', { x: margin + 5, y: currentY - 15, size: 9, font: helveticaBoldFont, color: rgb(0, 0, 0) });
    const dayDurationText = formatDuration(dayTotal);
    const dayDurationWidth = helveticaBoldFont.widthOfTextAtSize(dayDurationText, 9);
    currentPage.drawText(dayDurationText, { x: margin + contentWidth - dayDurationWidth - 5, y: currentY - 15, size: 9, font: helveticaBoldFont, color: rgb(0, 0, 0) });
    currentY -= dayTotalHeight + 15;
  }
  
  // Total
  if (currentY - 40 < margin + 30) {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    currentY = pageHeight - margin;
  }
  
  const totalHeight = 30;
  const totalY = currentY - totalHeight;
  currentPage.drawLine({ start: { x: margin, y: totalY + totalHeight }, end: { x: margin + contentWidth, y: totalY + totalHeight }, thickness: 2, color: rgb(0.2, 0.2, 0.2) });
  currentPage.drawText('Totaal:', { x: margin + contentWidth - 150, y: totalY + 10, size: 14, font: helveticaBoldFont, color: rgb(0, 0, 0) });
  const totalDurationText = formatDuration(totalMinutes);
  const totalDurationWidth = helveticaBoldFont.widthOfTextAtSize(totalDurationText, 14);
  currentPage.drawText(totalDurationText, { x: margin + contentWidth - totalDurationWidth - 5, y: totalY + 10, size: 14, font: helveticaBoldFont, color: rgb(0, 0, 0) });
  
  const pdfBytes = await pdfDoc.save();
  return new Uint8Array(pdfBytes);
}

// Revenue PDF function
async function generateRevenuePDF(periodType, periodLabel, startDate, endDate, entries, totalHours, totalRevenue) {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const pageWidth = PageSizes.A4[0];
  const pageHeight = PageSizes.A4[1];
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;
  
  page.drawText("Inkomsten Overzicht", { x: margin, y: yPosition, size: 20, font: helveticaBoldFont, color: rgb(0, 0, 0) });
  yPosition -= 30;
  
  page.drawText(`Periode: ${periodLabel}`, { x: margin, y: yPosition, size: 12, font: helveticaFont, color: rgb(0.3, 0.3, 0.3) });
  yPosition -= 20;
  
  page.drawText(`${formatDate(startDate)} - ${formatDate(endDate)}`, { x: margin, y: yPosition, size: 10, font: helveticaFont, color: rgb(0.5, 0.5, 0.5) });
  yPosition -= 40;
  
  const rowHeight = 20;
  const colWidths = [200, 100, 120];
  
  page.drawRectangle({ x: margin, y: yPosition - rowHeight, width: contentWidth, height: rowHeight, color: rgb(0.9, 0.9, 0.9) });
  page.drawText("Klant", { x: margin + 5, y: yPosition - 15, size: 10, font: helveticaBoldFont });
  page.drawText("Uren", { x: margin + colWidths[0] + 5, y: yPosition - 15, size: 10, font: helveticaBoldFont });
  page.drawText("Inkomsten (ex BTW)", { x: margin + colWidths[0] + colWidths[1] + 5, y: yPosition - 15, size: 10, font: helveticaBoldFont });
  yPosition -= rowHeight;
  
  for (const entry of entries) {
    if (yPosition < margin + 60) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
    }
    
    const wholeHours = Math.floor(entry.totalHours);
    const minutes = Math.round((entry.totalHours - wholeHours) * 60);
    const hoursText = minutes === 0 ? `${wholeHours}u` : wholeHours === 0 ? `${minutes}min` : `${wholeHours}u ${minutes}min`;
    const revenueText = entry.totalRevenue > 0 ? `€${entry.totalRevenue.toFixed(2).replace(".", ",")}` : "-";
    
    page.drawText(entry.clientName, { x: margin + 5, y: yPosition - 12, size: 9, font: helveticaFont });
    page.drawText(hoursText, { x: margin + colWidths[0] + 5, y: yPosition - 12, size: 9, font: helveticaFont });
    page.drawText(revenueText, { x: margin + colWidths[0] + colWidths[1] + 5, y: yPosition - 12, size: 9, font: entry.totalRevenue > 0 ? helveticaBoldFont : helveticaFont });
    yPosition -= rowHeight;
  }
  
  yPosition -= 10;
  page.drawLine({ start: { x: margin, y: yPosition }, end: { x: margin + contentWidth, y: yPosition }, thickness: 1, color: rgb(0, 0, 0) });
  yPosition -= rowHeight;
  
  const wholeHours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - wholeHours) * 60);
  const totalHoursText = minutes === 0 ? `${wholeHours}u` : wholeHours === 0 ? `${minutes}min` : `${wholeHours}u ${minutes}min`;
  
  page.drawText("TOTAAL", { x: margin + 5, y: yPosition - 12, size: 10, font: helveticaBoldFont });
  page.drawText(totalHoursText, { x: margin + colWidths[0] + 5, y: yPosition - 12, size: 10, font: helveticaBoldFont });
  page.drawText(`€${totalRevenue.toFixed(2).replace(".", ",")}`, { x: margin + colWidths[0] + colWidths[1] + 5, y: yPosition - 12, size: 10, font: helveticaBoldFont, color: rgb(0.2, 0.4, 0.8) });
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// Main handler
export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/statement' && request.method === 'POST') {
        const body = await request.json();
        const pdfBytes = await generateStatementPDF(
          body.clientName,
          body.statementNumber,
          body.periodStart,
          body.periodEnd,
          body.entries,
          body.totalMinutes
        );
        
        return new Response(pdfBytes, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="urenstaat_${body.clientName}_${body.periodStart}_${body.periodEnd}.pdf"`,
          },
        });
      }

      if (path === '/revenue' && request.method === 'POST') {
        const body = await request.json();
        const pdfBytes = await generateRevenuePDF(
          body.periodType,
          body.periodLabel,
          body.startDate,
          body.endDate,
          body.entries,
          body.totalHours,
          body.totalRevenue
        );
        
        return new Response(pdfBytes, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="inkomsten_${body.startDate}_${body.endDate}.pdf"`,
          },
        });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('PDF generation error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  },
};

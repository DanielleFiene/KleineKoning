/**
 * Cloudflare Worker voor PDF generatie
 * 
 * Dit worker verwijdert pdf-lib uit de Next.js bundle en reduceert de bundle size aanzienlijk.
 * Ondersteunt twee endpoints:
 * - POST /statement - Genereert urenstaat PDFs
 * - POST /revenue - Genereert inkomsten overzicht PDFs
 */

import { generateStatementPDF } from './statement-pdf';
import { generateRevenuePDF } from './revenue-pdf';

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
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
        JSON.stringify({ error: (error as Error).message }),
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

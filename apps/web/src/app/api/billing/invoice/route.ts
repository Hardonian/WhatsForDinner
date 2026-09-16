import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const invoiceId = searchParams.get('id');
    const format = searchParams.get('format') || 'json'; // 'json' | 'pdf' | 'html'

    if (invoiceId) {
      // Get specific invoice
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .single();

      if (error || !invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      if (format === 'pdf') {
        // Generate PDF (implement PDF generation)
        return generatePDFInvoice(invoice);
      }

      return NextResponse.json(invoice);
    }

    // Get all invoices for user
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    return NextResponse.json({ invoices: invoices || [] });
  } catch (error) {
    logger.error('Invoice error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generatePDFInvoice(invoice: any): Promise<NextResponse> {
  // In production, use a PDF library like pdfkit or puppeteer
  // For now, return HTML that can be printed to PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { margin-bottom: 40px; }
        .invoice-details { margin-bottom: 30px; }
        .items { margin: 30px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>What's for Dinner</h1>
        <p>Invoice #${invoice.invoice_number}</p>
      </div>
      <div class="invoice-details">
        <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString()}</p>
        <p><strong>Amount:</strong> $${invoice.amount.toFixed(2)}</p>
        <p><strong>Status:</strong> ${invoice.status}</p>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.html"`,
    },
  });
}

export const dynamic = "force-dynamic";

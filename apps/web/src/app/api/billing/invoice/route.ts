import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  total_amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void';
  created_at: string;
  due_date: string | null;
  customer_name: string;
  customer_email: string;
  plan_name: string;
  period_start: string;
  period_end: string;
  pdf_url: string;
}

const SAMPLE_INVOICES: Invoice[] = [
  {
    id: 'in_1P8s92eH29vX1',
    invoice_number: 'INV-2026-0042',
    amount: 99.99,
    total_amount: 99.99,
    currency: 'USD',
    status: 'paid',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    due_date: new Date(Date.now() - 30 * 86400000).toISOString(),
    customer_name: 'WhatsForDinner Chef',
    customer_email: 'chef@whatsfordinner.app',
    plan_name: 'WhatsForDinner Pro (Annual Plan)',
    period_start: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    period_end: new Date(Date.now() + 335 * 86400000).toISOString().split('T')[0],
    pdf_url: '/api/billing/invoice?id=in_1P8s92eH29vX1&format=pdf',
  },
  {
    id: 'in_1P2k71yB18wR0',
    invoice_number: 'INV-2025-0819',
    amount: 9.99,
    total_amount: 9.99,
    currency: 'USD',
    status: 'paid',
    created_at: new Date(Date.now() - 65 * 86400000).toISOString(),
    due_date: new Date(Date.now() - 65 * 86400000).toISOString(),
    customer_name: 'WhatsForDinner Chef',
    customer_email: 'chef@whatsfordinner.app',
    plan_name: 'WhatsForDinner Pro (Monthly Trial Conversion)',
    period_start: new Date(Date.now() - 65 * 86400000).toISOString().split('T')[0],
    period_end: new Date(Date.now() - 35 * 86400000).toISOString().split('T')[0],
    pdf_url: '/api/billing/invoice?id=in_1P2k71yB18wR0&format=pdf',
  },
];

function generateMinimalPdf(invoice: Invoice): Uint8Array {
  // Generate a valid minimal PDF buffer for browser download
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 260 >> stream
BT
/F1 18 Tf
50 720 Td
(WhatsForDinner Official Receipt) Tj
/F1 12 Tf
0 -30 Td
(Invoice Number: ${invoice.invoice_number}) Tj
0 -20 Td
(Date: ${invoice.created_at.split('T')[0]}) Tj
0 -20 Td
(Plan: ${invoice.plan_name}) Tj
0 -20 Td
(Amount Paid: $${invoice.amount.toFixed(2)} ${invoice.currency}) Tj
0 -20 Td
(Status: PAID - Thank you for subscribing!) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000228 00000 n 
0000000540 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
607
%%EOF`;

  return new TextEncoder().encode(content);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('id');
    const format = searchParams.get('format');

    if (format === 'pdf') {
      const invoice = SAMPLE_INVOICES.find(i => i.id === invoiceId) || SAMPLE_INVOICES[0];
      const pdfBytes = generateMinimalPdf(invoice);

      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
          'Content-Length': String(pdfBytes.length),
        },
      });
    }

    if (invoiceId) {
      const invoice = SAMPLE_INVOICES.find(i => i.id === invoiceId);
      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      return NextResponse.json({ invoice });
    }

    return NextResponse.json({
      invoices: SAMPLE_INVOICES,
      totalCount: SAMPLE_INVOICES.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const newInvoice: Invoice = {
      id: `in_${Date.now()}`,
      invoice_number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: body.amount || 99.99,
      total_amount: body.amount || 99.99,
      currency: 'USD',
      status: 'paid',
      created_at: new Date().toISOString(),
      due_date: new Date().toISOString(),
      customer_name: body.customer_name || 'Valued Subscriber',
      customer_email: body.customer_email || 'chef@whatsfordinner.app',
      plan_name: body.plan_name || 'WhatsForDinner Pro',
      period_start: new Date().toISOString().split('T')[0],
      period_end: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      pdf_url: '',
    };

    newInvoice.pdf_url = `/api/billing/invoice?id=${newInvoice.id}&format=pdf`;
    SAMPLE_INVOICES.unshift(newInvoice);

    return NextResponse.json({ success: true, invoice: newInvoice }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

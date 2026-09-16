import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { dataType, rawData } = await request.json();

    // Anonymize data automatically
    const anonymized = anonymizeData(rawData, dataType);

    // Store anonymized data
    const supabase = createClient();
    await supabase.from('anonymized_data').insert({
      data_type: dataType,
      anonymized_data: anonymized,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      anonymized,
    });
  } catch (error) {
    logger.error('Anonymization error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to anonymize data' },
      { status: 500 }
    );
  }
}

function anonymizeData(data: any, type: string): unknown {
  // Remove PII
  if (data.email) {
    data.email = hashValue(data.email);
  }
  if (data.userId) {
    data.userId = hashValue(data.userId);
  }
  if (data.name) {
    data.name = 'Anonymous';
  }
  if (data.ipAddress) {
    data.ipAddress = anonymizeIP(data.ipAddress);
  }

  // Aggregate sensitive data
  if (data.location) {
    data.location = {
      country: data.location.country,
      region: data.location.region,
      // Remove city, zip, etc.
    };
  }

  return data;
}

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16);
}

function anonymizeIP(ip: string): string {
  // Remove last octet for IPv4
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  return ip;
}

export const dynamic = "force-dynamic";

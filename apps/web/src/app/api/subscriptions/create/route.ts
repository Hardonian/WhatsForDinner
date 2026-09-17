import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json({ status: 'ok', stub: true }); }
export async function POST() { return NextResponse.json({ status: 'ok', stub: true }); }
export async function PUT() { return NextResponse.json({ status: 'ok', stub: true }); }
export async function DELETE() { return NextResponse.json({ status: 'ok', stub: true }); }

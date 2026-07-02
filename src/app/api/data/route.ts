import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS estado (id TEXT PRIMARY KEY, dados JSONB NOT NULL, atualizado_em TIMESTAMP DEFAULT NOW())`;
    const rows = await sql`SELECT dados FROM estado WHERE id = 'principal'`;
    if (rows.length === 0) return NextResponse.json(null);
    return NextResponse.json(rows[0].dados);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const dados = await req.json();
    await sql`CREATE TABLE IF NOT EXISTS estado (id TEXT PRIMARY KEY, dados JSONB NOT NULL, atualizado_em TIMESTAMP DEFAULT NOW())`;
    await sql`INSERT INTO estado (id, dados, atualizado_em) VALUES ('principal', ${JSON.stringify(dados)}, NOW()) ON CONFLICT (id) DO UPDATE SET dados = ${JSON.stringify(dados)}, atualizado_em = NOW()`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

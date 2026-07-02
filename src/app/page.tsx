import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';

export default async function Home() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS estado (id TEXT PRIMARY KEY, dados JSONB NOT NULL, atualizado_em TIMESTAMP DEFAULT NOW())`;
  } catch(e) {}
  redirect('/sistema.html');
}

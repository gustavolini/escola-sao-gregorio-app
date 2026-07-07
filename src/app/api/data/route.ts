import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// ==========================================================================
// LOGIN MULTI-EMPRESA
// Cada empresa entra com USUÁRIO + SENHA e enxerga só os seus dados.
//
// Configure no Vercel a variável de ambiente APP_CONTAS com um JSON assim
// (tudo em UMA linha):
//
//   {"escolasaogregorio":{"senha":"SaoGregorio@2026","row":"principal"},"gugajuuniformes":{"senha":"Gugaju@2026"}}
//
// - a CHAVE (ex: "escolasaogregorio") é o usuário digitado, em minúsculas e
//   sem espaços nem acentos. O sistema normaliza o que o usuário digita da
//   mesma forma, então "Escola São Gregório" ou "escolasaogregorio" caem na
//   mesma chave.
// - "senha" é a senha daquela empresa.
// - "row" (opcional) é o nome da linha no banco onde os dados ficam guardados.
//   Se omitido, usa a própria chave. A Escola São Gregório aponta para a linha
//   "principal" para MANTER os dados que já existem hoje.
//
// Para adicionar uma nova empresa: acrescente outra chave no JSON e faça o
// Redeploy no Vercel. Nada de banco é apagado — cada empresa nova começa vazia.
//
// Enquanto APP_CONTAS NÃO existir, o sistema cai no modo antigo (uma senha só,
// via APP_SENHA, na linha "principal"), para não travar nada antes de você
// configurar.
// ==========================================================================

type Conta = { senha: string; row?: string };

function contas(): Record<string, Conta> | null {
  const raw = process.env.APP_CONTAS;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, Conta>;
  } catch {
    return null; // JSON inválido → cai no modo antigo
  }
}

function norm(s: string | null): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Resolve a requisição para o nome da linha do banco (ou null se sem acesso).
function resolveRow(req: NextRequest): string | null {
  const cfg = contas();
  if (cfg) {
    const chave = norm(req.headers.get('x-conta'));
    const conta = cfg[chave];
    if (!conta) return null;
    if (req.headers.get('x-senha') !== conta.senha) return null;
    return conta.row || chave;
  }
  // modo antigo: uma senha só (APP_SENHA), linha fixa "principal"
  const esperada = process.env.APP_SENHA;
  if (esperada && req.headers.get('x-senha') !== esperada) return null;
  return 'principal';
}

const semAcesso = () =>
  NextResponse.json({ error: 'sem acesso' }, { status: 401 });

export async function GET(req: NextRequest) {
  const row = resolveRow(req);
  if (!row) return semAcesso();
  try {
    await sql`CREATE TABLE IF NOT EXISTS estado (id TEXT PRIMARY KEY, dados JSONB NOT NULL, atualizado_em TIMESTAMP DEFAULT NOW())`;
    const rows = await sql`SELECT dados FROM estado WHERE id = ${row}`;
    if (rows.length === 0) return NextResponse.json(null);
    return NextResponse.json(rows[0].dados);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const row = resolveRow(req);
  if (!row) return semAcesso();
  try {
    const dados = await req.json();
    await sql`CREATE TABLE IF NOT EXISTS estado (id TEXT PRIMARY KEY, dados JSONB NOT NULL, atualizado_em TIMESTAMP DEFAULT NOW())`;
    await sql`INSERT INTO estado (id, dados, atualizado_em) VALUES (${row}, ${JSON.stringify(dados)}, NOW()) ON CONFLICT (id) DO UPDATE SET dados = ${JSON.stringify(dados)}, atualizado_em = NOW()`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

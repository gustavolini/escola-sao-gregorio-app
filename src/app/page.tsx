import { sql } from '@/lib/db';

export default async function Home() {
  await sql`CREATE TABLE IF NOT EXISTS estado (id TEXT PRIMARY KEY, dados JSONB NOT NULL, atualizado_em TIMESTAMP DEFAULT NOW())`;
  const rows = await sql`SELECT dados FROM estado WHERE id = 'principal'`;
  const estadoInicial = rows.length > 0 ? JSON.stringify(rows[0].dados) : 'null';

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Sistema Financeiro - Escola São Gregório</title>
      </head>
      <body>
        <div id="__ESTADO_INICIAL__" data-estado={estadoInicial} style={{display:'none'}}></div>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var el = document.getElementById('__ESTADO_INICIAL__');
            var estado = el ? el.getAttribute('data-estado') : null;
            if (estado && estado !== 'null') {
              try { localStorage.setItem('sg-financeiro-v2', JSON.stringify(JSON.parse(estado))); } catch(e) {}
            }
            var _origSetItem = localStorage.setItem.bind(localStorage);
            localStorage.setItem = function(key, value) {
              _origSetItem(key, value);
              if (key === 'sg-financeiro-v2') {
                try {
                  fetch('/api/data', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(JSON.parse(value)) });
                } catch(e) {}
              }
            };
          })();
        `}} />
        <script src="/sistema.js"></script>
      </body>
    </html>
  );
}

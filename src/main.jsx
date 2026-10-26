import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const generatedDir = path.join(rootDir, 'generated');
const distDir = path.join(rootDir, 'dist');

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(generatedDir, { recursive: true });

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });
const db = new sqlite3.Database(path.join(dataDir, 'codestay.db'));

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'progetto';

const ensureSchema = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      domain TEXT,
      status TEXT DEFAULT 'online',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
  });
};

const readGeneratedFiles = (projectId) => {
  const folder = path.join(generatedDir, String(projectId));
  if (!fs.existsSync(folder)) return {};

  const result = {};
  for (const file of fs.readdirSync(folder)) {
    const fullPath = path.join(folder, file);
    if (fs.statSync(fullPath).isFile()) {
      result[file] = fs.readFileSync(fullPath, 'utf8');
    }
  }
  return result;
};

const writeGeneratedFiles = (projectId, files) => {
  const folder = path.join(generatedDir, String(projectId));
  fs.mkdirSync(folder, { recursive: true });
  for (const [fileName, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(folder, fileName), String(content), 'utf8');
  }
};

const projectTemplates = (prompt, projectName) => {
  const text = (prompt || '').trim() || 'Crea un sito moderno';
  const lower = text.toLowerCase();
  const isBot = /(discord|telegram|bot|api|automazione)/.test(lower);
  const isStore = /(e-commerce|shop|commerce|negozio|store|market)/.test(lower);
  const isPortfolio = /(portfolio|cv|resume|brand|personal|profilo)/.test(lower);

  if (isBot) {
    return {
      'index.html': `<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div class="shell">
      <header class="bar">
        <div class="brand">${projectName}</div>
        <span class="status">ONLINE</span>
      </header>
      <main class="hero">
        <div class="panel big">
          <p class="eyebrow">BOT AI</p>
          <h1>Bot ${projectName}</h1>
          <p>${text}</p>
          <div class="cta">
            <button>Avvia bot</button>
            <button class="ghost">Configura secret</button>
          </div>
        </div>
        <div class="panel">
          <h3>Comandi</h3>
          <ul>
            <li>/start</li>
            <li>/help</li>
            <li>/stats</li>
            <li>/report</li>
          </ul>
        </div>
      </main>
    </div>
    <script src="script.js"></script>
  </body>
</html>`,
      'styles.css': `:root { --bg: #0b1020; --panel: rgba(15,23,42,.78); --primary: #7c3aed; --secondary: #06b6d4; --text: #e2e8f0; --muted: #a5b4cf; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Inter, Arial, sans-serif; background: radial-gradient(circle at top, #1f1b4b 0%, #0b1020 42%, #020617 100%); color: var(--text); }
.shell { max-width: 1150px; margin: 0 auto; padding: 24px; }
.bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 26px; }
.brand { font-size: 1.8rem; font-weight: 800; letter-spacing: .08em; background: linear-gradient(90deg, var(--secondary), var(--primary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.status { padding: 8px 12px; border: 1px solid rgba(6,182,212,.4); background: rgba(6,182,212,.1); color: #7dd3fc; border-radius: 999px; font-size: .74rem; font-weight: 800; }
.hero { display: grid; grid-template-columns: 1.3fr .7fr; gap: 24px; }
.panel { background: var(--panel); border: 1px solid rgba(148,163,184,.2); border-radius: 24px; padding: 26px; box-shadow: 0 0 24px rgba(124,58,237,.2); }
.eyebrow { text-transform: uppercase; letter-spacing: .18em; color: var(--secondary); font-size: .72rem; font-weight: 700; }
h1 { font-size: clamp(2.4rem, 5vw, 4rem); margin: 10px 0 18px; }
p { color: var(--muted); line-height: 1.7; }
.cta { display: flex; gap: 12px; margin-top: 22px; flex-wrap: wrap; }
button { border: none; background: linear-gradient(90deg, var(--primary), var(--secondary)); color: white; font-weight: 800; border-radius: 12px; padding: 12px 18px; cursor: pointer; }
button.ghost { background: transparent; border: 1px solid rgba(148,163,184,.26); }
ul { padding-left: 20px; color: #dbeafe; }
li + li { margin-top: 8px; }
@media (max-width: 768px) { .hero { grid-template-columns: 1fr; } .shell { padding: 18px; } }
`,
      'script.js': `document.querySelector('button')?.addEventListener('click', () => {
const btn = document.querySelector('button');
btn.textContent = 'Bot online';
btn.disabled = true;
setTimeout(() => { btn.disabled = false; btn.textContent = 'Avvia bot'; }, 1500);
});`
    };
  }

  if (isStore) {
    return {
      'index.html': `<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="nav">
      <div class="logo">${projectName}</div>
      <nav>
        <a href="#">Home</a>
        <a href="#">Shop</a>
        <a href="#">Sconti</a>
      </nav>
      <button>Carrello (3)</button>
    </header>
    <main class="shop">
      <section class="hero-layout">
        <div>
          <p class="eyebrow">NUOVO ARRIVO</p>
          <h1>Shop digitale premium</h1>
          <p>Template, bundle e prodotti creativi per creator e startup.</p>
          <div class="cta"><button>Esplora</button><button class="ghost">Offerte</button></div>
        </div>
        <div class="promo">
          <span>Best seller</span>
          <h3>Creator Bundle</h3>
          <strong>€89</strong>
        </div>
      </section>
      <section class="cards">
        <article class="item"><div class="thumb purple"></div><h4>Template SaaS</h4><p>Design premium</p></article>
        <article class="item"><div class="thumb cyan"></div><h4>Brand kit</h4><p>Asset pronti</p></article>
        <article class="item"><div class="thumb violet"></div><h4>E-commerce kit</h4><p>Vendido</p></article>
      </section>
    </main>
    <script src="script.js"></script>
  </body>
</html>`,
      'styles.css': `:root { --bg: #0b1020; --panel: rgba(17,24,39,.75); --primary: #7c3aed; --secondary: #06b6d4; --text: #e2e8f0; --muted: #a5b4cf; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Inter, Arial, sans-serif; background: linear-gradient(180deg, #111827, #020617); color: var(--text); }
.nav { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; }
.logo { font-size: 1.5rem; font-weight: 800; letter-spacing: .08em; }
nav { display: flex; gap: 18px; }
nav a { color: var(--muted); text-decoration: none; }
button { border: none; border-radius: 12px; padding: 12px 18px; color: white; font-weight: 800; background: linear-gradient(90deg, var(--primary), var(--secondary)); cursor: pointer; }
button.ghost { background: transparent; border: 1px solid rgba(148,163,184,.28); }
.shop { max-width: 1200px; margin: 0 auto; padding: 18px 24px 40px; }
.hero-layout { display: grid; gap: 24px; grid-template-columns: 1.4fr .8fr; background: rgba(17,24,39,.77); border:1px solid rgba(148,163,184,.18); padding: 30px; border-radius: 30px; }
.eyebrow { text-transform: uppercase; letter-spacing: .16em; font-size: .7rem; color: var(--secondary); font-weight: 700; }
h1 { font-size: clamp(2.6rem, 5vw, 4.8rem); margin: 10px 0 16px; }
p { color: var(--muted); line-height: 1.7; }
.cta { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
.promo { background: linear-gradient(135deg, rgba(124,58,237,.95), rgba(6,182,212,.8)); display:flex; flex-direction:column; justify-content:center; padding:24px; border-radius: 24px; }
.cards { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:20px; margin-top:30px; }
.item { background: rgba(17,24,39,.78); border:1px solid rgba(148,163,184,.18); border-radius: 22px; padding:18px; }
.thumb { height: 180px; border-radius: 18px; margin-bottom: 18px; }
.thumb.purple { background: linear-gradient(135deg, #7c3aed, #a78bfa); }
.thumb.cyan { background: linear-gradient(135deg, #06b6d4, #67e8f9); }
.thumb.violet { background: linear-gradient(135deg, #312e81, #8b5cf6); }
@media (max-width: 768px){ .nav, .hero-layout, .cards { grid-template-columns: 1fr; display:grid; } .nav { justify-items: start; } }
`,
      'script.js': `console.log('Shop ready');`
    };
  }

  if (isPortfolio) {
    return {
      'index.html': `<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="top">
      <nav>
        <div class="logo">${projectName}</div>
        <div class="menu"><a href="#">Work</a><a href="#">About</a><a href="#">Contact</a></div>
      </nav>
      <div class="hero">
        <div>
          <p class="eyebrow">Creative developer</p>
          <h1>Design, code & launch.</h1>
          <p>${text}</p>
          <button>Let’s talk</button>
        </div>
        <div class="card"><div class="orb"></div><span>Available for projects</span></div>
      </div>
    </header>
    <main class="grid">
      <article class="panel">Brand identity</article>
      <article class="panel">Product design</article>
      <article class="panel">Web experiences</article>
    </main>
    <script src="script.js"></script>
  </body>
</html>`,
      'styles.css': `:root { --bg: #020617; --panel: rgba(15,23,42,.75); --primary: #7c3aed; --secondary: #06b6d4; --text: #e2e8f0; --muted: #a5b4cf; }
body { margin: 0; font-family: Inter, Arial, sans-serif; background: radial-gradient(circle at top, #1d4ed8 0%, #0f172a 28%, #020617 100%); color: var(--text); }
.top { max-width: 1200px; margin: 0 auto; padding: 26px 24px 0; }
nav { display:flex; justify-content:space-between; align-items:center; }
.logo { font-weight: 800; letter-spacing: .08em; }
.menu { display:flex; gap:18px; }
.menu a { color: var(--muted); text-decoration: none; }
.hero { display: grid; grid-template-columns: 1.2fr .8fr; min-height: 60vh; align-items:center; gap: 24px; }
.eyebrow { color: var(--secondary); text-transform: uppercase; letter-spacing: .14em; font-size: .72rem; font-weight:700; }
h1 { font-size: clamp(3rem, 7vw, 6rem); margin: 12px 0; }
p { color: var(--muted); line-height: 1.7; }
button { border: none; border-radius: 12px; padding: 12px 22px; color:white; font-weight:800; background: linear-gradient(90deg, var(--primary), var(--secondary)); cursor:pointer; }
.card { min-height: 280px; border-radius: 24px; background: rgba(15,23,42,.8); border:1px solid rgba(148,163,184,.15); display:grid; place-items:center; }
.orb { width: 170px; height: 170px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #06b6d4); box-shadow: 0 0 30px rgba(124,58,237,.45); }
.grid { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:20px; padding: 0 24px 40px; }
.panel { min-height: 180px; background: rgba(15,23,42,.75); border:1px solid rgba(148,163,184,.15); border-radius:20px; padding:20px; display:flex; align-items:flex-end; font-weight:700; }
@media (max-width:768px){ .hero, .grid { grid-template-columns: 1fr; } nav { display:block; } .menu { margin-top: 12px; } }
`,
      'script.js': `console.log('Portfolio ready');`
    };
  }

  return {
    'index.html': `<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div class="shell">
      <header>
        <div class="brand">${projectName}</div>
        <nav><a href="#">Home</a><a href="#">Servizi</a><a href="#">Contatti</a></nav>
      </header>
      <main class="hero">
        <div>
          <p class="eyebrow">AI BUILDER</p>
          <h1>Progetto generato da CODESTAY</h1>
          <p>${text}</p>
          <button>Inizia ora</button>
        </div>
        <aside class="card"><h3>Risultato</h3><ul><li>Design moderno</li><li>Mobile-first</li><li>Performance alta</li></ul></aside>
      </main>
    </div>
    <script src="script.js"></script>
  </body>
</html>`,
    'styles.css': `:root { --bg: #0b1020; --panel: rgba(15,23,42,.75); --primary: #7c3aed; --secondary: #06b6d4; --text: #e2e8f0; --muted: #a5b4cf; }
* { box-sizing: border-box; }
body { margin: 0; min-height:100vh; display:flex; align-items:center; justify-content:center; font-family: Inter, Arial, sans-serif; background: radial-gradient(circle at top, #1f1b41 0%, #0b1020 42%, #020617 100%); color: var(--text); }
.shell { width: min(1180px, calc(100vw - 32px)); }
header { display:flex; justify-content:space-between; align-items:center; padding: 16px 0 18px; }
.brand { font-size:1.5rem; font-weight:800; letter-spacing:.08em; }
nav { display:flex; gap:18px; }
a { color: var(--muted); text-decoration:none; }
.hero { display:grid; grid-template-columns:1.2fr .8fr; gap:20px; align-items:center; }
.eyebrow { color: var(--secondary); text-transform: uppercase; letter-spacing: .16em; font-weight:700; font-size: .72rem; }
h1 { font-size: clamp(2.8rem, 6vw, 5rem); margin: 14px 0; }
p { color: var(--muted); line-height: 1.8; }
button { border:none; border-radius:12px; padding:12px 18px; background: linear-gradient(90deg, var(--primary), var(--secondary)); color:white; font-weight:800; cursor:pointer; }
.card { background: rgba(15,23,42,.8); border:1px solid rgba(148,163,184,.16); border-radius:22px; padding:22px; box-shadow: 0 0 24px rgba(124,58,237,.2); }
ul { padding-left:22px; color:#dbeafe; }
li + li { margin-top:10px; }
@media (max-width:768px){ .hero { grid-template-columns:1fr; } header { display:block; } nav { margin-top:12px; } }
`,
    'script.js': `console.log('Project ready');`
  };
};

ensureSchema();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/generated', express.static(generatedDir));

app.get('/api/health', (_, res) => res.json({ ok: true, app: 'CODESTAY', status: 'online' }));

app.post('/api/auth/register', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!username || !password) {
    return res.status(400).json({ message: 'Username e password richiesti.' });
  }

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ message: 'Errore database.', error: err.message });
    if (row) return res.status(409).json({ message: 'Username già usato.' });

    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function (err2) {
      if (err2) return res.status(500).json({ message: 'Errore registrazione.', error: err2.message });
      return res.status(201).json({ user: { id: this.lastID, username } });
    });
  });
});

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!username || !password) {
    return res.status(400).json({ message: 'Username e password richiesti.' });
  }

  db.get('SELECT id, username FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) return res.status(500).json({ message: 'Errore login.', error: err.message });
    if (!row) return res.status(401).json({ message: 'Credenziali non valide.' });
    return res.json({ user: { id: row.id, username: row.username } });
  });
});

app.get('/api/projects', (req, res) => {
  const userId = Number(req.query.userId || 0);
  if (!userId) return res.status(400).json({ message: 'userId richiesto.' });

  db.all('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Errore recupero progetti.', error: err.message });
    return res.json({ projects: rows || [] });
  });
});

app.post('/api/projects', (req, res) => {
  const userId = Number(req.body.userId || 0);
  const prompt = String(req.body.prompt || '').trim();
  const name = String(req.body.name || '').trim();

  if (!userId || !prompt) {
    return res.status(400).json({ message: 'userId e prompt richiesti.' });
  }

  const projectName = slugify(name || prompt.split(' ').slice(0, 4).join(' ') || 'progetto');
  const files = projectTemplates(prompt, projectName);

  db.run(
    'INSERT INTO projects (user_id, name, prompt, domain, status) VALUES (?, ?, ?, ?, ?)',
    [userId, projectName, prompt, `${projectName}.codestay.app`, 'online'],
    function (err) {
      if (err) return res.status(500).json({ message: 'Errore creazione progetto.', error: err.message });

      const project = {
        id: this.lastID,
        user_id: userId,
        name: projectName,
        prompt,
        domain: `${projectName}.codestay.app`,
        status: 'online',
        created_at: new Date().toISOString()
      };

      writeGeneratedFiles(project.id, files);
      io.emit('project:created', project);
      return res.status(201).json({ project, files });
    }
  );
});

app.get('/api/projects/:projectId/files', (req, res) => {
  const files = readGeneratedFiles(req.params.projectId);
  return res.json({ files });
});

app.post('/api/projects/:projectId/save', (req, res) => {
  const { file, content } = req.body;
  if (!file || typeof content !== 'string') {
    return res.status(400).json({ message: 'File e contenuto richiesti.' });
  }

  const folder = path.join(generatedDir, String(req.params.projectId));
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, file), content, 'utf8');
  io.emit('project:updated', { projectId: req.params.projectId, file });
  return res.json({ ok: true, file });
});

app.post('/api/projects/:projectId/publish', (req, res) => {
  const domain = `${slugify(String(req.params.projectId))}.codestay.app`;

  db.run('UPDATE projects SET status = ?, domain = ? WHERE id = ?', ['online', domain, req.params.projectId], (err) => {
    if (err) return res.status(500).json({ message: 'Errore pubblicazione.', error: err.message });
    return res.json({ ok: true, status: 'online', domain });
  });
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/generated') || req.path.startsWith('/socket.io')) {
      return next();
    }
    return res.sendFile(path.join(distDir, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`CODESTAY server running on http://localhost:${PORT}`);
});

io.on('connection', (socket) => {
  socket.emit('welcome', { message: 'Connessione CODESTAY attiva' });
  socket.on('ping', () => socket.emit('pong'));
});

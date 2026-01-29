// =============================================================================
// SERVER - Express server met JSON-bestand opslag
// =============================================================================
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'trainingen.json');

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serveer HTML/CSS/JS bestanden

// Zorg dat data directory bestaat
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Zorg dat trainingen.json bestaat
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function leesTrainingen() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

function schrijfTrainingen(trainingen) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(trainingen, null, 2), 'utf8');
}

// ── API Routes ───────────────────────────────────────────────────────────────

// GET /api/trainingen - Alle trainingen ophalen
app.get('/api/trainingen', (req, res) => {
    const trainingen = leesTrainingen();
    res.json(trainingen);
});

// POST /api/trainingen - Nieuwe training toevoegen
app.post('/api/trainingen', (req, res) => {
    const trainingen = leesTrainingen();
    const data = req.body;

    // Validatie
    if (!data.datum || !data.sport || !data.type || !data.afstand || !data.tijd || !data.gemHartslag) {
        return res.status(400).json({ error: 'Verplichte velden ontbreken: datum, sport, type, afstand, tijd, gemHartslag' });
    }

    const training = {
        id: 'tr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        ...data,
        aangemaakt: new Date().toISOString()
    };

    trainingen.push(training);
    trainingen.sort((a, b) => new Date(a.datum) - new Date(b.datum));
    schrijfTrainingen(trainingen);

    res.status(201).json(training);
});

// DELETE /api/trainingen/:id - Training verwijderen
app.delete('/api/trainingen/:id', (req, res) => {
    let trainingen = leesTrainingen();
    const voorAantal = trainingen.length;
    trainingen = trainingen.filter(t => t.id !== req.params.id);

    if (trainingen.length === voorAantal) {
        return res.status(404).json({ error: 'Training niet gevonden' });
    }

    schrijfTrainingen(trainingen);
    res.json({ success: true });
});

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n  10 MILES TRAINER draait op: http://localhost:${PORT}\n`);
    console.log(`  Data wordt opgeslagen in: ${DATA_FILE}\n`);
});

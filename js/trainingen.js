// =============================================================================
// TRAININGEN MODULE - Opslaan, laden en beheren via server API
// Data wordt opgeslagen in data/trainingen.json op de server
// =============================================================================

const Trainingen = (() => {
    // Lokale cache van trainingen (wordt gesynchroniseerd met server)
    let cache = [];
    let geladen = false;

    // ── API Calls ────────────────────────────────────────────────────────────

    async function laadVanServer() {
        try {
            const resp = await fetch('/api/trainingen');
            cache = await resp.json();
            geladen = true;
        } catch (e) {
            console.warn('Server niet beschikbaar, fallback naar localStorage');
            const data = localStorage.getItem('training_app_trainingen');
            cache = data ? JSON.parse(data) : [];
            geladen = true;
        }
        return cache;
    }

    async function slaOpNaarServer(training) {
        try {
            const resp = await fetch('/api/trainingen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(training)
            });
            const result = await resp.json();
            await laadVanServer(); // Herlaad cache
            return result;
        } catch (e) {
            console.warn('Server niet beschikbaar, fallback naar localStorage');
            cache.push(training);
            cache.sort((a, b) => new Date(a.datum) - new Date(b.datum));
            localStorage.setItem('training_app_trainingen', JSON.stringify(cache));
            return training;
        }
    }

    async function verwijderVanServer(id) {
        try {
            await fetch('/api/trainingen/' + id, { method: 'DELETE' });
            await laadVanServer();
        } catch (e) {
            cache = cache.filter(t => t.id !== id);
            localStorage.setItem('training_app_trainingen', JSON.stringify(cache));
        }
    }

    // ── Berekeningen ─────────────────────────────────────────────────────────

    function parseTijd(tijdInput) {
        if (typeof tijdInput === 'number') return tijdInput;
        if (typeof tijdInput === 'string') {
            const parts = tijdInput.split(':');
            if (parts.length === 3) {
                return parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60;
            }
            if (parts.length === 2) {
                return parseInt(parts[0]) + parseInt(parts[1]) / 60;
            }
            return parseFloat(tijdInput);
        }
        return 0;
    }

    function formatTijd(minuten) {
        if (!minuten) return '--:--';
        const uren = Math.floor(minuten / 60);
        const min = Math.floor(minuten % 60);
        const sec = Math.round((minuten % 1) * 60);
        if (uren > 0) {
            return `${uren}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        }
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    function berekenTempo(afstandKm, tijdMinuten) {
        if (!afstandKm || !tijdMinuten) return null;
        const tempoMin = tijdMinuten / afstandKm;
        const min = Math.floor(tempoMin);
        const sec = Math.round((tempoMin - min) * 60);
        return { waarde: tempoMin, display: `${min}:${sec.toString().padStart(2, '0')} /km` };
    }

    function berekenSnelheid(afstandKm, tijdMinuten) {
        if (!afstandKm || !tijdMinuten) return null;
        const snelheid = (afstandKm / tijdMinuten) * 60;
        return { waarde: snelheid, display: `${snelheid.toFixed(1)} km/u` };
    }

    // ── Publieke functies ────────────────────────────────────────────────────

    function getAll() {
        return cache;
    }

    async function voegToe(data) {
        const tijdMinuten = parseTijd(data.tijd);
        const afstand = parseFloat(data.afstand);
        const gemHartslag = parseInt(data.gemHartslag);
        const tempo = berekenTempo(afstand, tijdMinuten);
        const snelheid = berekenSnelheid(afstand, tijdMinuten);
        const zoneInfo = TrainingsSchema.getZoneInfo(gemHartslag);

        const training = {
            id: 'tr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            datum: data.datum,
            sport: data.sport,
            type: data.type,
            afstand: afstand,
            tijd: tijdMinuten,
            tijdDisplay: formatTijd(tijdMinuten),
            gemHartslag: gemHartslag,
            maxHartslag: data.maxHartslag ? parseInt(data.maxHartslag) : null,
            gevoel: data.gevoel ? parseInt(data.gevoel) : null,
            opmerking: data.opmerking || '',
            tempo: tempo,
            snelheid: snelheid,
            zone: zoneInfo.key,
            zoneNaam: zoneInfo.naam,
            aangemaakt: new Date().toISOString()
        };

        await slaOpNaarServer(training);
        return training;
    }

    async function verwijder(id) {
        await verwijderVanServer(id);
    }

    function getPerSport(sport) {
        return cache.filter(t => t.sport === sport);
    }

    function getPerWeek(datum) {
        const target = new Date(datum);
        const startOfWeek = new Date(target);
        startOfWeek.setDate(target.getDate() - ((target.getDay() + 6) % 7));
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return cache.filter(t => {
            const d = new Date(t.datum);
            return d >= startOfWeek && d <= endOfWeek;
        });
    }

    function getWeekStats() {
        if (cache.length === 0) return [];

        const weeks = {};
        cache.forEach(t => {
            const d = new Date(t.datum);
            const startOfWeek = new Date(d);
            startOfWeek.setDate(d.getDate() - ((d.getDay() + 6) % 7));
            const weekKey = startOfWeek.toISOString().split('T')[0];

            if (!weeks[weekKey]) {
                weeks[weekKey] = {
                    weekStart: weekKey,
                    lopen: { km: 0, tijd: 0, hartslag: [], count: 0, tempos: [] },
                    fietsen: { km: 0, tijd: 0, hartslag: [], count: 0, snelheden: [] },
                    totaal: { km: 0, tijd: 0, count: 0 }
                };
            }

            const w = weeks[weekKey];
            const sport = t.sport.toLowerCase() === 'lopen' ? 'lopen' : 'fietsen';
            w[sport].km += t.afstand;
            w[sport].tijd += t.tijd;
            w[sport].hartslag.push(t.gemHartslag);
            w[sport].count++;

            if (sport === 'lopen' && t.tempo) w[sport].tempos.push(t.tempo.waarde);
            if (sport === 'fietsen' && t.snelheid) w[sport].snelheden.push(t.snelheid.waarde);

            w.totaal.km += t.afstand;
            w.totaal.tijd += t.tijd;
            w.totaal.count++;
        });

        return Object.values(weeks).sort((a, b) => a.weekStart.localeCompare(b.weekStart)).map(w => {
            w.lopen.gemHartslag = w.lopen.hartslag.length > 0
                ? Math.round(w.lopen.hartslag.reduce((a, b) => a + b, 0) / w.lopen.hartslag.length) : 0;
            w.lopen.gemTempo = w.lopen.tempos.length > 0
                ? w.lopen.tempos.reduce((a, b) => a + b, 0) / w.lopen.tempos.length : 0;
            w.fietsen.gemHartslag = w.fietsen.hartslag.length > 0
                ? Math.round(w.fietsen.hartslag.reduce((a, b) => a + b, 0) / w.fietsen.hartslag.length) : 0;
            w.fietsen.gemSnelheid = w.fietsen.snelheden.length > 0
                ? w.fietsen.snelheden.reduce((a, b) => a + b, 0) / w.fietsen.snelheden.length : 0;
            return w;
        });
    }

    return {
        laadVanServer,
        getAll,
        voegToe,
        verwijder,
        getPerSport,
        getPerWeek,
        getWeekStats,
        berekenTempo,
        berekenSnelheid,
        parseTijd,
        formatTijd
    };
})();

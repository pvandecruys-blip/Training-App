// =============================================================================
// TRAININGSSCHEMA MODULE - 12 Weken richting 10 Miles van Antwerpen (16.1 km)
// Race: Zaterdag 25 april 2026
// Start: Maandag 2 februari 2026
// =============================================================================

const TrainingsSchema = (() => {
    const HF_MAX = 190; // Aanpasbaar

    const zones = {
        'zone1':   { naam: 'Herstel',      min: 0.50, max: 0.60, color: '#4CAF50' },
        'zone2':   { naam: 'Rustig',        min: 0.60, max: 0.70, color: '#8BC34A' },
        'zone2-3': { naam: 'Aerobe basis',  min: 0.65, max: 0.75, color: '#CDDC39' },
        'zone3':   { naam: 'Tempo',         min: 0.80, max: 0.85, color: '#FF9800' },
        'zone3-4': { naam: 'Drempel',       min: 0.80, max: 0.90, color: '#FF5722' },
        'zone4':   { naam: 'Interval',      min: 0.85, max: 0.90, color: '#f44336' },
        'zone5':   { naam: 'Max',           min: 0.90, max: 1.00, color: '#9C27B0' },
    };

    function getZoneBPM(zoneKey) {
        const z = zones[zoneKey];
        if (!z) return { min: 0, max: 0 };
        return { min: Math.round(z.min * HF_MAX), max: Math.round(z.max * HF_MAX) };
    }

    function getZoneForHR(hr) {
        const pct = hr / HF_MAX;
        if (pct < 0.60) return 'zone1';
        if (pct < 0.70) return 'zone2';
        if (pct < 0.80) return 'zone2-3';
        if (pct < 0.85) return 'zone3';
        if (pct < 0.90) return 'zone4';
        return 'zone5';
    }

    function getZoneInfo(hr) {
        const key = getZoneForHR(hr);
        return { key, ...zones[key], bpm: getZoneBPM(key) };
    }

    // =========================================================================
    // 12-WEKEN SCHEMA: 2 feb 2026 → 26 apr 2026 | Race: Za 25 april
    // =========================================================================
    const schema = [
        // Week 1: 2–8 feb — Basisweek 1
        {
            week: 1,
            thema: "Basisweek 1 – Rustig opbouwen",
            trainingen: [
                { dag: "Dinsdag",   sport: "Lopen",   type: "Rustige duurloop",  afstand: 6,   duur: 40,  zone: "zone2-3", beschrijving: "Rustig tempo, focus op ademhaling" },
                { dag: "Donderdag", sport: "Lopen",   type: "Tempo",             afstand: 5,   duur: 30,  zone: "zone3",   beschrijving: "2km inwarmloop + 3km tempo + 1km cooldown" },
                { dag: "Zaterdag",  sport: "Fietsen",  type: "Fietsduur",        afstand: 50,  duur: 120, zone: "zone2-3", beschrijving: "Rustige duurrit, cadans 85-95 rpm" },
                { dag: "Zondag",    sport: "Lopen",    type: "Lange duurloop",   afstand: 9,   duur: 58,  zone: "zone2-3", beschrijving: "Rustig en comfortabel, basis opbouwen" },
            ]
        },
        // Week 2: 9–15 feb — Basisweek 2
        {
            week: 2,
            thema: "Basisweek 2 – Ritme vinden",
            trainingen: [
                { dag: "Dinsdag",   sport: "Lopen",   type: "Rustige duurloop",  afstand: 7,   duur: 45,  zone: "zone2-3", beschrijving: "Iets langer, zelfde rustig tempo" },
                { dag: "Donderdag", sport: "Lopen",   type: "Interval",          afstand: 5,   duur: 32,  zone: "zone4",   beschrijving: "5x 600m met 400m herstel" },
                { dag: "Zaterdag",  sport: "Fietsen",  type: "Fietsduur",        afstand: 55,  duur: 130, zone: "zone2-3", beschrijving: "Duurrit, constant tempo" },
                { dag: "Zondag",    sport: "Lopen",    type: "Lange duurloop",   afstand: 10,  duur: 65,  zone: "zone2-3", beschrijving: "Geduldig opbouwen, niet forceren" },
            ]
        },
        // Week 3: 16–22 feb — Opbouw 1
        {
            week: 3,
            thema: "Opbouw 1 – Volume verhogen",
            trainingen: [
                { dag: "Dinsdag",   sport: "Lopen",   type: "Rustige duurloop",  afstand: 7,   duur: 45,  zone: "zone2-3", beschrijving: "Herstelrun, benen los houden" },
                { dag: "Donderdag", sport: "Lopen",   type: "Tempo",             afstand: 6,   duur: 34,  zone: "zone3",   beschrijving: "2km warm-up + 4km tempo + cooldown" },
                { dag: "Zaterdag",  sport: "Fietsen",  type: "Fietsblokken",     afstand: 55,  duur: 130, zone: "zone3-4", beschrijving: "4x 6min zone3-4 met 3min herstel" },
                { dag: "Zondag",    sport: "Lopen",    type: "Lange duurloop",   afstand: 11,  duur: 72,  zone: "zone2-3", beschrijving: "Verder opbouwen" },
            ]
        },
        // Week 4: 23 feb – 1 mrt — Opbouw 2
        {
            week: 4,
            thema: "Opbouw 2 – Snelheid prikkelen",
            trainingen: [
                { dag: "Dinsdag",   sport: "Lopen",   type: "Rustige duurloop",  afstand: 8,   duur: 50,  zone: "zone2-3", beschrijving: "Rustig, benen soepel houden" },
                { dag: "Donderdag", sport: "Lopen",   type: "Interval",          afstand: 6,   duur: 35,  zone: "zone4",   beschrijving: "5x 800m met 400m herstel" },
                { dag: "Zaterdag",  sport: "Fietsen",  type: "Fietsblokken",     afstand: 60,  duur: 140, zone: "zone3-4", beschrijving: "4x 8min zone3-4 met 4min herstel" },
                { dag: "Zondag",    sport: "Lopen",    type: "Lange duurloop",   afstand: 12,  duur: 78,  zone: "zone2-3", beschrijving: "Richting wedstrijdafstand opbouwen" },
            ]
        },
        // Week 5: 2–8 mrt — Herstelweek 1
        {
            week: 5,
            thema: "Herstelweek – Laden en bijkomen",
            trainingen: [
                { dag: "Dinsdag",   sport: "Lopen",   type: "Rustige duurloop",  afstand: 5,   duur: 35,  zone: "zone2-3", beschrijving: "Echt rustig, lichaam laten herstellen" },
                { dag: "Donderdag", sport: "Lopen",   type: "Tempo",             afstand: 5,   duur: 28,  zone: "zone3",   beschrijving: "Kort tempoblok, niet te hard" },
                { dag: "Zaterdag",  sport: "Fietsen",  type: "Fietsduur",        afstand: 40,  duur: 100, zone: "zone2-3", beschrijving: "Rustige herstelrit" },
                { dag: "Zondag",    sport: "Lopen",    type: "Lange duurloop",   afstand: 9,   duur: 58,  zone: "zone2-3", beschrijving: "Kortere lange loop, focus op herstel" },
            ]
        },
        // Week 6: 9–15 mrt — Piekweek 1
        {
            week: 6,
            thema: "Piekweek 1 – Steviger bouwen",
            trainingen: [
                { dag: "Dinsdag",   sport: "Lopen",   type: "Rustige duurloop",  afstand: 8,   duur: 50,  zone: "zone2-3", beschrijving: "Rustig maar iets langer" },
                { dag: "Donderdag", sport: "Lopen",   type: "Interval",          afstand: 7,   duur: 40,  zone: "zone4",   beschrijving: "6x 1000m met 500m herstel" },
                { dag: "Zaterdag",  sport: "Fietsen",  type: "Fietsblokken",     afstand: 60,  duur: 140, zone: "zone3-4", beschrijving: "5x 8min zone3-4 met 4min herstel" },
                { dag: "Zondag",    sport: "Lopen",    type: "Lange duurloop",   afstand: 13,  duur: 85,  zone: "zone2-3", beschrijving: "Dichter bij wedstrijdafstand" },
            ]
        },
        // Week 7: 16–22 mrt — Piekweek 2
        {
            week: 7,
            thema: "Piekweek 2 – Maximale belasting",
            trainingen: [
                { dag: "Dinsdag",   sport: "Lopen",   type: "Rustige duurloop",  afstand: 8,   duur: 50,  zone: "zone2-3", beschrijving: "Rustige kilometers, benen los" },
                { dag: "Donderdag", sport: "Lopen",   type: "Tempo",             afstand: 8,   duur: 42,  zone: "zone3",   beschrijving: "2km warm-up + 6km tempo + cooldown" },
                { dag: "Zaterdag",  sport: "Fietsen",  type: "Fietsblokken",     afstand: 65,  duur: 150, zone: "zone3-4", beschrijving: "6x 6min zone4 met 3min herstel" },
                { dag: "Zondag",    sport: "Lopen",    type: "Lange duurloop",   afstand: 14,  duur: 90,  zone: "zone2-3", beschrijving: "Bijna wedstrijdafstand, rustig tempo" },
            ]
        },
        // Week 8: 23–29 mrt — Piekweek 3
        {
            week: 8,
            thema: "Piekweek 3 – Dress rehearsal",
            trainingen: [
                { dag: "Dinsdag",   sport: "Lopen",   type: "Rustige duurloop",  afstand: 7,   duur: 45,  zone: "zone2-3", beschrijving: "Soepel lopen, focus op techniek" },
                { dag: "Donderdag", sport: "Lopen",   type: "Tempo",             afstand: 8,   duur: 42,  zone: "zone3",   beschrijving: "Race-tempo oefenen: 6km aan wedstrijdtempo" },
                { dag: "Zaterdag",  sport: "Fietsen",  type: "Fietsduur",        afstand: 50,  duur: 120, zone: "zone2-3", beschrijving: "Rustige rit, niet te hard" },
                { dag: "Zondag",    sport: "Lopen",    type: "Lange duurloop",   afstand: 16,  duur: 100, zone: "zone2-3", beschrijving: "Dress rehearsal: volledige wedstrijdafstand!" },
            ]
        },
        // Week 9: 30 mrt – 5 apr — Herstelweek 2
        {
            week: 9,
            thema: "Herstelweek 2 – Supercompensatie",
            trainingen: [
                { dag: "Dinsdag",   sport: "Lopen",   type: "Rustige duurloop",  afstand: 6,   duur: 40,  zone: "zone2-3", beschrijving: "Lichaam herstelt, benen frissen op" },
                { dag: "Donderdag", sport: "Lopen",   type: "Interval",          afstand: 5,   duur: 30,  zone: "zone4",   beschrijving: "4x 600m snelle blokken" },
                { dag: "Zaterdag",  sport: "Fietsen",  type: "Fietsduur",        afstand: 45,  duur: 110, zone: "zone2-3", beschrijving: "Rustige rit, benen laten draaien" },
                { dag: "Zondag",    sport: "Lopen",    type: "Lange duurloop",   afstand: 10,  duur: 65,  zone: "zone2-3", beschrijving: "Niet te lang, herstellen" },
            ]
        },
        // Week 10: 6–12 apr — Race-prep
        {
            week: 10,
            thema: "Race-prep – Wedstrijdtempo slijpen",
            trainingen: [
                { dag: "Dinsdag",   sport: "Lopen",   type: "Rustige duurloop",  afstand: 7,   duur: 45,  zone: "zone2-3", beschrijving: "Soepel, niet te hard" },
                { dag: "Donderdag", sport: "Lopen",   type: "Tempo",             afstand: 6,   duur: 32,  zone: "zone3",   beschrijving: "4km aan race-tempo, scherp en gecontroleerd" },
                { dag: "Zaterdag",  sport: "Fietsen",  type: "Fietsduur",        afstand: 40,  duur: 100, zone: "zone2-3", beschrijving: "Lichte rit, actief herstel" },
                { dag: "Zondag",    sport: "Lopen",    type: "Lange duurloop",   afstand: 12,  duur: 75,  zone: "zone2-3", beschrijving: "Laatste langere loop, vertrouwen tanken" },
            ]
        },
        // Week 11: 13–19 apr — Taper
        {
            week: 11,
            thema: "Taper – Volume omlaag, frisheid omhoog",
            trainingen: [
                { dag: "Dinsdag",   sport: "Lopen",   type: "Rustige duurloop",  afstand: 5,   duur: 32,  zone: "zone2-3", beschrijving: "Kort en rustig, benen vers houden" },
                { dag: "Donderdag", sport: "Lopen",   type: "Tempo",             afstand: 5,   duur: 28,  zone: "zone3",   beschrijving: "Korte tempo-prikkel, scherp blijven" },
                { dag: "Zaterdag",  sport: "Fietsen",  type: "Fietsduur",        afstand: 30,  duur: 75,  zone: "zone2-3", beschrijving: "Lichte rit, benen laten draaien" },
                { dag: "Zondag",    sport: "Lopen",    type: "Lange duurloop",   afstand: 8,   duur: 50,  zone: "zone2-3", beschrijving: "Laatste rustige lange loop" },
            ]
        },
        // Week 12: 20–26 apr — RACEWEEK (Race = Zaterdag 25 april)
        {
            week: 12,
            thema: "RACEWEEK – 10 Miles van Antwerpen!",
            trainingen: [
                { dag: "Dinsdag",   sport: "Lopen",   type: "Rustige duurloop",  afstand: 4,   duur: 25,  zone: "zone2-3", beschrijving: "Shakeout run, heel rustig" },
                { dag: "Donderdag", sport: "Lopen",   type: "Tempo",             afstand: 3,   duur: 18,  zone: "zone3",   beschrijving: "Korte opener: 4x 200m strides" },
                { dag: "Zaterdag",  sport: "Lopen",    type: "RACE – 10 Miles",  afstand: 16.1, duur: null, zone: "zone3-4", beschrijving: "RACE DAY! 10 Miles van Antwerpen. Geef alles!" },
            ]
        }
    ];

    // =========================================================================
    // DATUMBEREKENING
    // =========================================================================
    const dagOffset = {
        'Maandag': 0, 'Dinsdag': 1, 'Woensdag': 2, 'Donderdag': 3,
        'Vrijdag': 4, 'Zaterdag': 5, 'Zondag': 6
    };

    function addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    function formatDate(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    function formatDateDisplay(date) {
        const d = new Date(date);
        const dagen = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
        const maanden = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
        return `${dagen[d.getDay()]} ${d.getDate()} ${maanden[d.getMonth()]}`;
    }

    function getSchemaWithDates(startDate) {
        const start = new Date(startDate);
        return schema.map(week => {
            const weekStart = addDays(start, (week.week - 1) * 7);
            const weekEnd = addDays(weekStart, 6);
            return {
                ...week,
                weekStart: formatDate(weekStart),
                weekEnd: formatDate(weekEnd),
                weekStartDisplay: formatDateDisplay(weekStart),
                weekEndDisplay: formatDateDisplay(weekEnd),
                trainingen: week.trainingen.map(t => {
                    const offset = dagOffset[t.dag];
                    const datum = addDays(weekStart, offset);
                    return {
                        ...t,
                        datum: formatDate(datum),
                        datumDisplay: formatDateDisplay(datum)
                    };
                })
            };
        });
    }

    function getCurrentWeek(startDate) {
        const schemaMetDatums = getSchemaWithDates(startDate);
        const vandaag = new Date().toISOString().split('T')[0];
        const huidigeWeek = schemaMetDatums.find(w => vandaag >= w.weekStart && vandaag <= w.weekEnd);
        if (huidigeWeek) return huidigeWeek;
        if (vandaag < schemaMetDatums[0].weekStart) return schemaMetDatums[0];
        return schemaMetDatums[schemaMetDatums.length - 1];
    }

    function getTrainingVandaag(startDate) {
        const schemaMetDatums = getSchemaWithDates(startDate);
        const vandaag = new Date().toISOString().split('T')[0];
        for (const week of schemaMetDatums) {
            const training = week.trainingen.find(t => t.datum === vandaag);
            if (training) return { ...training, week: week.week, thema: week.thema };
        }
        return null;
    }

    function getVolgendeTraining(startDate) {
        const schemaMetDatums = getSchemaWithDates(startDate);
        const vandaag = new Date().toISOString().split('T')[0];
        for (const week of schemaMetDatums) {
            for (const training of week.trainingen) {
                if (training.datum > vandaag) {
                    return { ...training, week: week.week, thema: week.thema };
                }
            }
        }
        return null;
    }

    function getSchema() { return schema; }
    function getWeek(weekNr) { return schema.find(w => w.week === weekNr); }
    function getHFMax() { return HF_MAX; }

    return {
        getSchema,
        getSchemaWithDates,
        getWeek,
        getCurrentWeek,
        getTrainingVandaag,
        getVolgendeTraining,
        getZoneBPM,
        getZoneForHR,
        getZoneInfo,
        getHFMax,
        formatDateDisplay,
        zones
    };
})();

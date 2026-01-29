// =============================================================================
// AI COACH MODULE - Gebruikt ML engine voor intelligente trainingsanalyse
// =============================================================================

const Coach = (() => {
    const SCHEMA_START_DATE = '2026-02-02';

    function analyseer() {
        const adviezen = [];
        const all = Trainingen.getAll();

        if (all.length === 0) {
            adviezen.push({
                type: 'info', icon: 'fa-robot', titel: 'Welkom bij je AI Coach',
                bericht: 'Begin met het registreren van trainingen zodat ik je progressie kan analyseren met machine learning.'
            });
            return adviezen;
        }

        // ── ML Analyse uitvoeren ─────────────────────────────────────────
        const ml = ML.volledigeAnalyse();
        if (!ml) return adviezen;

        // ── 1. Fitness/Fatigue model (TSB) ───────────────────────────────
        if (ml.fitnessModel) {
            const fm = ml.fitnessModel;
            const raceDatum = '2026-04-25';
            const dagenTotRace = Math.ceil((new Date(raceDatum) - new Date()) / (1000 * 60 * 60 * 24));

            let tsbIcon, tsbType;
            if (fm.huidigeTSB > 5) { tsbType = 'success'; tsbIcon = 'fa-battery-full'; }
            else if (fm.huidigeTSB > -10) { tsbType = 'info'; tsbIcon = 'fa-battery-three-quarters'; }
            else if (fm.huidigeTSB > -20) { tsbType = 'warning'; tsbIcon = 'fa-battery-quarter'; }
            else { tsbType = 'danger'; tsbIcon = 'fa-battery-empty'; }

            adviezen.push({
                type: tsbType, icon: tsbIcon,
                titel: `Form: ${fm.huidigeTSB > 0 ? '+' : ''}${fm.huidigeTSB} TSB`,
                bericht: `${fm.status}. Fitness (CTL): ${fm.huidigeFitness} | Vermoeidheid (ATL): ${fm.huidigeFatigue}${dagenTotRace > 0 ? ` | Nog ${dagenTotRace} dagen tot de race.` : ''}${fm.raceReady ? ' Je bent in de ideale zone om te presteren!' : ''}`
            });
        }

        // ── 2. Tempo trend (lineaire regressie) ─────────────────────────
        if (ml.tempoTrend) {
            const tt = ml.tempoTrend;
            adviezen.push({
                type: tt.verbetering ? 'success' : (tt.trend === 'stabiel' ? 'info' : 'warning'),
                icon: tt.verbetering ? 'fa-arrow-down' : 'fa-arrows-alt-h',
                titel: `Tempo trend: ${tt.trend} (R²=${tt.r2.toFixed(2)})`,
                bericht: `${tt.beschrijving}. ${tt.r2 > 0.5 ? 'Betrouwbare trend.' : 'Nog niet heel consistent — meer data verbetert de voorspelling.'}`
            });
        }

        // ── 3. Hartslag trend ────────────────────────────────────────────
        if (ml.hartslagTrend) {
            const ht = ml.hartslagTrend;
            adviezen.push({
                type: ht.verbetering ? 'success' : (ht.trend === 'stabiel' ? 'info' : 'warning'),
                icon: 'fa-heartbeat',
                titel: `Hartslag trend: ${ht.trend}`,
                bericht: ht.beschrijving
            });
        }

        // ── 4. Efficiëntie-index ─────────────────────────────────────────
        if (ml.efficiencyIndex) {
            const ei = ml.efficiencyIndex;
            adviezen.push({
                type: ei.verbetering ? 'success' : (Math.abs(ei.verschilPct) < 3 ? 'info' : 'warning'),
                icon: 'fa-cogs',
                titel: `Loopefficiëntie: ${ei.verschilPct > 0 ? '+' : ''}${ei.verschilPct}%`,
                bericht: ei.beschrijving
            });
        }

        // ── 5. Race voorspelling (VDOT) ──────────────────────────────────
        if (ml.racePrediction) {
            const rp = ml.racePrediction;
            adviezen.push({
                type: 'info', icon: 'fa-trophy',
                titel: `VDOT: ${rp.vdot} — 10 Miles in ~${rp.voorspellingen['10 Miles']}`,
                bericht: `Op basis van je beste trainingen (VDOT ${rp.vdot}): 5K in ${rp.voorspellingen['5K']} | 10K in ${rp.voorspellingen['10K']} | 10 Miles in ${rp.voorspellingen['10 Miles']} (tempo ${rp.raceTempo.display}). Gebaseerd op ${rp.gebaseerdOp.length} trainingen.`
            });
        }

        // ── 6. Anomalieën ────────────────────────────────────────────────
        if (ml.anomalies && ml.anomalies.length > 0) {
            for (const a of ml.anomalies) {
                adviezen.push({
                    type: a.type, icon: a.type === 'danger' ? 'fa-exclamation-triangle' : 'fa-star',
                    titel: a.type === 'danger' ? 'Anomalie gedetecteerd' : 'Uitschieter (positief)',
                    bericht: a.bericht
                });
            }
        }

        // ── 7. Trainingstrouw ────────────────────────────────────────────
        const schema = TrainingsSchema.getSchemaWithDates(SCHEMA_START_DATE);
        const vandaag = new Date().toISOString().split('T')[0];
        let gepland = 0;
        schema.forEach(week => {
            week.trainingen.forEach(t => { if (t.datum < vandaag) gepland++; });
        });

        if (gepland > 0) {
            const compliance = Math.round((all.length / gepland) * 100);
            const capped = Math.min(compliance, 100);
            adviezen.push({
                type: capped >= 80 ? 'success' : capped >= 60 ? 'info' : 'warning',
                icon: 'fa-clipboard-check',
                titel: `Trainingstrouw: ${capped}%`,
                bericht: `${all.length} van ${gepland} geplande trainingen uitgevoerd.${capped >= 80 ? ' Sterke discipline!' : capped >= 60 ? ' Probeer consistenter te zijn.' : ' Je mist te veel trainingen voor optimale voorbereiding.'}`
            });
        }

        return adviezen;
    }

    return { analyseer };
})();

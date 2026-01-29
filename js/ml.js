// =============================================================================
// ML MODULE - Machine Learning engine voor trainingsanalyse
// =============================================================================
// Bevat:
// 1. Lineaire regressie (trend-analyse)
// 2. Training Load / Fitness-Fatigue model (Banister impulse-response)
// 3. Anomalie-detectie (z-score)
// 4. VDOT race predictor (Jack Daniels model)
// 5. Voorspellingen (tempo, HR, readiness)
// =============================================================================

const ML = (() => {

    // =========================================================================
    // 1. LINEAIRE REGRESSIE
    // =========================================================================
    // Berekent best-fit lijn door datapunten: y = slope * x + intercept
    // Geeft ook r² (hoe goed de lijn past, 0-1)

    function linearRegression(points) {
        const n = points.length;
        if (n < 2) return null;

        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        for (const { x, y } of points) {
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
            sumY2 += y * y;
        }

        const denom = n * sumX2 - sumX * sumX;
        if (denom === 0) return null;

        const slope = (n * sumXY - sumX * sumY) / denom;
        const intercept = (sumY - slope * sumX) / n;

        // R² (coefficient of determination)
        const yMean = sumY / n;
        let ssRes = 0, ssTot = 0;
        for (const { x, y } of points) {
            const predicted = slope * x + intercept;
            ssRes += (y - predicted) ** 2;
            ssTot += (y - yMean) ** 2;
        }
        const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

        return {
            slope,
            intercept,
            r2,
            predict: (x) => slope * x + intercept,
            // Per week verandering (als x in dagen)
            weeklyChange: slope * 7,
            trend: slope < -0.01 ? 'dalend' : slope > 0.01 ? 'stijgend' : 'stabiel'
        };
    }

    // Analyseer tempo-trend over tijd
    function tempoTrend(trainingen) {
        const loopData = trainingen
            .filter(t => t.sport === 'Lopen' && t.tempo)
            .map(t => ({
                x: daysSinceStart(t.datum, trainingen),
                y: t.tempo.waarde
            }));
        if (loopData.length < 3) return null;

        const reg = linearRegression(loopData);
        if (!reg) return null;

        return {
            ...reg,
            // Negatieve slope = sneller worden (lager tempo = beter)
            verbetering: reg.slope < 0,
            perWeek: Math.abs(reg.weeklyChange),
            beschrijving: reg.slope < -0.02
                ? `Je tempo verbetert met ~${Math.abs(reg.weeklyChange * 60).toFixed(0)} sec/km per week`
                : reg.slope > 0.02
                ? `Je tempo verslechtert met ~${(reg.weeklyChange * 60).toFixed(0)} sec/km per week`
                : 'Je tempo is stabiel'
        };
    }

    // Analyseer hartslag-trend
    function hartslagTrend(trainingen) {
        const data = trainingen
            .filter(t => t.sport === 'Lopen' && t.gemHartslag && t.tempo)
            .map(t => ({
                x: daysSinceStart(t.datum, trainingen),
                y: t.gemHartslag
            }));
        if (data.length < 3) return null;

        const reg = linearRegression(data);
        if (!reg) return null;

        return {
            ...reg,
            verbetering: reg.slope < 0,
            perWeek: Math.abs(reg.weeklyChange),
            beschrijving: reg.slope < -0.3
                ? `Je hartslag daalt met ~${Math.abs(reg.weeklyChange).toFixed(1)} bpm per week — je wordt fitter!`
                : reg.slope > 0.3
                ? `Je hartslag stijgt met ~${reg.weeklyChange.toFixed(1)} bpm per week — mogelijke vermoeidheid`
                : 'Je hartslag is stabiel'
        };
    }

    // =========================================================================
    // 2. TRAINING LOAD MODEL (Banister Impulse-Response)
    // =========================================================================
    // Berekent Fitness (CTL) en Fatigue (ATL) op basis van TRIMP
    // TSB (Training Stress Balance) = Fitness - Fatigue
    // Positieve TSB = vers en fit, negatieve TSB = vermoeid

    function berekenTRIMP(training) {
        // Simplified TRIMP: duur × hartslag-intensiteit
        const hrMax = TrainingsSchema.getHFMax();
        const hrRest = 60; // Aanname rusthartslag
        const hrReserve = (training.gemHartslag - hrRest) / (hrMax - hrRest);
        const duur = training.tijd || 0;

        // Gender-neutral exponentiële TRIMP
        return duur * hrReserve * 0.64 * Math.exp(1.92 * hrReserve);
    }

    function fitnessModel(trainingen) {
        if (trainingen.length < 2) return null;

        const sorted = [...trainingen].sort((a, b) => new Date(a.datum) - new Date(b.datum));
        const startDate = new Date(sorted[0].datum);
        const endDate = new Date();
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        // Dagelijkse TRIMP array
        const dailyTRIMP = new Array(totalDays).fill(0);
        sorted.forEach(t => {
            const day = Math.floor((new Date(t.datum) - startDate) / (1000 * 60 * 60 * 24));
            if (day >= 0 && day < totalDays) {
                dailyTRIMP[day] += berekenTRIMP(t);
            }
        });

        // Exponential moving averages
        const CTL_TAU = 42; // Fitness time constant (42 dagen)
        const ATL_TAU = 7;  // Fatigue time constant (7 dagen)

        const fitness = []; // CTL - Chronic Training Load
        const fatigue = []; // ATL - Acute Training Load
        const tsb = [];     // Training Stress Balance

        let ctl = 0, atl = 0;
        for (let i = 0; i < totalDays; i++) {
            ctl = ctl + (dailyTRIMP[i] - ctl) / CTL_TAU;
            atl = atl + (dailyTRIMP[i] - atl) / ATL_TAU;

            const date = new Date(startDate);
            date.setDate(date.getDate() + i);

            fitness.push({ datum: date.toISOString().split('T')[0], waarde: ctl });
            fatigue.push({ datum: date.toISOString().split('T')[0], waarde: atl });
            tsb.push({ datum: date.toISOString().split('T')[0], waarde: ctl - atl });
        }

        const huidigeFitness = fitness[fitness.length - 1]?.waarde || 0;
        const huidigeFatigue = fatigue[fatigue.length - 1]?.waarde || 0;
        const huidigeTSB = tsb[tsb.length - 1]?.waarde || 0;

        let status;
        if (huidigeTSB > 10) status = 'Fris en klaar om te presteren';
        else if (huidigeTSB > 0) status = 'Goed hersteld, klaar voor training';
        else if (huidigeTSB > -10) status = 'Lichte vermoeidheid, normaal bij training';
        else if (huidigeTSB > -20) status = 'Vermoeid — overweeg meer herstel';
        else status = 'Overbelast — rust is noodzakelijk';

        return {
            fitness, fatigue, tsb,
            huidigeFitness: Math.round(huidigeFitness * 10) / 10,
            huidigeFatigue: Math.round(huidigeFatigue * 10) / 10,
            huidigeTSB: Math.round(huidigeTSB * 10) / 10,
            status,
            raceReady: huidigeTSB > 5 && huidigeTSB < 25
        };
    }

    // =========================================================================
    // 3. ANOMALIE-DETECTIE (Z-Score)
    // =========================================================================
    // Detecteert trainingen die significant afwijken van het gemiddelde

    function mean(arr) { return arr.reduce((s, v) => s + v, 0) / arr.length; }
    function stdDev(arr) {
        const m = mean(arr);
        return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
    }

    function detectAnomalies(trainingen) {
        const anomalies = [];
        const lopen = trainingen.filter(t => t.sport === 'Lopen' && t.tempo && t.gemHartslag);

        if (lopen.length < 5) return anomalies;

        const tempos = lopen.map(t => t.tempo.waarde);
        const hrs = lopen.map(t => t.gemHartslag);

        const tempoMean = mean(tempos);
        const tempoStd = stdDev(tempos);
        const hrMean = mean(hrs);
        const hrStd = stdDev(hrs);

        // Check laatste 3 trainingen op anomalieen
        const recent = lopen.slice(-3);
        for (const t of recent) {
            const tempoZ = tempoStd > 0 ? (t.tempo.waarde - tempoMean) / tempoStd : 0;
            const hrZ = hrStd > 0 ? (t.gemHartslag - hrMean) / hrStd : 0;

            // Efficiency anomaly: hoge HR + traag tempo
            if (hrZ > 1.5 && tempoZ > 1) {
                anomalies.push({
                    type: 'danger',
                    training: t,
                    bericht: `Training op ${t.datum}: ongewoon hoge hartslag (${t.gemHartslag} bpm) bij traag tempo (${t.tempo.display}). Z-scores: HR=${hrZ.toFixed(1)}σ, Tempo=${tempoZ.toFixed(1)}σ. Dit wijst op vermoeidheid, slaapgebrek of ziekte.`
                });
            }
            // Positive anomaly: lage HR + snel tempo
            else if (hrZ < -1 && tempoZ < -1) {
                anomalies.push({
                    type: 'success',
                    training: t,
                    bericht: `Training op ${t.datum}: lage hartslag (${t.gemHartslag} bpm) bij snel tempo (${t.tempo.display}). Z-scores: HR=${hrZ.toFixed(1)}σ, Tempo=${tempoZ.toFixed(1)}σ. Uitstekende aerobe efficiëntie!`
                });
            }
        }

        return anomalies;
    }

    // =========================================================================
    // 4. VDOT RACE PREDICTOR (Jack Daniels Model)
    // =========================================================================
    // Schat VO2max (VDOT) op basis van race/tempo-data en voorspelt racetijden

    function berekenVDOT(afstandKm, tijdMinuten) {
        // Simplified Daniels formula
        // VO2 cost of running at given speed
        const speed = afstandKm * 1000 / tijdMinuten; // meters per minute
        const percentVO2max = 0.8 + 0.1894393 * Math.exp(-0.012778 * tijdMinuten)
                             + 0.2989558 * Math.exp(-0.1932605 * tijdMinuten);
        const vo2 = -4.60 + 0.182258 * speed + 0.000104 * speed * speed;
        return vo2 / percentVO2max;
    }

    function voorspelRaceTijd(vdot, afstandKm) {
        // Iteratief: zoek de tijd die de gegeven VDOT oplevert voor de afstand
        let low = afstandKm * 2; // minimale tijd (onrealistisch snel)
        let high = afstandKm * 15; // maximale tijd

        for (let i = 0; i < 50; i++) {
            const mid = (low + high) / 2;
            const testVDOT = berekenVDOT(afstandKm, mid);
            if (testVDOT > vdot) low = mid;
            else high = mid;
        }

        return (low + high) / 2;
    }

    function racePrediction(trainingen) {
        // Gebruik tempo-trainingen en lange loops voor VDOT schatting
        const geschikte = trainingen.filter(t =>
            t.sport === 'Lopen' && t.tempo && t.afstand >= 5 && t.tijd >= 15
        );

        if (geschikte.length < 2) return null;

        // Bereken VDOT voor elke training, neem gemiddelde van beste 3
        const vdots = geschikte.map(t => ({
            vdot: berekenVDOT(t.afstand, t.tijd),
            datum: t.datum,
            afstand: t.afstand,
            tempo: t.tempo.display
        })).sort((a, b) => b.vdot - a.vdot);

        const topVDOTs = vdots.slice(0, Math.min(3, vdots.length));
        const gemVDOT = mean(topVDOTs.map(v => v.vdot));

        // Voorspel 10 Miles (16.1 km)
        const raceTijdMin = voorspelRaceTijd(gemVDOT, 16.1);
        const uren = Math.floor(raceTijdMin / 60);
        const min = Math.floor(raceTijdMin % 60);
        const sec = Math.round((raceTijdMin % 1) * 60);
        const raceTempo = raceTijdMin / 16.1;

        // Voorspel ook 5K en 10K als referentie
        const tijd5k = voorspelRaceTijd(gemVDOT, 5);
        const tijd10k = voorspelRaceTijd(gemVDOT, 10);

        return {
            vdot: Math.round(gemVDOT * 10) / 10,
            raceTijd: { uren, min, sec, totaalMinuten: raceTijdMin },
            raceTempo: { waarde: raceTempo, display: formatTempo(raceTempo) },
            voorspellingen: {
                '5K': formatRaceTijd(tijd5k),
                '10K': formatRaceTijd(tijd10k),
                '10 Miles': formatRaceTijd(raceTijdMin)
            },
            gebaseerdOp: topVDOTs
        };
    }

    // =========================================================================
    // 5. EFFICIENCY INDEX
    // =========================================================================
    // Hoe efficiënt loop je? Lagere HR bij sneller tempo = beter

    function efficiencyIndex(trainingen) {
        const lopen = trainingen.filter(t =>
            t.sport === 'Lopen' && t.tempo && t.gemHartslag && t.afstand >= 4
        );
        if (lopen.length < 4) return null;

        // Efficiency = tempo × HR (lager = beter)
        const data = lopen.map(t => ({
            x: daysSinceStart(t.datum, trainingen),
            y: t.tempo.waarde * t.gemHartslag,
            datum: t.datum
        }));

        const reg = linearRegression(data);
        if (!reg) return null;

        const eerste = data.slice(0, Math.ceil(data.length / 2));
        const laatste = data.slice(Math.ceil(data.length / 2));
        const eersteGem = mean(eerste.map(d => d.y));
        const laatsteGem = mean(laatste.map(d => d.y));
        const verschilPct = ((laatsteGem - eersteGem) / eersteGem) * 100;

        return {
            trend: reg,
            eersteGem: Math.round(eersteGem),
            laatsteGem: Math.round(laatsteGem),
            verschilPct: Math.round(verschilPct * 10) / 10,
            verbetering: verschilPct < 0,
            beschrijving: verschilPct < -3
                ? `Je loopefficiëntie is ${Math.abs(verschilPct).toFixed(1)}% verbeterd! Je loopt sneller met minder hartslag-effort.`
                : verschilPct > 3
                ? `Je loopefficiëntie is ${verschilPct.toFixed(1)}% gedaald. Mogelijk vermoeidheid of externe factoren (warmte, heuvel).`
                : 'Je loopefficiëntie is stabiel.'
        };
    }

    // =========================================================================
    // COMPLETE ANALYSE
    // =========================================================================

    function volledigeAnalyse() {
        const trainingen = Trainingen.getAll();
        if (trainingen.length === 0) return null;

        return {
            tempoTrend: tempoTrend(trainingen),
            hartslagTrend: hartslagTrend(trainingen),
            fitnessModel: fitnessModel(trainingen),
            anomalies: detectAnomalies(trainingen),
            racePrediction: racePrediction(trainingen),
            efficiencyIndex: efficiencyIndex(trainingen),
            dataPoints: trainingen.length
        };
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    function daysSinceStart(datum, trainingen) {
        const sorted = [...trainingen].sort((a, b) => new Date(a.datum) - new Date(b.datum));
        const start = new Date(sorted[0].datum);
        return (new Date(datum) - start) / (1000 * 60 * 60 * 24);
    }

    function formatTempo(tempoWaarde) {
        const min = Math.floor(tempoWaarde);
        const sec = Math.round((tempoWaarde - min) * 60);
        return `${min}:${sec.toString().padStart(2, '0')} /km`;
    }

    function formatRaceTijd(minuten) {
        const u = Math.floor(minuten / 60);
        const m = Math.floor(minuten % 60);
        const s = Math.round((minuten % 1) * 60);
        if (u > 0) return `${u}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    return {
        linearRegression,
        tempoTrend,
        hartslagTrend,
        fitnessModel,
        detectAnomalies,
        racePrediction,
        efficiencyIndex,
        volledigeAnalyse,
        berekenTRIMP,
        berekenVDOT
    };
})();

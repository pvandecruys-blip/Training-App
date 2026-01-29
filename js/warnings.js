// =============================================================================
// WARNINGS MODULE - Intelligente trainingscontrole
// =============================================================================

const Warnings = (() => {
    function analyseer() {
        const warnings = [];
        const all = Trainingen.getAll();
        if (all.length === 0) return warnings;

        const nu = new Date();
        const dezeWeek = Trainingen.getPerWeek(nu.toISOString().split('T')[0]);

        // 1. Check: Te weinig rustige kilometers deze week
        const rustLoops = dezeWeek.filter(t => t.sport === 'Lopen' && t.type.toLowerCase().includes('rustig'));
        const tempoLoops = dezeWeek.filter(t => t.sport === 'Lopen' &&
            (t.type.toLowerCase().includes('tempo') || t.type.toLowerCase().includes('interval')));
        const rustKm = rustLoops.reduce((s, t) => s + t.afstand, 0);
        const tempoKm = tempoLoops.reduce((s, t) => s + t.afstand, 0);

        if (tempoKm > 0 && rustKm < tempoKm * 1.5) {
            warnings.push({
                type: 'warning',
                icon: 'fa-exclamation-triangle',
                bericht: 'Je hebt deze week te weinig rustige kilometers ten opzichte van je intensieve trainingen. Probeer een verhouding van 80/20 aan te houden.'
            });
        }

        // 2. Check: Lange duurloop te kort
        const langeLoops = all.filter(t => t.type.toLowerCase().includes('lange'));
        if (langeLoops.length > 0) {
            const laatsteLange = langeLoops[langeLoops.length - 1];
            if (laatsteLange.afstand < 12) {
                warnings.push({
                    type: 'info',
                    icon: 'fa-info-circle',
                    bericht: `Je laatste lange duurloop was ${laatsteLange.afstand} km. Voor de 10 Miles (16.1 km) is het aan te raden minstens 14-16 km te lopen in training.`
                });
            }
        }

        // 3. Check: Hartslag hoger dan normaal bij zelfde tempo
        const loopTrainingen = all.filter(t => t.sport === 'Lopen' && t.tempo && t.gemHartslag);
        if (loopTrainingen.length >= 4) {
            const recent = loopTrainingen.slice(-3);
            const eerder = loopTrainingen.slice(-6, -3);

            if (eerder.length >= 2) {
                const gemTempoRecent = recent.reduce((s, t) => s + t.tempo.waarde, 0) / recent.length;
                const gemHRRecent = recent.reduce((s, t) => s + t.gemHartslag, 0) / recent.length;
                const gemTempoEerder = eerder.reduce((s, t) => s + t.tempo.waarde, 0) / eerder.length;
                const gemHREerder = eerder.reduce((s, t) => s + t.gemHartslag, 0) / eerder.length;

                const tempoVerschil = Math.abs(gemTempoRecent - gemTempoEerder);

                if (tempoVerschil < 0.3 && gemHRRecent > gemHREerder + 5) {
                    warnings.push({
                        type: 'danger',
                        icon: 'fa-heartbeat',
                        bericht: `Je hartslag ligt gemiddeld ${Math.round(gemHRRecent - gemHREerder)} bpm hoger dan eerder bij vergelijkbaar tempo. Mogelijk ben je vermoeid of heb je meer herstel nodig.`
                    });
                }
            }
        }

        // 4. Check: Verbetering detecteren
        if (loopTrainingen.length >= 6) {
            const recent = loopTrainingen.slice(-3);
            const eerder = loopTrainingen.slice(-6, -3);

            const gemHRRecent = recent.reduce((s, t) => s + t.gemHartslag, 0) / recent.length;
            const gemHREerder = eerder.reduce((s, t) => s + t.gemHartslag, 0) / eerder.length;
            const gemTempoRecent = recent.reduce((s, t) => s + t.tempo.waarde, 0) / recent.length;
            const gemTempoEerder = eerder.reduce((s, t) => s + t.tempo.waarde, 0) / eerder.length;

            if (gemTempoRecent < gemTempoEerder - 0.1 && gemHRRecent <= gemHREerder) {
                warnings.push({
                    type: 'success',
                    icon: 'fa-trophy',
                    bericht: 'Je wordt sneller bij dezelfde of lagere hartslag! Je conditie verbetert.'
                });
            }

            if (gemHRRecent < gemHREerder - 3 && Math.abs(gemTempoRecent - gemTempoEerder) < 0.2) {
                warnings.push({
                    type: 'success',
                    icon: 'fa-heart',
                    bericht: 'Je hartslag wordt lager bij hetzelfde tempo. Je aerobe basis wordt sterker!'
                });
            }
        }

        // 5. Check: Gevoel laag
        const recenteTrainingen = all.slice(-3);
        const lageGevoelens = recenteTrainingen.filter(t => t.gevoel && t.gevoel <= 4);
        if (lageGevoelens.length >= 2) {
            warnings.push({
                type: 'warning',
                icon: 'fa-battery-quarter',
                bericht: 'Je gevoel bij de laatste trainingen was laag. Overweeg een extra rustdag of lichtere training.'
            });
        }

        // 6. Check: Volume-opbouw te snel
        const weekStats = Trainingen.getWeekStats();
        if (weekStats.length >= 2) {
            const last = weekStats[weekStats.length - 1];
            const prev = weekStats[weekStats.length - 2];
            if (prev.totaal.km > 0) {
                const toename = ((last.totaal.km - prev.totaal.km) / prev.totaal.km) * 100;
                if (toename > 15) {
                    warnings.push({
                        type: 'warning',
                        icon: 'fa-arrow-up',
                        bericht: `Je weekvolume is ${Math.round(toename)}% gestegen t.o.v. vorige week. Houd de 10%-regel aan om blessures te voorkomen.`
                    });
                }
            }
        }

        // 7. Race readiness
        const maxLangeLoop = langeLoops.length > 0 ? Math.max(...langeLoops.map(t => t.afstand)) : 0;
        if (maxLangeLoop >= 14) {
            warnings.push({
                type: 'success',
                icon: 'fa-flag-checkered',
                bericht: `Je langste loop is ${maxLangeLoop} km. Je bent op schema voor de 16.1 km!`
            });
        } else if (maxLangeLoop > 0) {
            const verschil = 14 - maxLangeLoop;
            warnings.push({
                type: 'info',
                icon: 'fa-road',
                bericht: `Je langste loop is ${maxLangeLoop} km. Bouw nog ${verschil.toFixed(1)} km op richting 14+ km voor race readiness.`
            });
        }

        return warnings;
    }

    return { analyseer };
})();

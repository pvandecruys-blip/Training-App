// =============================================================================
// DASHBOARD MODULE - Grafieken en statistieken
// =============================================================================

const Dashboard = (() => {
    let charts = {};

    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#e0e0e0', font: { family: "'Inter', sans-serif" } } }
        },
        scales: {
            x: { ticks: { color: '#999' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#999' }, grid: { color: 'rgba(255,255,255,0.08)' } }
        }
    };

    function destroyChart(name) {
        if (charts[name]) {
            charts[name].destroy();
            delete charts[name];
        }
    }

    function formatWeekLabel(dateStr) {
        const d = new Date(dateStr);
        const dag = d.getDate();
        const maand = d.toLocaleString('nl-NL', { month: 'short' });
        return `${dag} ${maand}`;
    }

    function renderAfstandPerWeek(canvasId) {
        destroyChart('afstandPerWeek');
        const stats = Trainingen.getWeekStats();
        if (stats.length === 0) return;

        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        charts.afstandPerWeek = new Chart(ctx, {
            type: 'line',
            data: {
                labels: stats.map(s => formatWeekLabel(s.weekStart)),
                datasets: [
                    {
                        label: 'Lopen (km)',
                        data: stats.map(s => s.lopen.km.toFixed(1)),
                        borderColor: '#00e676',
                        backgroundColor: 'rgba(0, 230, 118, 0.1)',
                        tension: 0.3,
                        fill: true,
                        pointRadius: 4,
                        pointBackgroundColor: '#00e676'
                    },
                    {
                        label: 'Fietsen (km)',
                        data: stats.map(s => s.fietsen.km.toFixed(1)),
                        borderColor: '#ff9100',
                        backgroundColor: 'rgba(255, 145, 0, 0.1)',
                        tension: 0.3,
                        fill: true,
                        pointRadius: 4,
                        pointBackgroundColor: '#ff9100'
                    }
                ]
            },
            options: {
                ...chartDefaults,
                plugins: {
                    ...chartDefaults.plugins,
                    title: { display: true, text: 'Afstand per week', color: '#fff', font: { size: 14 } }
                }
            }
        });
    }

    function renderHartslagPerTraining(canvasId) {
        destroyChart('hartslagPerTraining');
        const all = Trainingen.getAll();
        if (all.length === 0) return;

        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const loopData = all.filter(t => t.sport === 'Lopen');
        const fietsData = all.filter(t => t.sport === 'Fietsen');

        charts.hartslagPerTraining = new Chart(ctx, {
            type: 'line',
            data: {
                labels: all.map(t => {
                    const d = new Date(t.datum);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                }),
                datasets: [
                    {
                        label: 'Hartslag Lopen',
                        data: all.map(t => t.sport === 'Lopen' ? t.gemHartslag : null),
                        borderColor: '#00e676',
                        tension: 0.3,
                        spanGaps: true,
                        pointRadius: 4,
                        pointBackgroundColor: '#00e676'
                    },
                    {
                        label: 'Hartslag Fietsen',
                        data: all.map(t => t.sport === 'Fietsen' ? t.gemHartslag : null),
                        borderColor: '#ff9100',
                        tension: 0.3,
                        spanGaps: true,
                        pointRadius: 4,
                        pointBackgroundColor: '#ff9100'
                    }
                ]
            },
            options: {
                ...chartDefaults,
                plugins: {
                    ...chartDefaults.plugins,
                    title: { display: true, text: 'Gemiddelde hartslag per training', color: '#fff', font: { size: 14 } }
                }
            }
        });
    }

    function renderTempoEvolutie(canvasId) {
        destroyChart('tempoEvolutie');
        const loopData = Trainingen.getPerSport('Lopen').filter(t => t.tempo);
        if (loopData.length === 0) return;

        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        charts.tempoEvolutie = new Chart(ctx, {
            type: 'line',
            data: {
                labels: loopData.map(t => {
                    const d = new Date(t.datum);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                }),
                datasets: [{
                    label: 'Tempo (min/km)',
                    data: loopData.map(t => t.tempo.waarde.toFixed(2)),
                    borderColor: '#00e676',
                    backgroundColor: 'rgba(0, 230, 118, 0.15)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: '#00e676'
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    ...chartDefaults.scales,
                    y: { ...chartDefaults.scales.y, reverse: true, title: { display: true, text: 'min/km', color: '#999' } }
                },
                plugins: {
                    ...chartDefaults.plugins,
                    title: { display: true, text: 'Tempo-evolutie (lopen)', color: '#fff', font: { size: 14 } }
                }
            }
        });
    }

    function renderSnelheidEvolutie(canvasId) {
        destroyChart('snelheidEvolutie');
        const fietsData = Trainingen.getPerSport('Fietsen').filter(t => t.snelheid);
        if (fietsData.length === 0) return;

        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        charts.snelheidEvolutie = new Chart(ctx, {
            type: 'line',
            data: {
                labels: fietsData.map(t => {
                    const d = new Date(t.datum);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                }),
                datasets: [{
                    label: 'Snelheid (km/u)',
                    data: fietsData.map(t => t.snelheid.waarde.toFixed(1)),
                    borderColor: '#ff9100',
                    backgroundColor: 'rgba(255, 145, 0, 0.15)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: '#ff9100'
                }]
            },
            options: {
                ...chartDefaults,
                plugins: {
                    ...chartDefaults.plugins,
                    title: { display: true, text: 'Snelheid-evolutie (fietsen)', color: '#fff', font: { size: 14 } }
                }
            }
        });
    }

    function getSamenvatting() {
        const all = Trainingen.getAll();
        const lopen = all.filter(t => t.sport === 'Lopen');
        const fietsen = all.filter(t => t.sport === 'Fietsen');

        return {
            totaal: {
                trainingen: all.length,
                km: all.reduce((s, t) => s + t.afstand, 0),
                tijd: all.reduce((s, t) => s + t.tijd, 0)
            },
            lopen: {
                trainingen: lopen.length,
                km: lopen.reduce((s, t) => s + t.afstand, 0),
                tijd: lopen.reduce((s, t) => s + t.tijd, 0),
                gemTempo: lopen.filter(t => t.tempo).length > 0
                    ? lopen.filter(t => t.tempo).reduce((s, t) => s + t.tempo.waarde, 0) / lopen.filter(t => t.tempo).length
                    : 0,
                gemHR: lopen.length > 0
                    ? Math.round(lopen.reduce((s, t) => s + t.gemHartslag, 0) / lopen.length)
                    : 0
            },
            fietsen: {
                trainingen: fietsen.length,
                km: fietsen.reduce((s, t) => s + t.afstand, 0),
                tijd: fietsen.reduce((s, t) => s + t.tijd, 0),
                gemSnelheid: fietsen.filter(t => t.snelheid).length > 0
                    ? fietsen.filter(t => t.snelheid).reduce((s, t) => s + t.snelheid.waarde, 0) / fietsen.filter(t => t.snelheid).length
                    : 0,
                gemHR: fietsen.length > 0
                    ? Math.round(fietsen.reduce((s, t) => s + t.gemHartslag, 0) / fietsen.length)
                    : 0
            }
        };
    }

    function renderAll() {
        renderAfstandPerWeek('chartAfstand');
        renderHartslagPerTraining('chartHartslag');
        renderTempoEvolutie('chartTempo');
        renderSnelheidEvolutie('chartSnelheid');
    }

    return {
        renderAll,
        renderAfstandPerWeek,
        renderHartslagPerTraining,
        renderTempoEvolutie,
        renderSnelheidEvolutie,
        getSamenvatting
    };
})();

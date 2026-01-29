// =============================================================================
// APP MODULE - Hoofdcontroller
// =============================================================================

const App = (() => {
    // Config
    const SCHEMA_START_DATE = '2026-02-02'; // Start datum van het 10-weken schema

    const quotes = [
        "Consistency beats motivation.",
        "Today's training builds race day.",
        "The body achieves what the mind believes.",
        "Suffer now, celebrate later.",
        "Every kilometer counts.",
        "You don't have to be great to start, but you have to start to be great.",
        "Pain is temporary, pride is forever.",
        "The miracle isn't that I finished. It's that I had the courage to start.",
        "Run the mile you're in.",
        "Strong legs, strong mind.",
        "De 10 Miles wacht. Ben jij klaar?",
        "Elke training brengt je dichter bij de finish.",
        "Vertrouw het proces.",
        "Train smart, race hard."
    ];

    async function init() {
        await Trainingen.laadVanServer();
        renderNav();
        showSection('home');
        updateQuote();
    }

    function updateQuote() {
        const el = document.getElementById('motivationalQuote');
        if (el) {
            el.textContent = quotes[Math.floor(Math.random() * quotes.length)];
        }
    }

    // Navigation
    function renderNav() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                showSection(section);
            });
        });
    }

    function showSection(section) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        const el = document.getElementById('section-' + section);
        if (el) el.classList.add('active');

        const navEl = document.querySelector(`.nav-link[data-section="${section}"]`);
        if (navEl) navEl.classList.add('active');

        switch (section) {
            case 'home': renderHome(); break;
            case 'schema': renderSchema(); break;
            case 'registreer': renderRegistreer(); break;
            case 'dashboard': renderDashboard(); break;
            case 'historie': renderHistorie(); break;
        }
    }

    // =========================================================================
    // HOME
    // =========================================================================
    function renderHome() {
        updateQuote();
        renderHomeCards();
        renderCoach();
        renderWarnings();
    }

    function renderHomeCards() {
        const all = Trainingen.getAll();
        const vandaag = new Date().toISOString().split('T')[0];

        // Laatste training
        const laatste = all.length > 0 ? all[all.length - 1] : null;
        const laatsteEl = document.getElementById('laatsteTraining');
        if (laatsteEl && laatste) {
            laatsteEl.innerHTML = `
                <div class="card-sport ${laatste.sport.toLowerCase()}">${laatste.sport}</div>
                <div class="card-type">${laatste.type}</div>
                <div class="card-stats">
                    <span><i class="fas fa-road"></i> ${laatste.afstand} km</span>
                    <span><i class="fas fa-clock"></i> ${laatste.tijdDisplay}</span>
                    <span><i class="fas fa-heartbeat"></i> ${laatste.gemHartslag} bpm</span>
                </div>
                <div class="card-date">${formatDatum(laatste.datum)}</div>
            `;
        } else if (laatsteEl) {
            laatsteEl.innerHTML = '<p class="empty-state">Nog geen trainingen geregistreerd</p>';
        }

        // Vandaag en volgende training op basis van echte datums
        const vandaagTraining = TrainingsSchema.getTrainingVandaag(SCHEMA_START_DATE);
        const volgendeTraining = TrainingsSchema.getVolgendeTraining(SCHEMA_START_DATE);

        const vandaagEl = document.getElementById('vandaagTraining');
        if (vandaagEl && vandaagTraining) {
            const zone = TrainingsSchema.getZoneBPM(vandaagTraining.zone);
            vandaagEl.innerHTML = `
                <div class="card-sport ${vandaagTraining.sport.toLowerCase()}">${vandaagTraining.sport}</div>
                <div class="card-type">${vandaagTraining.type}</div>
                <div class="card-stats">
                    <span><i class="fas fa-road"></i> ${vandaagTraining.afstand} km</span>
                    <span><i class="fas fa-clock"></i> ${vandaagTraining.duur} min</span>
                    <span><i class="fas fa-heartbeat"></i> ${zone.min}-${zone.max} bpm</span>
                </div>
                <div class="card-beschrijving">${vandaagTraining.beschrijving}</div>
                <div class="card-date">${vandaagTraining.datumDisplay} — Week ${vandaagTraining.week}</div>
            `;
        } else if (vandaagEl) {
            vandaagEl.innerHTML = '<p class="empty-state">Rustdag! Geniet ervan.</p>';
        }

        const volgendeEl = document.getElementById('volgendeTraining');
        if (volgendeEl && volgendeTraining) {
            const zone = TrainingsSchema.getZoneBPM(volgendeTraining.zone);
            volgendeEl.innerHTML = `
                <div class="card-sport ${volgendeTraining.sport.toLowerCase()}">${volgendeTraining.sport}</div>
                <div class="card-type">${volgendeTraining.type}</div>
                <div class="card-stats">
                    <span><i class="fas fa-road"></i> ${volgendeTraining.afstand} km</span>
                    <span><i class="fas fa-clock"></i> ${volgendeTraining.duur ? volgendeTraining.duur + ' min' : 'Race!'}</span>
                    <span><i class="fas fa-heartbeat"></i> ${zone.min}-${zone.max} bpm</span>
                </div>
                <div class="card-date">${volgendeTraining.datumDisplay} — Week ${volgendeTraining.week}</div>
            `;
        } else if (volgendeEl) {
            volgendeEl.innerHTML = '<p class="empty-state">Geen volgende training gevonden</p>';
        }

        // Week samenvatting
        const schemaWeek = TrainingsSchema.getCurrentWeek(SCHEMA_START_DATE);
        const weekTrainingen = Trainingen.getPerWeek(vandaag);
        const weekEl = document.getElementById('weekSamenvatting');
        if (weekEl) {
            const kmLopen = weekTrainingen.filter(t => t.sport === 'Lopen').reduce((s, t) => s + t.afstand, 0);
            const kmFietsen = weekTrainingen.filter(t => t.sport === 'Fietsen').reduce((s, t) => s + t.afstand, 0);
            const aantalTrainingen = weekTrainingen.length;

            weekEl.innerHTML = `
                <div class="week-stat"><span class="week-stat-value">${aantalTrainingen}</span><span class="week-stat-label">Trainingen</span></div>
                <div class="week-stat"><span class="week-stat-value">${kmLopen.toFixed(1)}</span><span class="week-stat-label">km Lopen</span></div>
                <div class="week-stat"><span class="week-stat-value">${kmFietsen.toFixed(1)}</span><span class="week-stat-label">km Fietsen</span></div>
                ${schemaWeek ? `<div class="week-stat"><span class="week-stat-value">W${schemaWeek.week}</span><span class="week-stat-label">${schemaWeek.thema.split(' – ')[0]}</span></div>` : ''}
            `;
        }
    }

    function renderCoach() {
        const container = document.getElementById('coachContainer');
        if (!container) return;

        const adviezen = Coach.analyseer();
        if (adviezen.length === 0) {
            container.innerHTML = '<p class="empty-state">Nog niet genoeg data voor coach-analyse.</p>';
            return;
        }

        container.innerHTML = adviezen.map(a => `
            <div class="warning-card warning-${a.type}">
                <i class="fas ${a.icon}"></i>
                <div>
                    <strong>${a.titel}</strong><br>
                    <span>${a.bericht}</span>
                </div>
            </div>
        `).join('');
    }

    function renderWarnings() {
        const container = document.getElementById('warningsContainer');
        if (!container) return;

        const warnings = Warnings.analyseer();
        if (warnings.length === 0) {
            container.innerHTML = '<p class="empty-state">Geen waarschuwingen. Alles ziet er goed uit!</p>';
            return;
        }

        container.innerHTML = warnings.map(w => `
            <div class="warning-card warning-${w.type}">
                <i class="fas ${w.icon}"></i>
                <span>${w.bericht}</span>
            </div>
        `).join('');
    }

    // =========================================================================
    // SCHEMA
    // =========================================================================
    function renderSchema() {
        const container = document.getElementById('schemaContainer');
        if (!container) return;

        const schema = TrainingsSchema.getSchemaWithDates(SCHEMA_START_DATE);
        const currentWeek = TrainingsSchema.getCurrentWeek(SCHEMA_START_DATE);
        const currentWeekNr = currentWeek ? currentWeek.week : 1;
        const vandaag = new Date().toISOString().split('T')[0];

        container.innerHTML = schema.map(week => {
            const isCurrent = week.week === currentWeekNr;
            return `
                <div class="schema-week ${isCurrent ? 'current-week' : ''}" id="schema-week-${week.week}">
                    <div class="schema-week-header" onclick="App.toggleWeek(${week.week})">
                        <div>
                            <h3>Week ${week.week} ${isCurrent ? '<span class="badge-current">NU</span>' : ''}</h3>
                            <p class="schema-thema">${week.thema} &nbsp;|&nbsp; ${week.weekStartDisplay} – ${week.weekEndDisplay}</p>
                        </div>
                        <i class="fas fa-chevron-down schema-toggle"></i>
                    </div>
                    <div class="schema-week-body ${isCurrent ? 'open' : ''}">
                        <table class="schema-table">
                            <thead>
                                <tr>
                                    <th>Datum</th>
                                    <th>Sport</th>
                                    <th>Type</th>
                                    <th>Afstand</th>
                                    <th>Duur</th>
                                    <th>Zone</th>
                                    <th>Beschrijving</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${week.trainingen.map(t => {
                                    const zone = TrainingsSchema.getZoneBPM(t.zone);
                                    const isVandaag = t.datum === vandaag;
                                    const isVerleden = t.datum < vandaag;
                                    return `
                                    <tr class="${isVandaag ? 'schema-row-today' : ''} ${isVerleden ? 'schema-row-past' : ''}">
                                        <td><strong>${t.datumDisplay}</strong>${isVandaag ? ' <span class="badge-current">VANDAAG</span>' : ''}</td>
                                        <td><span class="tag tag-${t.sport.toLowerCase()}">${t.sport}</span></td>
                                        <td>${t.type}</td>
                                        <td>${t.afstand} km</td>
                                        <td>${t.duur ? t.duur + ' min' : 'Race!'}</td>
                                        <td><span class="zone-badge" style="background:${TrainingsSchema.zones[t.zone]?.color || '#666'}">${zone.min}-${zone.max} bpm</span></td>
                                        <td class="beschrijving-cell">${t.beschrijving}</td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }).join('');
    }

    function toggleWeek(weekNr) {
        const body = document.querySelector(`#schema-week-${weekNr} .schema-week-body`);
        const toggle = document.querySelector(`#schema-week-${weekNr} .schema-toggle`);
        if (body) {
            body.classList.toggle('open');
            if (toggle) toggle.classList.toggle('rotated');
        }
    }

    // =========================================================================
    // REGISTREER
    // =========================================================================
    function renderRegistreer() {
        const form = document.getElementById('trainingForm');
        if (!form) return;

        // Set default datum to vandaag
        const datumInput = document.getElementById('inputDatum');
        if (datumInput && !datumInput.value) {
            datumInput.value = new Date().toISOString().split('T')[0];
        }

        // Sport change handler
        const sportSelect = document.getElementById('inputSport');
        const typeSelect = document.getElementById('inputType');

        if (sportSelect && typeSelect) {
            sportSelect.removeEventListener('change', updateTypeOptions);
            sportSelect.addEventListener('change', updateTypeOptions);
            updateTypeOptions();
        }

        form.onsubmit = (e) => {
            e.preventDefault();
            submitTraining();
        };
    }

    function updateTypeOptions() {
        const sport = document.getElementById('inputSport').value;
        const typeSelect = document.getElementById('inputType');

        const loopTypes = [
            { value: 'Rustige duurloop', label: 'Rustige duurloop' },
            { value: 'Tempo', label: 'Tempo' },
            { value: 'Interval', label: 'Interval' },
            { value: 'Lange duurloop', label: 'Lange duurloop' },
            { value: 'Herstelrun', label: 'Herstelrun' },
            { value: 'Race', label: 'Race / Wedstrijd' }
        ];

        const fietsTypes = [
            { value: 'Fietsduur', label: 'Duurrit' },
            { value: 'Fietsblokken', label: 'Blokken / Intervallen' },
            { value: 'Herstelrit', label: 'Herstelrit' },
            { value: 'Wedstrijd', label: 'Wedstrijd' }
        ];

        const types = sport === 'Lopen' ? loopTypes : fietsTypes;
        typeSelect.innerHTML = types.map(t => `<option value="${t.value}">${t.label}</option>`).join('');
    }

    async function submitTraining() {
        const data = {
            datum: document.getElementById('inputDatum').value,
            sport: document.getElementById('inputSport').value,
            type: document.getElementById('inputType').value,
            afstand: document.getElementById('inputAfstand').value,
            tijd: document.getElementById('inputTijd').value,
            gemHartslag: document.getElementById('inputHartslag').value,
            maxHartslag: document.getElementById('inputMaxHartslag').value,
            gevoel: document.getElementById('inputGevoel').value,
            opmerking: document.getElementById('inputOpmerking').value
        };

        if (!data.datum || !data.afstand || !data.tijd || !data.gemHartslag) {
            showNotification('Vul alle verplichte velden in.', 'error');
            return;
        }

        const training = await Trainingen.voegToe(data);
        showNotification(`Training opgeslagen! ${training.afstand} km ${training.sport} - ${training.tempo ? training.tempo.display : ''}`, 'success');

        // Reset form
        document.getElementById('trainingForm').reset();
        document.getElementById('inputDatum').value = new Date().toISOString().split('T')[0];

        // Toon resultaat
        const resultEl = document.getElementById('trainingResult');
        if (resultEl) {
            resultEl.innerHTML = `
                <div class="result-card">
                    <h4>Training geregistreerd!</h4>
                    <div class="result-grid">
                        <div class="result-item"><span class="result-label">Sport</span><span class="result-value">${training.sport}</span></div>
                        <div class="result-item"><span class="result-label">Type</span><span class="result-value">${training.type}</span></div>
                        <div class="result-item"><span class="result-label">Afstand</span><span class="result-value">${training.afstand} km</span></div>
                        <div class="result-item"><span class="result-label">Tijd</span><span class="result-value">${training.tijdDisplay}</span></div>
                        <div class="result-item"><span class="result-label">Tempo</span><span class="result-value">${training.tempo ? training.tempo.display : '-'}</span></div>
                        <div class="result-item"><span class="result-label">Snelheid</span><span class="result-value">${training.snelheid ? training.snelheid.display : '-'}</span></div>
                        <div class="result-item"><span class="result-label">Gem. HR</span><span class="result-value">${training.gemHartslag} bpm</span></div>
                        <div class="result-item"><span class="result-label">Zone</span><span class="result-value">${training.zoneNaam}</span></div>
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
        }
    }

    // =========================================================================
    // DASHBOARD
    // =========================================================================
    function renderDashboard() {
        const samenvatting = Dashboard.getSamenvatting();
        const statsEl = document.getElementById('dashboardStats');

        if (statsEl) {
            statsEl.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-chart-bar"></i></div>
                    <div class="stat-value">${samenvatting.totaal.trainingen}</div>
                    <div class="stat-label">Totaal trainingen</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon lopen"><i class="fas fa-running"></i></div>
                    <div class="stat-value">${samenvatting.lopen.km.toFixed(1)} km</div>
                    <div class="stat-label">Totaal lopen</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon fietsen"><i class="fas fa-biking"></i></div>
                    <div class="stat-value">${samenvatting.fietsen.km.toFixed(1)} km</div>
                    <div class="stat-label">Totaal fietsen</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon lopen"><i class="fas fa-stopwatch"></i></div>
                    <div class="stat-value">${samenvatting.lopen.gemTempo ? formatTempo(samenvatting.lopen.gemTempo) : '--:--'}</div>
                    <div class="stat-label">Gem. tempo lopen</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon fietsen"><i class="fas fa-tachometer-alt"></i></div>
                    <div class="stat-value">${samenvatting.fietsen.gemSnelheid ? samenvatting.fietsen.gemSnelheid.toFixed(1) + ' km/u' : '--'}</div>
                    <div class="stat-label">Gem. snelheid fietsen</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-heartbeat"></i></div>
                    <div class="stat-value">${samenvatting.lopen.gemHR || '--'} / ${samenvatting.fietsen.gemHR || '--'}</div>
                    <div class="stat-label">Gem. HR lopen / fietsen</div>
                </div>
            `;
        }

        // Render charts after a small delay to ensure canvas is ready
        setTimeout(() => Dashboard.renderAll(), 100);
    }

    // =========================================================================
    // HISTORIE
    // =========================================================================
    function renderHistorie() {
        const container = document.getElementById('historieContainer');
        if (!container) return;

        const all = Trainingen.getAll().slice().reverse();

        if (all.length === 0) {
            container.innerHTML = '<p class="empty-state">Nog geen trainingen geregistreerd. Ga naar Registreer om je eerste training in te voeren!</p>';
            return;
        }

        container.innerHTML = `
            <div class="historie-actions">
                <button class="btn btn-accent" onclick="ExportModule.exportToExcel()"><i class="fas fa-file-excel"></i> Export Excel</button>
                <button class="btn btn-secondary" onclick="ExportModule.exportToCSV()"><i class="fas fa-file-csv"></i> Export CSV</button>
                <span class="historie-count">${all.length} trainingen</span>
            </div>
            <div class="table-wrapper">
                <table class="historie-table">
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Sport</th>
                            <th>Type</th>
                            <th>Afstand</th>
                            <th>Tijd</th>
                            <th>Tempo</th>
                            <th>Snelheid</th>
                            <th>Gem. HR</th>
                            <th>Zone</th>
                            <th>Gevoel</th>
                            <th>Opmerking</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${all.map(t => `
                            <tr>
                                <td>${formatDatum(t.datum)}</td>
                                <td><span class="tag tag-${t.sport.toLowerCase()}">${t.sport}</span></td>
                                <td>${t.type}</td>
                                <td>${t.afstand} km</td>
                                <td>${t.tijdDisplay}</td>
                                <td>${t.tempo ? t.tempo.display : '-'}</td>
                                <td>${t.snelheid ? t.snelheid.display : '-'}</td>
                                <td>${t.gemHartslag} bpm</td>
                                <td><span class="zone-badge" style="background:${TrainingsSchema.zones[t.zone]?.color || '#666'}">${t.zoneNaam}</span></td>
                                <td>${t.gevoel ? renderGevoel(t.gevoel) : '-'}</td>
                                <td class="opmerking-cell">${t.opmerking || '-'}</td>
                                <td><button class="btn-delete" onclick="App.verwijderTraining('${t.id}')" title="Verwijder"><i class="fas fa-trash"></i></button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async function verwijderTraining(id) {
        if (confirm('Weet je zeker dat je deze training wilt verwijderen?')) {
            await Trainingen.verwijder(id);
            renderHistorie();
            showNotification('Training verwijderd.', 'info');
        }
    }

    // =========================================================================
    // HELPERS
    // =========================================================================
    function formatDatum(datum) {
        const d = new Date(datum);
        const dagen = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
        return `${dagen[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }

    function formatTempo(tempoWaarde) {
        const min = Math.floor(tempoWaarde);
        const sec = Math.round((tempoWaarde - min) * 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    function renderGevoel(score) {
        const colors = ['', '#f44336', '#f44336', '#FF5722', '#FF9800', '#FFC107', '#CDDC39', '#8BC34A', '#4CAF50', '#00C853', '#00E676'];
        return `<span class="gevoel-badge" style="background:${colors[score] || '#666'}">${score}</span>`;
    }

    function showNotification(message, type = 'success') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">&times;</button>`;
        container.appendChild(notification);

        setTimeout(() => notification.remove(), 4000);
    }

    return {
        init,
        showSection,
        toggleWeek,
        verwijderTraining,
        updateTypeOptions
    };
})();

// Start de app
document.addEventListener('DOMContentLoaded', App.init);

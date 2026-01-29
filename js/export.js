// =============================================================================
// EXPORT MODULE - Export naar Excel (.xlsx)
// =============================================================================

const ExportModule = (() => {

    function formatTempoForExport(tempo) {
        if (!tempo) return '';
        return tempo.display;
    }

    function formatSnelheidForExport(snelheid) {
        if (!snelheid) return '';
        return snelheid.display;
    }

    function exportToExcel() {
        const trainingen = Trainingen.getAll();
        if (trainingen.length === 0) {
            alert('Geen trainingen om te exporteren.');
            return;
        }

        const data = trainingen.map(t => ({
            'Datum': t.datum,
            'Sport': t.sport,
            'Trainingstype': t.type,
            'Afstand (km)': t.afstand,
            'Tijd': t.tijdDisplay,
            'Tempo': formatTempoForExport(t.tempo),
            'Snelheid': formatSnelheidForExport(t.snelheid),
            'Gem. hartslag': t.gemHartslag,
            'Max hartslag': t.maxHartslag || '',
            'Zone': t.zoneNaam,
            'Gevoel (1-10)': t.gevoel || '',
            'Opmerking': t.opmerking
        }));

        const ws = XLSX.utils.json_to_sheet(data);

        // Column widths
        ws['!cols'] = [
            { wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 12 },
            { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
            { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 30 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Trainingen');

        // Week stats sheet
        const weekStats = Trainingen.getWeekStats();
        if (weekStats.length > 0) {
            const weekData = weekStats.map(w => ({
                'Week start': w.weekStart,
                'Lopen km': w.lopen.km.toFixed(1),
                'Lopen tijd (min)': Math.round(w.lopen.tijd),
                'Lopen gem. HR': w.lopen.gemHartslag,
                'Lopen trainingen': w.lopen.count,
                'Fietsen km': w.fietsen.km.toFixed(1),
                'Fietsen tijd (min)': Math.round(w.fietsen.tijd),
                'Fietsen gem. HR': w.fietsen.gemHartslag,
                'Fietsen trainingen': w.fietsen.count,
                'Totaal km': w.totaal.km.toFixed(1),
                'Totaal trainingen': w.totaal.count
            }));

            const ws2 = XLSX.utils.json_to_sheet(weekData);
            ws2['!cols'] = [
                { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 16 },
                { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 18 },
                { wch: 10 }, { wch: 16 }
            ];
            XLSX.utils.book_append_sheet(wb, ws2, 'Week Overzicht');
        }

        const filename = `trainingen_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    }

    function exportToCSV() {
        const trainingen = Trainingen.getAll();
        if (trainingen.length === 0) {
            alert('Geen trainingen om te exporteren.');
            return;
        }

        const headers = ['Datum', 'Sport', 'Trainingstype', 'Afstand (km)', 'Tijd', 'Tempo', 'Snelheid', 'Gem. hartslag', 'Max hartslag', 'Zone', 'Gevoel', 'Opmerking'];
        const rows = trainingen.map(t => [
            t.datum, t.sport, t.type, t.afstand, t.tijdDisplay,
            formatTempoForExport(t.tempo), formatSnelheidForExport(t.snelheid),
            t.gemHartslag, t.maxHartslag || '', t.zoneNaam, t.gevoel || '', `"${t.opmerking}"`
        ]);

        const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `trainingen_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    return { exportToExcel, exportToCSV };
})();

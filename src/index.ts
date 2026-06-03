import { CanvasLocal } from './canvasLocal.js';

export interface BarData {
    name: string;
    value: number;
    color: string;
}

let canvas: HTMLCanvasElement;
let graphics: CanvasRenderingContext2D;

window.onload = () => {
    canvas = <HTMLCanvasElement>document.getElementById('circlechart');
    graphics = canvas.getContext('2d') as CanvasRenderingContext2D;

    const miCanvas: CanvasLocal = new CanvasLocal(graphics, canvas);

    const barsList = document.getElementById('barsList') as HTMLDivElement;
    const addBarBtn = document.getElementById('addBarBtn') as HTMLButtonElement;

    // Estado local principal: Lista de objetos de barras
    const barsData: BarData[] = [
        { name: 'Alpha', value: 35, color: '#000000' }, // Negro
        { name: 'Beta', value: 80, color: '#552200' },  // Oscuro
        { name: 'Gamma', value: 55, color: '#aa5500' }, // Medio
        { name: 'Delta', value: 100, color: '#ff8800' } // Naranja
    ];

    /**
     * Limpia y actualiza el Canvas 2D
     */
    const updateChart = () => {
        miCanvas.clear();
        miCanvas.drawBarChart(barsData);
    };

    /**
     * Dibuja los controles HTML para manejar dinámicamente cada barra
     */
    const renderControls = () => {
        barsList.innerHTML = ''; // Vaciar la lista existente

        barsData.forEach((bar, index) => {
            const row = document.createElement('div');
            row.className = 'd-flex align-items-center gap-2 border-bottom pb-2';

            // Creamos los inputs (Color nativo, Nombre texto, Valor numérico)
            row.innerHTML = `
                <input type="color" class="form-control form-control-color p-0 shadow-sm" style="width: 32px; height: 32px;" value="${bar.color}" data-idx="${index}" data-field="color" title="Elige un color">
                <input type="text" class="form-control form-control-sm text-dark shadow-sm" style="flex: 1;" value="${bar.name}" data-idx="${index}" data-field="name" placeholder="Etiq.">
                <input type="number" class="form-control form-control-sm text-center shadow-sm text-primary fw-bold" style="width: 55px;" value="${bar.value}" data-idx="${index}" data-field="value">
                <button class="btn btn-sm btn-outline-danger btn-delete shadow-sm" data-idx="${index}">X</button>
            `;
            barsList.appendChild(row);
        });

        // Enganchar el evento 'input' a los nuevos inputs para reactividad en "Tiempo Real"
        barsList.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e: Event) => {
                const target = e.target as HTMLInputElement;
                const idx = parseInt(target.getAttribute('data-idx')!);
                const field = target.getAttribute('data-field')!;

                // Actualizar el estado central directamente
                if (field === 'value') {
                    barsData[idx].value = parseFloat(target.value) || 0;
                } else if (field === 'name') {
                    barsData[idx].name = target.value;
                } else if (field === 'color') {
                    barsData[idx].color = target.value;
                }

                updateChart(); // Reflejar al canvas inmediatamente
            });
        });

        // Botones para borrar una fila específica
        barsList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e: Event) => {
                const target = e.currentTarget as HTMLButtonElement;
                const idx = parseInt(target.getAttribute('data-idx')!);
                barsData.splice(idx, 1); // Remover del array
                renderControls(); // Reconstruir la UI
                updateChart(); // Redibujar Canvas
            });
        });
    };

    // Evento principal para agregar la nueva barra por defecto
    addBarBtn.addEventListener('click', () => {
        barsData.push({
            name: `Ex-${barsData.length + 1}`,
            value: Number((Math.random() * 80 + 10).toFixed(0)), // Valor aleatorio entre 10 y 90
            color: '#f58231' // Naranja por defecto
        });
        renderControls();
        updateChart();
    });

    // Arranque inicial
    renderControls();
    updateChart();
};
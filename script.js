// Cálculos

const depositoInicial = document.getElementById("depositoInicial");
const tasaInteres = document.getElementById("tasaInteres");
const anios = document.getElementById("anios");
const frecuencia = document.getElementById("frecuencia");
const aportaciones = document.getElementById("aportaciones");

const resultadoInicial = document.getElementById("resultadoInicial");
const resultadoAdicionales = document.getElementById("resultadoAdicionales");
const resultadoInteres = document.getElementById("resultadoInteres");
const resultadoTotal = document.getElementById("resultadoTotal");
        
const ctx = document.getElementById('grafica').getContext('2d');
let chart;

// Función para formatear números con coma de miles y dos decimales
function formatoNumero(numero) {
    return new Intl.NumberFormat('es-MX', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
    }).format(numero);
}

// Función para limpiar el valor de los inputs
function limpiarValor(valor) {
    return parseFloat(valor.replace(/,/g, '')) || 0;
}

// Función para formatear el valor del input mientras se escribe
function formatoInput(event) {
    let valor = event.target.value.replace(/[^0-9]/g, '');
    if (valor === '') {
        event.target.value = '';
    } else {
        event.target.value = new Intl.NumberFormat('es-MX').format(valor);
    }
    // Disparar las funciones de cálculo
    calcular();
    if (event.target.closest('#resumen-presupuesto')) {
        calcularPresupuestoAnual();
    }
}

// Nueva función global para aplicar el valor de Enero a todos los meses
function aplicarValorATodosLosMeses() {
    const clasesDeFilas = ['ingresos', 'gastos', 'ahorro'];
    const tiposDeGasto = ['corrientes', 'creditos', 'diversion'];

    clasesDeFilas.forEach(clase => {
        if (clase === 'gastos') {
            tiposDeGasto.forEach(tipo => {
                const inputsPorTipo = document.querySelectorAll(`.monto-input.gastos[data-tipo="${tipo}"]`);
                if (inputsPorTipo.length > 0) {
                    const valorEnero = inputsPorTipo[0].value;
                    for (let i = 1; i < inputsPorTipo.length; i++) {
                        inputsPorTipo[i].value = valorEnero;
                    }
                }
            });
        } else {
            const inputsFila = document.querySelectorAll(`.monto-input.${clase}`);
            if (inputsFila.length > 0) {
                const valorEnero = inputsFila[0].value;
                for (let i = 1; i < inputsFila.length; i++) {
                    inputsFila[i].value = valorEnero;
                }
            }
        }
    });
    calcularPresupuestoAnual();
}

function calcularPresupuestoAnual() {
    const numMeses = 12;
    let totales = {
        ingresos: [], gastosTotal: [], sobra: [],
        promedioIngresos: 0, promedioGastos: 0, promedioSobra: 0
    };

    for (let i = 0; i < numMeses; i++) {
        const salario = limpiarValor(document.querySelector(`.monto-input.ingresos[data-mes="${i}"]`).value);
        
        let gastosMes = 0;
        document.querySelectorAll(`.monto-input.gastos[data-mes="${i}"]`).forEach(input => {
            gastosMes += limpiarValor(input.value);
        });

        const ahorroDeseado = limpiarValor(document.querySelector(`.monto-input.ahorro[data-mes="${i}"]`).value);
        gastosMes += ahorroDeseado;

        const ingresosQueSobran = salario - gastosMes;
        
        totales.ingresos.push(salario);
        totales.gastosTotal.push(gastosMes);
        totales.sobra.push(ingresosQueSobran);

        document.getElementById(`ingresos-total-${i}`).value = formatoNumero(salario);
        document.getElementById(`gastos-total-${i}`).value = formatoNumero(gastosMes);
        document.getElementById(`sobra-total-${i}`).value = formatoNumero(ingresosQueSobran);
    }

    const promedio = (arr) => arr.length > 0 ? arr.reduce((acc, curr) => acc + curr, 0) / arr.length : 0;
    
    totales.promedioIngresos = promedio(totales.ingresos);
    totales.promedioGastos = promedio(totales.gastosTotal);
    totales.promedioSobra = promedio(totales.sobra);

    document.getElementById('promedio-resumen-ingresos').value = formatoNumero(totales.promedioIngresos);
    document.getElementById('promedio-resumen-gastos').value = formatoNumero(totales.promedioGastos);
    document.getElementById('promedio-resumen-sobra').value = formatoNumero(totales.promedioSobra);
}

function reiniciarGrafica() {
    // Reiniciar inputs de la calculadora
    depositoInicial.value = '0';
    tasaInteres.value = '7';
    anios.value = '10';
    frecuencia.value = '1';
    aportaciones.value = '0';
    
    // Recalcular para actualizar la gráfica y los resultados
    calcular();
    
    // Re-formatear inputs al cargar la página
    formatoInput({ target: depositoInicial });
    formatoInput({ target: aportaciones });
}

function reiniciarTablas() {
    // Reiniciar inputs de ingresos, gastos y ahorro
    document.querySelectorAll('.monto-input').forEach(input => {
        input.value = '0';
    });
    
    // Recalcular para actualizar los resúmenes y promedios
    calcularPresupuestoAnual();
}

function calcular() {
    const P = limpiarValor(depositoInicial.value);
    const r = (parseFloat(tasaInteres.value) || 0) / 100;
    const n = parseInt(frecuencia.value);
    const t = parseFloat(anios.value) || 0;
    const A = limpiarValor(aportaciones.value);

    let saldo = P;
    let interesTotal = 0;
    let adicionales = 0;

    const labels = [];
    const dataInicial = [];
    const dataAdicionales = [];
    const dataInteres = [];

    let tempInicial = [];
    let tempAdicionales = [];
    let tempInteres = [];

    for (let i = 1; i <= t * n; i++) {
        const interes = saldo * (r / n);
        saldo += interes + A;
        interesTotal += interes;
        adicionales += A;

        if (i % n === 0) {
            labels.push(`Año ${i / n}`);
            tempInicial.push(P);
            tempAdicionales.push(adicionales);
            tempInteres.push(interesTotal);
        }
    }
    
    for (let i = 0; i < labels.length; i++) {
        dataInicial.push(tempInicial[i]);
        dataAdicionales.push(tempAdicionales[i]);
        dataInteres.push(tempInteres[i]);
    }
    
    // Update the new and existing elements
    resultadoInicial.innerText = `$${formatoNumero(P)}`;
    resultadoAdicionales.innerText = `$${formatoNumero(adicionales)}`;
    resultadoInteres.innerText = `$${formatoNumero(interesTotal)}`;
    resultadoTotal.innerText = `$${formatoNumero(saldo)}`;

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Depósito inicial',
                    data: dataInicial,
                    backgroundColor: 'rgba(74, 105, 189, 0.8)'
                },
                {
                    label: 'Depósitos adicionales acumulados',
                    data: dataAdicionales,
                    backgroundColor: 'rgba(46, 204, 113, 0.8)'
                },
                {
                    label: 'Interés acumulado',
                    data: dataInteres,
                    backgroundColor: 'rgba(251, 197, 49, 0.8)'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { 
                    stacked: true,
                    ticks: {
                        color: '#ffffff'
                    }
                },
                y: { 
                    stacked: true,
                    beginAtZero: true,
                    ticks: { 
                        callback: (value) => `$${formatoNumero(value)}`,
                        color: '#ffffff'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff' // Color de las letras de las etiquetas
                    }
                }
            }
        }
    });
}

// Event listeners para los inputs de ambas secciones
depositoInicial.addEventListener("input", formatoInput);
aportaciones.addEventListener("input", formatoInput);

document.querySelectorAll('.monto-input').forEach(input => {
    input.addEventListener('input', formatoInput);
});

[tasaInteres, anios, frecuencia].forEach(input => {
    input.addEventListener("input", calcular);
});

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("scroll", () => {
    const btn = document.getElementById("toTop");
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
        btn.style.display = "block";
    } else {
        btn.style.display = "none";
    }
});

// Llamada inicial para mostrar los valores por defecto
calcular();
calcularPresupuestoAnual();
// Formatea los inputs al cargar la página
document.querySelectorAll('.monto-input').forEach(input => {
    formatoInput({ target: input });
});
formatoInput({ target: depositoInicial });
formatoInput({ target: aportaciones });
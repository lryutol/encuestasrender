// La URL de tu backend en Render. Se agregará automáticamente al desplegar.
const API_BASE_URL = window.location.origin;

// Función para enviar un voto
async function votar(candidatoId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ candidatoId: candidatoId })
        });
        const result = await response.json();
        if (response.ok) {
            alert('¡Voto registrado con éxito!');
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        alert('Error de conexión con el servidor.');
    }
}

// Función para obtener y mostrar los resultados
async function obtenerResultados() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/results`);
        if (!response.ok) {
            throw new Error('No se pudo obtener los resultados.');
        }
        const resultados = await response.json();
        
        // Renderizar la tabla
        const tableBody = document.getElementById('results-table-body');
        if (tableBody) {
            tableBody.innerHTML = '';
            resultados.forEach(candidato => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="mdl-data-table__cell--non-numeric">${candidato.nombre}</td>
                    <td class="mdl-data-table__cell--non-numeric">${candidato.cantidad_votos}</td>
                    <td style="text-align: right;">${candidato.porcentaje}%</td>
                `;
                tableBody.appendChild(row);
            });
        }
        
        // Renderizar el gráfico
        const ctx = document.getElementById('results-chart');
        if (ctx) {
            const labels = resultados.map(r => r.nombre);
            const data = resultados.map(r => r.cantidad_votos);
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Votos',
                        data: data,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error al obtener los resultados:', error);
    }
}

// Función para reiniciar los votos
async function reiniciarVotos() {
    if (confirm('¿Estás seguro de que quieres reiniciar todos los votos? Esta acción es irreversible.')) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/votes/reset`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert('Votos reiniciados con éxito.');
                window.location.reload();
            } else {
                alert('Error al reiniciar los votos.');
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            alert('Error de conexión con el servidor.');
        }
    }
}

// Lógica de carga de páginas
document.addEventListener('DOMContentLoaded', () => {
    // Si estamos en la página de votación
    if (document.querySelector('button[data-id]')) {
        document.querySelectorAll('button[data-id]').forEach(button => {
            button.addEventListener('click', (event) => {
                const candidatoId = event.target.dataset.id;
                votar(candidatoId);
            });
        });
    }

    // Si estamos en la página de resultados
    if (document.getElementById('results-table-body')) {
        obtenerResultados();
        document.getElementById('reset-votes-btn').addEventListener('click', reiniciarVotos);
    }
});
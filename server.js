const express = require('express');
const { Client } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// Línea de código para servir los archivos del frontend
app.use(express.static('../frontend'));
// ----------------------------------------------------

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function connectAndSetupDb() {
    try {
        await client.connect();
        console.log("Conectado a PostgreSQL");

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS votos (
                id_candidato VARCHAR(255) PRIMARY KEY,
                nombre VARCHAR(255),
                partido VARCHAR(255),
                cantidad_votos INTEGER DEFAULT 0
            );
        `;
        await client.query(createTableQuery);
        console.log("Tabla 'votos' verificada/creada");

        const insertCandidatesQuery = `
            INSERT INTO votos (id_candidato, nombre, partido) VALUES
            ('jorge-quiroga', 'Jorge Quiroga Ramírez', 'Alianza Libre'),
            ('samuel-doria', 'Samuel Doria Medina', 'Alianza Unidad'),
            ('rodrigo-paz', 'Rodrigo Paz Pereira', 'Partido Demócrata Cristiano'),
            ('manfred-reyes', 'Manfred Reyes Villa', 'APB Súmate'),
            ('andronico-rodriguez', 'Andrónico Rodríguez', 'Alianza Popular'),
            ('johnny-fernandez', 'Jhonny Fernández', 'Unidad Cívica Solidaridad'),
            ('eduardo-del-castillo', 'Eduardo Del Castillo', 'Movimiento al Socialismo'),
            ('pavel-aracena', 'Pavel Aracena Vargas', 'Alianza Libertad y Progreso')
            ON CONFLICT (id_candidato) DO NOTHING;
        `;
        await client.query(insertCandidatesQuery);
        console.log("Candidatos insertados o ya existentes.");

    } catch (err) {
        console.error("Error al conectar a la base de datos:", err);
    }
}

connectAndSetupDb();

app.post('/api/vote', async (req, res) => {
    const { candidatoId } = req.body;
    if (!candidatoId) {
        return res.status(400).json({ error: 'Falta el ID del candidato' });
    }

    try {
        const result = await client.query('UPDATE votos SET cantidad_votos = cantidad_votos + 1 WHERE id_candidato = $1 RETURNING *', [candidatoId]);
        if (result.rowCount > 0) {
            res.json({ message: 'Voto registrado con éxito', candidato: result.rows[0] });
        } else {
            res.status(404).json({ error: 'Candidato no encontrado' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/results', async (req, res) => {
    try {
        const totalVotesResult = await client.query('SELECT SUM(cantidad_votos) AS total_votos FROM votos');
        const totalVotes = totalVotesResult.rows[0].total_votos || 0;

        const results = await client.query('SELECT * FROM votos ORDER BY cantidad_votos DESC');

        const formattedResults = results.rows.map(row => {
            const porcentaje = totalVotes > 0 ? (row.cantidad_votos / totalVotes) * 100 : 0;
            return {
                ...row,
                porcentaje: parseFloat(porcentaje.toFixed(2))
            };
        });

        res.json(formattedResults);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/votes/reset', async (req, res) => {
    try {
        await client.query('UPDATE votos SET cantidad_votos = 0');
        res.json({ message: 'Todos los votos han sido reiniciados.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Servidor de backend corriendo en el puerto ${port}`);
});

const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');

//Jala datos del .env
require('dotenv').config();

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const password = process.env.DB_PASS;
const database = process.env.DB_DATABASE;
const port = process.env.DB_PORT;

//Conexion con la BD mysql
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
    port: port
});

connection.connect((error) => {
    if (error) {
        console.error('Error connecting: ' + error.stack);
        return;
    }
    console.log('Connected as id ' + connection.threadId);
});

app.use(cors());
app.use(bodyParser.json()); // Añadir este middleware para parsear JSON

app.post('/', (req, res) => {
    const idUsuario = req.body.idUsuario;

    if (!idUsuario) {
        res.status(400).send({ success: false, message: 'Faltan datos requeridos' });
        return;
    }

    connection.query('SELECT * FROM DataUser WHERE id = ?', [idUsuario], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            res.status(500).send({ success: false, message: 'Error al ejecutar la consulta' });
            return;
        }
        
        if (results.length == 0) {
            res.send({ success: false, message: 'Usuario no encontrado' });
        } else {
            res.send({ success: true, message: 'El usuario ya existe', usuario: results[0]});
        }
    });
});

app.post('/register', (req, res) => {
    const profile = req.body.profile;
    const career = req.body.career;
    const idUsuario = req.body.idUsuario;

    if (!profile || !career || !idUsuario) {
        res.status(400).send({ success: false, message: 'Faltan datos requeridos' + JSON.stringify(req.body)});
        return;
    }
    connection.query('INSERT INTO DataUser (id, profile, career) VALUES (?, ?, ?)', [idUsuario, profile, career], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            res.status(500).send({ success: false, message: 'Error al ejecutar la consulta de inserción' });
            return;
        }
        res.send({ success: true, message: 'Usuario creado' });
    });
});

app.post('/activitie', (req, res) => {
    const { idUsuario, type, description, observations, title, subject} = req.body;

    if (!idUsuario || !type || !description || !observations) {
        res.status(400).send({ success: false, message: 'Faltan datos requeridos' });
        return;
    }

    connection.query(
        'INSERT INTO Activities (id_user, type, description, observations, title, subject) VALUES (?, ?, ?, ?, ?, ?)', 
        [idUsuario, type, description, observations, title, subject], 
        (error, results) => {
            if (error) {
                console.error('Error executing query: ' + error.stack);
                res.status(500).send({ success: false, message: 'Error al ejecutar la consulta' });
                return;
            }
            res.send({ success: true, message: 'Actividad creada' });
        }
    );
});


app.post('/Activities', (req, res) => {
    const idUsuario = req.body.idUsuario;

    if (!idUsuario) {
        res.status(400).send({ success: false, message: 'Faltan datos requeridos: idUsuario' });
        return;
    }

    connection.query('SELECT * FROM Activities WHERE id_user = ?', [idUsuario], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            res.status(500).send({ success: false, message: 'Error al ejecutar la consulta' });
            return;
        }
        res.send({ success: true, data: results });
        
    });
});

app.get('/activitie/:id', (req, res) => {
    const activityId = req.params.id;

    connection.query('SELECT * FROM Activities WHERE id = ?', [activityId], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            res.status(500).send({ success: false, message: 'Error al ejecutar la consulta' });
            return;
        }

        if (results.length === 0) {
            res.status(404).send({ success: false, message: 'Actividad no encontrada' });
            return;
        }

        res.send({ success: true, data: results[0] });
    });
});

app.delete('/activitie/:id', (req, res) => {
    const activityId = req.params.id;

    connection.query('DELETE FROM Activities WHERE id = ?', [activityId], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            res.status(500).send({ success: false, message: 'Error al ejecutar la consulta' });
            return;
        }

        if (results.affectedRows === 0) {
            res.status(404).send({ success: false, message: 'Actividad no encontrada' });
            return;
        }

        res.send({ success: true, message: 'Actividad eliminada' });
    });
});


app.post('/activitie/answer/:id', (req, res) => {
    const answer = req.body.answer;
    const points = req.body.points;
    const activityId = req.params.id;

    if (!answer) {
        res.status(400).send({ success: false, message: 'Falta el campo answer' });
        return;
    }
    if (!points) {
        res.status(400).send({ success: false, message: 'Falta el campo points' });
        return;
    }

    connection.query('UPDATE Activities SET answerGPT = ?, points = ? WHERE id = ?', [answer, points, activityId], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            res.status(500).send({ success: false, message: 'Error al ejecutar la consulta' });
            return;
        }

        if (results.affectedRows === 0) {
            res.status(404).send({ success: false, message: 'Actividad no encontrada' });
            return;
        }

        res.send({ success: true, message: 'Respuesta actualizada' });
    });
});

app.post('/unlock/:id', (req, res) => {
    const { idUsuario, points } = req.body;
    const avatarId = req.params.id;

    if (!idUsuario || !points) {
        res.status(400).send({ success: false, message: 'Faltan datos requeridos: idUsuario o points' });
        return;
    }

    connection.query('INSERT INTO Avatars (id_user, id_avatar) VALUES (?, ?)', [idUsuario, avatarId], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            res.status(500).send({ success: false, message: 'Error al ejecutar la consulta de inserción' });
            return;
        }

        connection.query('UPDATE DataUser SET points = points - ? WHERE id = ?', [points, idUsuario], (error, results) => {
            if (error) {
                console.error('Error executing query: ' + error.stack);
                res.status(500).send({ success: false, message: 'Error al ejecutar la consulta de actualización' });
                return;
            }

            if (results.affectedRows === 0) {
                res.status(404).send({ success: false, message: 'Usuario no encontrado' });
                return;
            }

            res.send({ success: true, message: 'Avatar desbloqueado' });
        });
    });
});

//Completa la actividad y agrega los puntos al usuario, los puntos a sumar se obtienen de una consulta a la actividad
app.post('/activitie/complete/:id', (req, res) => {
    const idUsuario = req.body.idUsuario;
    const activityId = req.params.id;

    if (!idUsuario) {
        res.status(400).send({ success: false, message: 'Faltan datos requeridos: idUsuario' });
        return;
    }

    connection.query('SELECT points FROM Activities WHERE id = ?', [activityId], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            res.status(500).send({ success: false, message: 'Error al ejecutar la consulta' });
            return;
        }

        if (results.length === 0) {
            res.status(404).send({ success: false, message: 'Actividad no encontrada' });
            return;
        }

        const points = results[0].points;
        connection.query('UPDATE Activities SET completed = 1 WHERE id = ?', [activityId], (error, results) => {
            if (error) {
                console.error('Error executing query: ' + error.stack);
                res.status(500).send({ success: false, message: 'Error al ejecutar la consulta de actualización' });
                return;
            }
        }
        );
        connection.query('UPDATE DataUser SET points = points + ? WHERE id = ?', [points, idUsuario], (error, results) => {
            if (error) {
                console.error('Error executing query: ' + error.stack);
                res.status(500).send({ success: false, message: 'Error al ejecutar la consulta de actualización' });
                return;
            }

            if (results.affectedRows === 0) {
                res.status(404).send({ success: false, message: 'Usuario no encontrado' });
                return;
            }

            res.send({ success: true, message: 'Actividad completada' });
        });
    });
});


app.post('/puntos', (req, res) => {
    const idUsuario = req.body.idUsuario;

    if (!idUsuario) {
        res.status(400).send({ success: false, message: 'Faltan datos requeridos: idUsuario' });
        return;
    }

    connection.query('SELECT points FROM DataUser WHERE id = ?', [idUsuario], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            res.status(500).send({ success: false, message: 'Error al ejecutar la consulta' });
            return;
        }

        if (results.length === 0) {
            res.status(404).send({ success: false, message: 'Usuario no encontrado' });
            return;
        }

        res.send({ success: true, data: results });
    });
});

app.post('/perfil', (req, res) => {
    const idUsuario = req.body.idUsuario;

    if (!idUsuario) {
        res.status(400).send({ success: false, message: 'Faltan datos requeridos: idUsuario' });
        return;
    }

    connection.query('SELECT * FROM DataUser WHERE id = ?', [idUsuario], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            res.status(500).send({ success: false, message: 'Error al ejecutar la consulta' });
            return;
        }

        if (results.length === 0) {
            res.status(404).send({ success: false, message: 'Usuario no encontrado' });
            return;
        }

        res.send({ success: true, data: results[0] });
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
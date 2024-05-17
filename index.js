const express = require('express');
const cors = require('cors');
const app = express();
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
app.post('/', (req, res) => {
    connection.query('SELECT * FROM DataUser WHERE id = ?', [req.body.idUsuario], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            return;
        }
        if(results.length == 0){
            connection.query('INSERT INTO DataUser (id, profile, career) VALUES (?, ?, ?)', [req.body.idUsuario, req.body.profile, req.body.career], (error, results) => {
                if (error) {
                    console.error('Error executing query: ' + error.stack);
                    return;
                }
            });
            res.send({success:true, message: 'Usuario creado'});
        }
    });
        res.send({success:true, message: 'El usuario ya existe'});
    }
);

app.post('/activitie', (req, res) => {
    connection.query('INSERT INTO activities (id_user, type, description, observations, points) VALUES (?, ?, ?, ?, ?)', [req.body.idUsuario, req.body.type, req.body.description, req.body.observations, req.body.points], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            return;
        }
        res.send({success:true, message: 'Actividad creada'});
    });
});

app.get('/activities', (req, res) => {
    connection.query('SELECT * FROM activities WHERE id_user = ?', [req.query.idUsuario], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            return;
        }
        res.send(results);
    });
});

app.get('/activitie/:id', (req, res) => {
    connection.query('SELECT * FROM activities WHERE id = ?', [req.params.id], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            return;
        }
        res.send(results);
    });
});

app.delete('/activitie/:id', (req, res) => {
    connection.query('DELETE FROM activities WHERE id = ?', [req.params.id], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            return;
        }
        res.send({success:true, message: 'Actividad eliminada'});
    });
});

app.post('/activitie/answer/:id', (req, res) => {
    connection.query('UPDATE activities SET answerGPT = ? WHERE id = ?', [req.body.answer, req.params.id], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            return;
        }
        res.send({success:true, message: 'Respuesta actualizada'});
    });
});

app.post('/unlock/:id', (req, res) => {
    connection.query('INSERT INTO Avatars (id_user, id_avatar) VALUES (?, ?)', [req.body.idUsuario, req.params.id], (error, results) => {
        if (error) {
            console.error('Error executing query: ' + error.stack);
            return;
        }
        connection.query('UPDATE DataUser SET points = points - ? WHERE id = ?', [req.body.points, req.body.idUsuario], (error, results) => {
            if (error) {
                console.error('Error executing query: ' + error.stack);
                return;
            }
        });
        res.send({success:true, message: 'Avatar desbloqueado'});
    });
});
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
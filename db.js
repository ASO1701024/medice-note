const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: '',
    port: 3306,
    user: '',
    password: '',
    database: ''
});

module.exports = connection;
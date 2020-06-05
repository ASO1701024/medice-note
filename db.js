const mysql = require('mysql2/promise');
const connection = mysql.createPool({
    host: '',
    port: 3306,
    user: '',
    password: '',
    database: ''
});

module.exports = connection;
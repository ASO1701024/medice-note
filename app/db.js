const mysql = require('mysql2/promise');
const config = require('../config.json');

const connection = mysql.createPool(config.db);

module.exports = connection;
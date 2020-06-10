const nodeMailer = require('nodemailer');
const config = require('../config.json');

const transporter = nodeMailer.createTransport(config.mail);

module.exports = transporter;

const nodeMailer = require('nodemailer');

const transporter = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'medice.note@gmail.com',
        pass: ''
    }
});

module.exports = transporter;

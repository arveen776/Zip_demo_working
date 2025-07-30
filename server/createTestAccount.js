const nodemailer = require('nodemailer');

nodemailer.createTestAccount((err, account) => {
    if (err) {
        console.error('Failed to create a testing account. ' + err.message);
        return process.exit(1);
    }

    console.log('Credentials obtained, add the following to your .env file:');
    console.log(`EMAIL_HOST="${account.smtp.host}"`);
    console.log(`EMAIL_PORT=${account.smtp.port}`);
    console.log(`EMAIL_USER="${account.user}"`);
    console.log(`EMAIL_PASS="${account.pass}"`);
});

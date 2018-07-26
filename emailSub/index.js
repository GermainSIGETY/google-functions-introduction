var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'superSender@gmail.com',
        pass: 'changeMe'
    }
});

exports.emailSub = (event, callback) => {

    const message = event.data;
    const eventRawData = Buffer.from(message.data, 'base64').toString();
    const publishedMessage = JSON.parse(eventRawData);
    const setup = publishedMessage.setup;
    const punchline = publishedMessage.punchline;

    const mailOptions = {
        from: 'sender@email.com', // sender address
        to: 'bestBoo@gmail.com', // list of receivers
        subject: 'hey listen', // Subject line
        html: `${setup} :</p><p>${punchline}</p>`// plain text body
    };

    transporter.sendMail(mailOptions, function (err, info) {
        if (err)
            console.log(err)
        else
            console.log(info);
    });

    callback();
};

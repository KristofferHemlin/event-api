const nodemailer = require("nodemailer");

export const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const resetPasswordTemplate = (user, url) => {
    const from = `'Eventappen' <noreply@eventappen.se>`;
    const to = user.email;
    const subject = "Återställa lösenord";

    const html = `<h1>Hejsan!</h1>
    <p>Detta är ett test och du kan bortse från detta mail.</p>
    <p>Du kan testa att klicka på: </p>
    <a href=${url}>länken här</a>`;
    
    return {from, to, subject, html}
}
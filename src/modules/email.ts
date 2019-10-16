const nodemailer = require("nodemailer");

export const transporter = nodemailer.createTransport({
    service: "Outlook",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const resetPasswordTemplate = (user, url) => {
    const from = `'Kablaam' <${process.env.EMAIL_USER}>`;
    const to = user.email;
    const subject = "Password reset";
    const html = resetPasswordHtml(user, url);
    return {from, to, subject, html}
}

const resetPasswordHtml = (user, url) => {
    return `
        <p style="font-family: Arial,sans-serif;
        font-size: 12px;">${user.firstName}, did you forget your password? </br> No worries, click the link below to make a new one:</p>
        <a href=${url}
            style="Margin:0; 
            display:inline-block;
            font-family:Arial,sans-serif;
            font-size:13px;">Reset password</a>
        <p style="font-family: Arial,sans-serif;
        font-size: 12px;">Happy Kablaaming!</p>
        <p style="font-size: 10px;">P.S. If you did not request a password reset you do not need to do anything.</p>`   
}
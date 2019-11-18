export function sendMail(message) {
    const sgMail  = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    return sgMail.send(message);    
}

export const resetPasswordTemplate = (user, url) => {
    const from = `Zingtly <noreply@zingtly.com>`;  // Since sendgrid is used, the email address can be anythingish
    const to = user.email;
    const subject = "Password reset";
    const html = resetPasswordHtml(user, url);
    const text = resetPasswordText(user, url);
    return {from, to, subject, html, text}
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
        <p style="font-family: Arial,sans-serif;font-size: 12px;">
            (For the link to work properly, you need to open it from the phone where the app is installed.)    
        </p>
        <p style="font-family: Arial,sans-serif;font-size: 12px;">
            If you have any other problems or questions, please contact <a href=mailto:${process.env.EMAIL_USER}>${process.env.EMAIL_USER}</a>.</p>
        <p style="font-family: Arial,sans-serif;
        font-size: 12px;">Ciao!</p>
        <p style="font-size: 10px;">P.S. If you did not request this email you can discard this message.</p>`   
}

const resetPasswordText = (user, url) => {
    return `${user.firstName}, did you forget your password? No worries, visit the link below to make a new one:\n\n${url}.\n\nIf you have any other problems or questions, please contact ${process.env.EMAIL_USER}.\n\nCiao!\n\nP.S. If you did not request this email you can discard this message.`
}

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
    return `<!DOCTYPE html>
    <html>
    <head>
    <style>
    p  {
      font-family: Arial,sans-serif;
      font-size: 12px;
    }
    </style>
    </head>
    <body>
        <p>${user.firstName}, did you forget your password? No worries, click the button below to make a new one.</p>
        <table>
            <tr style="padding:0;vertical-align:top">
                <td style="
                    background:#4a90e2;
                    border-radius:2px;
                    padding:0;">
                    <a href="https://www.claremont.se/" 
                    style="Margin:0;
                    color:#fff;
                    display:inline-block;
                    font-family:Arial,sans-serif;
                    font-size:13px;
                    font-weight:500;
                    line-height:24px;
                    padding:4px 8px 4px 8px;
                    text-decoration:none">Reset password</a>
                </td>
            </tr>
        </table>
        <p>We wish you a fun event!</p>
        <p style="font-size: 10px;">P.S. If you did not request a password reset, you do not need to do anything.</p>
    </body>
    </html>`   
}
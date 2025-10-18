import transporter from "../config/email.js";

export default class Mailer {
  static async sendVerifyEmailMail(token, to) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: "Verifica tu correo Sistema Bovino",
        html: `<!DOCTYPE html>
<html>
  <body>
    <h1>Bienvenido al Sistema Bovino</h1>
    <p>Para activar tu cuenta confirma tu correo:</p>
    <a href="http://localhost:3000/api/users/verify_email?token=${token}">
      Confirmar Email
    </a>
  </body>
</html>`
      });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
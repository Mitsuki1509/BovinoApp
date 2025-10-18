import { OAuth2Client } from "google-auth-library";
import prisma from "../database.js";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";

const { AuthorizationCode } = await import("simple-oauth2");

const client = new AuthorizationCode({
  client: {
    id: process.env.GOOGLE_CLIENT_ID,
    secret: process.env.GOOGLE_CLIENT_SECRET
  },
  auth: {
    tokenHost: "https://oauth2.googleapis.com",
    authorizePath: "https://accounts.google.com/o/oauth2/auth",
    tokenPath: "/token"
  }
});

const redirectUri = 'http://localhost:3000/api/users/auth/google/callback';

export default class UserController {

  static async login(req, res) {
    const { email, password } = req.body;

    try {
      const usuario = await prisma.usuarios.findUnique({
        where: { correo: email },
        include: {
          rol: true,
          finca: true
        }
      });

      if (!usuario) {
        return res.status(401).json({
          ok: false,
          msg: "Usuario no encontrado"
        });
      }

      if (!usuario.verificado) {
        return res.status(401).json({
          ok: false,
          msg: "Usuario no verificado. Por favor verifica tu correo electrónico."
        });
      }

      const isMatch = await bcrypt.compare(password, usuario.contraseña);

      if (!isMatch) {
        return res.status(401).json({
          ok: false,
          msg: "Contraseña incorrecta"
        });
      }

      const jwtToken = JWT.sign(
        {
          usuarioId: usuario.usuario_id,
          rol: usuario.rol?.nombre,
          nombre: usuario.nombre
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '7d' }
      );

      res.cookie('token', jwtToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        ok: true,
        msg: "Usuario autenticado correctamente",
        data: {
          usuario_id: usuario.usuario_id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          verificado: usuario.verificado,
          rol: usuario.rol?.nombre,
          finca: usuario.finca
        }
      });

    } catch (error) {
      console.error("Error en login:", error);
      return res.status(500).json({
        ok: false,
        msg: "Error interno del servidor"
      });
    }
  }

  static async oauthGoogle(req, res) {
    const authorizationUri = client.authorizeURL({
      redirect_uri: redirectUri,
      scope: ["openid", "profile", "email"].join(' '),
      state: "random_state_string",
    });

    res.redirect(authorizationUri);
  }

  static async oauthCallback(req, res) {
    const { code } = req.query;

    const options = {
      code,
      redirect_uri: redirectUri,
      scope: ["openid", "profile", "email"].join(' ')
    };

    const oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    try {
      const { token } = await client.getToken(options);

      const ticket = await oauthClient.verifyIdToken({
        idToken: token.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      const { email, name, picture } = payload;

      const usuario = await prisma.usuarios.findUnique({
        where: { 
          correo: email,
          deleted_at: null 
        },
        include: { 
          rol: true, 
          finca: true 
        }
      });

      if (!usuario) {
        return res.redirect(`http://localhost:5173/login?error=user_not_found&email=${encodeURIComponent(email)}`);
      }

      if (!usuario.google_oauth || !usuario.verificado) {
        await prisma.usuarios.update({
          where: { usuario_id: usuario.usuario_id },
          data: { 
            google_oauth: true,
            verificado: true 
          }
        });
      }

      const jwtToken = JWT.sign(
        {
          usuarioId: usuario.usuario_id,
          rol: usuario.rol?.nombre,
          nombre: usuario.nombre
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '7d' }
      );

      res.cookie('token', jwtToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      res.redirect("http://localhost:5173/dashboard");

    } catch (error) {
      console.error("Error en OAuth Google:", error);
      res.redirect("http://localhost:5173/login?error=auth_failed");
    }
  }

  static async isAuth(req, res) {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          ok: false,
          msg: "No autenticado"
        });
      }

      const usuario = await prisma.usuarios.findUnique({
        where: { 
          usuario_id: req.usuario.usuarioId,
          deleted_at: null
        },
        include: {
          rol: true,
          finca: true
        }
      });

      if (!usuario) {
        return res.status(404).json({
          ok: false,
          msg: "Usuario no encontrado"
        });
      }

      return res.json({
        ok: true,
        data: {
          usuario_id: usuario.usuario_id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          verificado: usuario.verificado,
          rol: usuario.rol?.nombre,
          finca: usuario.finca
        }
      });

    } catch (error) {
      console.error("Error en verificación de auth:", error);
      return res.status(500).json({
        ok: false,
        msg: "Error interno del servidor"
      });
    }
  }

  static async logout(req, res) {
    try {
      res.clearCookie('token');
      return res.json({
        ok: true,
        msg: "Sesión cerrada exitosamente"
      });
    } catch (error) {
      console.error("Error en logout:", error);
      return res.status(500).json({
        ok: false,
        msg: "Error al cerrar sesión"
      });
    }
  }

  static async getProfile(req, res) {
    try {
      const usuario = await prisma.usuarios.findUnique({
        where: { 
          usuario_id: req.usuario.usuarioId,
          deleted_at: null
        },
        include: {
          rol: true,
          finca: true
        }
      });

      if (!usuario) {
        return res.status(404).json({
          ok: false,
          msg: "Usuario no encontrado"
        });
      }

      return res.json({
        ok: true,
        data: {
          usuario_id: usuario.usuario_id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          verificado: usuario.verificado,
          google_oauth: usuario.google_oauth,
          rol: usuario.rol,
          finca: usuario.finca
        }
      });

    } catch (error) {
      console.error("Error obteniendo perfil:", error);
      return res.status(500).json({
        ok: false,
        msg: "Error interno del servidor"
      });
    }
  }
}
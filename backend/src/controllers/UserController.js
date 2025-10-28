import { OAuth2Client } from "google-auth-library";
import prisma from "../database.js";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AuthorizationCode } from "simple-oauth2";

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
      return res.status(500).json({
        ok: false,
        msg: "Error al procesar la autenticación"
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
      const { email } = payload;

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
      return res.status(500).json({
        ok: false,
        msg: "Error al procesar la autenticación"
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
      return res.status(500).json({
        ok: false,
        msg: "Error al procesar la autenticación"
      });
    }
  }

  static async getUsers(req, res) {
    try {
      if (req.usuario.rol !== 'admin') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para acceder a esta información"
        });
      }

      const usuarios = await prisma.usuarios.findMany({
        where: { 
          deleted_at: null 
        },
        include: {
          rol: true,
          finca: true
        },
        orderBy: {
          nombre: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: usuarios.map(usuario => ({
          usuario_id: usuario.usuario_id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          verificado: usuario.verificado,
          google_oauth: usuario.google_oauth,
          rol_id: usuario.rol_id,
          finca_id: usuario.finca_id,
          rol: usuario.rol,
          finca: usuario.finca
        }))
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al gestionar usuarios"
      });
    }
  }

  static async createUser(req, res) {
    try {
      if (req.usuario.rol !== 'admin') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para crear usuarios"
        });
      }

      const { nombre, correo, password, rol_id, finca_id } = req.body;

      const usuarioExistente = await prisma.usuarios.findUnique({
        where: { 
          correo: correo,
          deleted_at: null 
        }
      });

      if (usuarioExistente) {
        return res.status(400).json({
          ok: false,
          msg: "El correo electrónico ya está registrado"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const nuevoUsuario = await prisma.usuarios.create({
        data: {
          nombre,
          correo,
          contraseña: hashedPassword,
          rol_id: parseInt(rol_id),
          finca_id: parseInt(finca_id),
          verificado: true,
          google_oauth: true
        },
        include: {
          rol: true,
          finca: true
        }
      });

      return res.status(201).json({
        ok: true,
        msg: "Usuario creado exitosamente",
        data: {
          usuario_id: nuevoUsuario.usuario_id,
          nombre: nuevoUsuario.nombre,
          correo: nuevoUsuario.correo,
          rol_id: nuevoUsuario.rol_id,
          finca_id: nuevoUsuario.finca_id,
          rol: nuevoUsuario.rol,
          finca: nuevoUsuario.finca,
          verificado: nuevoUsuario.verificado,
          google_oauth: nuevoUsuario.google_oauth
        }
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al gestionar usuarios"
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { nombre, rol_id, finca_id, verificado } = req.body;

      const usuarioId = req.usuario.rol === 'admin' ? parseInt(id) : req.usuario.usuarioId;

      const updateData = { nombre };
      if (req.usuario.rol === 'admin') {
        if (rol_id) updateData.rol_id = parseInt(rol_id);
        if (finca_id) updateData.finca_id = parseInt(finca_id);
        if (verificado !== undefined) updateData.verificado = verificado;
      }

      const usuarioActualizado = await prisma.usuarios.update({
        where: { usuario_id: usuarioId },
        data: updateData,
        include: {
          rol: true,
          finca: true
        }
      });

      return res.json({
        ok: true,
        msg: "Usuario actualizado exitosamente",
        data: {
          usuario_id: usuarioActualizado.usuario_id,
          nombre: usuarioActualizado.nombre,
          correo: usuarioActualizado.correo,
          rol_id: usuarioActualizado.rol_id,
          finca_id: usuarioActualizado.finca_id,
          rol: usuarioActualizado.rol,
          finca: usuarioActualizado.finca,
          verificado: usuarioActualizado.verificado
        }
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar información del usuario"
      });
    }
  }

  static async deleteUser(req, res) {
    try {
      if (req.usuario.rol !== 'admin') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para eliminar usuarios"
        });
      }

      const { id } = req.params;

      const usuario = await prisma.usuarios.findUnique({
        where: { 
          usuario_id: parseInt(id),
          deleted_at: null 
        }
      });

      if (!usuario) {
        return res.status(404).json({
          ok: false,
          msg: "Usuario no encontrado"
        });
      }

      if (parseInt(id) === req.usuario.usuarioId) {
        return res.status(400).json({
          ok: false,
          msg: "No puedes eliminar tu propio usuario"
        });
      }

      await prisma.usuarios.update({
        where: { usuario_id: parseInt(id) },
        data: { 
          deleted_at: new Date() 
        }
      });

      return res.json({
        ok: true,
        msg: "Usuario eliminado exitosamente"
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar información del usuario"
      });
    }
  }

  static async getRoles(req, res) {
    try {
      if (req.usuario.rol !== 'admin') {
        return res.status(403).json({
          ok: false,
          msg: "No tienes permisos para acceder a esta información"
        });
      }

      const roles = await prisma.roles.findMany({
        where: { 
          deleted_at: null 
        },
        orderBy: {
          nombre: 'asc'
        }
      });

      return res.json({
        ok: true,
        data: roles
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al gestionar usuarios"
      });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const { nueva_password } = req.body;

      const usuarioId = req.usuario.rol === 'admin' ? parseInt(id) : req.usuario.usuarioId;

      const hashedPassword = await bcrypt.hash(nueva_password, 10);

      await prisma.usuarios.update({
        where: { usuario_id: usuarioId },
        data: { 
          contraseña: hashedPassword 
        }
      });

      return res.json({
        ok: true,
        msg: "Contraseña actualizada exitosamente"
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar información del usuario"
      });
    }
  }
}
import { OAuth2Client } from "google-auth-library";
import prisma from "../database.js";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AuthorizationCode } from "simple-oauth2";
import transporter from "../config/emailConfig.js";

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
        { expiresIn: '1d' }
      );

      res.cookie('token', jwtToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production'
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
        { expiresIn: '1d' }
      );

      res.cookie('token', jwtToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production'      
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
          usuario_id: req.usuario.usuario_id,
          deleted_at: null
        },
        include: {
          rol: true,
          finca: true
        }
      });


      return res.json({
        ok: true,
        data: {
          usuario_id: usuario.usuario_id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          verificado: usuario.verificado,
          rol: usuario.rol?.nombre,
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
          usuario_id: req.usuario.usuario_id,
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

      // Contraseña para el email
      const passwordOriginal = password;

      const usuarioExistente = await prisma.usuarios.findFirst({
        where: { 
          correo: correo
        },
        include: {
          rol: true,
          finca: true
        }
      });

      if (usuarioExistente && usuarioExistente.deleted_at) {
        const hashedPassword = await bcrypt.hash(password, 10);

        const usuarioReactivado = await prisma.usuarios.update({
          where: { usuario_id: usuarioExistente.usuario_id },
          data: {
            nombre,
            contraseña: hashedPassword,
            rol_id: parseInt(rol_id),
            finca_id: parseInt(finca_id),
            verificado: true,
            google_oauth: false,
            deleted_at: null
          },
          include: {
            rol: true,
            finca: true
          }
        });

        // Enviar correo con credenciales al reactivar
        await UserController.enviarCorreoCredenciales(
          correo, 
          nombre, 
          passwordOriginal,
          usuarioReactivado.rol.nombre,
          'reactivado'
        );

        return res.status(200).json({
          ok: true,
          msg: "Usuario reactivado exitosamente",
          data: {
            usuario_id: usuarioReactivado.usuario_id,
            nombre: usuarioReactivado.nombre,
            correo: usuarioReactivado.correo,
            rol_id: usuarioReactivado.rol_id,
            finca_id: usuarioReactivado.finca_id,
            rol: usuarioReactivado.rol,
            finca: usuarioReactivado.finca,
            verificado: usuarioReactivado.verificado,
            google_oauth: usuarioReactivado.google_oauth
          }
        });
      }

      if (usuarioExistente && !usuarioExistente.deleted_at) {
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
          google_oauth: false
        },
        include: {
          rol: true,
          finca: true
        }
      });

      // Enviar correo con credenciales al crear nuevo usuario
      await UserController.enviarCorreoCredenciales(
        correo, 
        nombre, 
        passwordOriginal,
        nuevoUsuario.rol.nombre,
        'creado'
      );

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

      const usuarioId = req.usuario.rol === 'admin' ? parseInt(id) : req.usuario.usuario_id;

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

      if (parseInt(id) === req.usuario.usuario_id) {
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

      if (!nueva_password) {
        return res.status(400).json({
          ok: false,
          msg: "La nueva contraseña es requerida"
        });
      }

      const usuarioId = req.usuario.rol === 'admin' ? parseInt(id) : req.usuario.usuario_id;

      const usuario = await prisma.usuarios.findUnique({
        where: { usuario_id: usuarioId }
      });

      if (!usuario) {
        return res.status(404).json({
          ok: false,
          msg: "Usuario no encontrado"
        });
      }

      const hashedPassword = await bcrypt.hash(nueva_password, 10);

      await prisma.usuarios.update({
        where: { usuario_id: usuarioId },
        data: { 
          contraseña: hashedPassword,
          google_oauth: false
        }
      });

      return res.json({
        ok: true,
        msg: "Contraseña actualizada exitosamente"
      });

    } catch (error) {
      console.error("Error al restablecer contraseña:", error);
      return res.status(500).json({
        ok: false,
        msg: "Error al actualizar la contraseña"
      });
    }
  }
   // Enviar correo con credenciales
  static async enviarCorreoCredenciales(email, nombre, password, rol, tipo = 'creado') {
    try {
      const fechaActual = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const horaActual = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const mailOptions = {
        from: `Sistema Bovino <${process.env.SMTP_USER}>`,
        to: email,
        subject: `¡Bienvenido al Sistema Bovino! - Tus Credenciales de Acceso`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #2E86AB;">¡Bienvenido al Sistema Bovino!</h2>
              <p style="color: #666;">${tipo === 'creado' ? 'Tu cuenta ha sido creada exitosamente' : 'Tu cuenta ha sido reactivada exitosamente'}</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #2E86AB; margin-bottom: 15px;">Información de tu Cuenta</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #555;"><strong>Nombre:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${nombre}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #555;"><strong>Correo:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #555;"><strong>Rol:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${rol}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #555;"><strong>Contraseña:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; background-color: #fff3cd; padding: 5px 10px; border-radius: 4px;">${password}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="margin-top: 0;">Importante</h4>
              <p style="margin-bottom: 0;">
                Por seguridad, se recomienda cambiar esta contraseña después de tu primer inicio de sesión.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 11px;">
                © ${new Date().getFullYear()} Sistema Bovino. Todos los derechos reservados.
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

    } catch (error) {
      console.error("Error al enviar credenciales: ", error);
    }
  }
}
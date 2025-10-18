import JWT from "jsonwebtoken";

export default function authenticate(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      ok: false,
      msg: "Usuario no autenticado"
    });
  }

  try {
    const { usuarioId, rol, nombre } = JWT.verify(token, process.env.JWT_SECRET_KEY);

    req.usuario = {
      usuarioId,  
      rol,      
      nombre     
    }
    
    next();
  } catch (error) {
    res.status(401).json({
      ok: false,
      msg: "Token inválido o expirado"
    });
  }
}
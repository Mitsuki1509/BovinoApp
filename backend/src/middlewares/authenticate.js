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
    // Verificar y decodificar el token
    const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);
    

    // Establecer el usuario en la request (usar nombres consistentes)
    req.usuario = {
      usuario_id: decoded.usuarioId,  // ← Esto viene del JWT como usuarioId
      rol: decoded.rol,               // ← Esto viene del JWT como rol
      nombre: decoded.nombre
    };

    
    next();
  } catch (error) {
    res.status(401).json({
      ok: false,
      msg: "Token inválido o expirado"
    });
  }
}
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Agregar el ID del usuario al request
    next(); // Continuar
  } catch (error) {
    res.status(400).json({ message: 'Token no válido.' });
  }
}

module.exports = authMiddleware;

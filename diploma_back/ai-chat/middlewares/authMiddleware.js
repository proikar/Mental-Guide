import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Пожалуйста, войдите в систему'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        error: 'Invalid token format',
        message: 'Неверный формат токена'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    if (!decoded.userId) {
      return res.status(401).json({
        error: 'Invalid token payload',
        message: 'Токен не содержит идентификатора пользователя'
      });
    }

    req.user_id = decoded.userId;
    next();
  } catch (err) {
    console.error('Auth error:', err);

    let errorMessage = 'Недействительный токен';
    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Срок действия токена истек';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Ошибка проверки подписи токена';
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: errorMessage
    });
  }
}
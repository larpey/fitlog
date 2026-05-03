const jwt = require('jsonwebtoken');

const SECRET = 'mysecretkey123';

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).send('no token');
  }

  const token = header.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    return res.status(401).send('bad token');
  }
}

module.exports = auth;
module.exports.SECRET = SECRET;

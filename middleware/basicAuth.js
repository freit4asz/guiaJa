const DomainError = require('../errors/DomainError');
const authService = require('../services/authService');

async function authenticate(req, res, next) {
  const credentials = authService.parseBasicAuthorization(req.get('authorization'));
  if (!credentials) {
    res.set('WWW-Authenticate', 'Basic realm="GuiaJa API", charset="UTF-8"');
    return next(new DomainError('Autenticação HTTP Basic necessária.', 401));
  }
  try {
    req.user = await authService.authenticate(credentials.email, credentials.password);
    return next();
  } catch (error) {
    if (error.status === 401) res.set('WWW-Authenticate', 'Basic realm="GuiaJa API", charset="UTF-8"');
    return next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.tipo)) {
      return next(new DomainError('Você não tem permissão para esta operação.', 403));
    }
    return next();
  };
}

module.exports = {authenticate, requireRole};

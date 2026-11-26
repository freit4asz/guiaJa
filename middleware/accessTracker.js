const pool = require('../config/database');

const ignoredExtensions = /\.(?:css|js|mjs|png|jpe?g|gif|svg|ico|woff2?|ttf|map)$/i;

module.exports = (req, res, next) => {
  const path = req.path;
  if (process.env.NODE_ENV === 'test' || req.method === 'OPTIONS' || ignoredExtensions.test(path)) {
    return next();
  }

  res.once('finish', () => {
    pool.query(
      `INSERT INTO acesso_site (id_usuario, metodo, caminho, status_http)
       VALUES (?, ?, ?, ?)`,
      [req.user?.id || null, req.method, path.slice(0, 255), res.statusCode]
    ).catch(error => {
      console.error('Não foi possível registrar acesso:', error.code || error.message);
    });
  });
  next();
};

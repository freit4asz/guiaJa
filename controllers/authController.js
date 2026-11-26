const authService = require('../services/authService');

async function login(req, res) {
  const user = await authService.login(req.body?.email, req.body?.senha);
  req.user = user;
  res.json(user);
}

async function register(req, res) {
  await authService.register(req.body);
  res.status(201).json({ok: true});
}

module.exports = {login, register};

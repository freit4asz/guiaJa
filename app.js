const express = require('express');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');
const accessTracker = require('./middleware/accessTracker');

const app = express();
app.use(express.json({limit: '1mb'}));
app.use(accessTracker);
const angularBuild = path.join(__dirname, 'client', 'dist', 'client', 'browser');
if (!process.env.VERCEL) {
  app.use(express.static(angularBuild));
  app.use(express.static(path.join(__dirname, 'public')));
}
app.use('/api', apiRoutes);
app.get(/^\/api(?:\/|$)/, (req, res) => res.status(404).json({erro: 'Rota não encontrada.'}));
app.get('*', (req, res, next) => {
  const indexFile = path.join(angularBuild, 'index.html');
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  return next();
});
app.use((req, res) => res.status(404).json({erro: 'Rota não encontrada.'}));
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({erro: 'JSON inválido.'});
  }
  return errorHandler(error, req, res, next);
});

module.exports = app;

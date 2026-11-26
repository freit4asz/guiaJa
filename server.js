const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split(/\r?\n/).forEach(line => {
    const index = line.indexOf('=');
    if (index <= 0) return;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

const app = require('./app');

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`GuiaJa rodando na porta ${port}`));
  require('./services/emailWorker').startEmailWorker();
}

module.exports = app;

const service = require('../services/interactionService');

async function contact(req, res) {
  await service.contact(req.body);
  res.status(201).json({ok: true});
}

async function guideApplication(req, res) {
  const result = await service.applyAsGuide(req.body);
  res.status(201).json({ok: true, ...result});
}

async function message(req, res) {
  const result = await service.sendMessage(req.user, req.body);
  res.status(201).json({ok: true, ...result});
}

module.exports = {contact, guideApplication, message};

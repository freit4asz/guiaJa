const profileService = require('../services/profileService');

async function get(req, res) {
  res.json(await profileService.getProfile(req.user));
}

async function update(req, res) {
  res.json(await profileService.updateProfile(req.user, req.body));
}

module.exports = {get, update};

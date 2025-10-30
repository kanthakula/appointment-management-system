const Datastore = require('nedb-promises');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const timeslots = Datastore.create({ filename: path.join(dataDir, 'timeslots.db'), autoload: true });
const devotees = Datastore.create({ filename: path.join(dataDir, 'devotees.db'), autoload: true });
const registrations = Datastore.create({ filename: path.join(dataDir, 'registrations.db'), autoload: true });

module.exports = { timeslots, devotees, registrations };

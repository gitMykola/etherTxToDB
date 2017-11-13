let monk = require('monk'),
    db = monk('localhost:27017/ether');
module.exports = db;
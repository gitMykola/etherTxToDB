let monk = require('monk'),
    db = monk('localhost:27017/ethertransactions');
module.exports = db;
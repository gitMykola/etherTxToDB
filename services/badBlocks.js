let Mongoose = require('mongoose').Mongoose,
    mongoose = new Mongoose();
require('mongoose-long')(mongoose);
let Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://127.0.0.1/etherbadblocks?',{
    useMongoClient: true,
});

let EtherBadBlock = new Schema({
    _id: ObjectId, // Id of current document
    blockNumber: Number, // BAD Block number on current node
});

module.exports = mongoose.model('ether_bad_blocks', EtherBadBlock);

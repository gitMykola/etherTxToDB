let mongoose = require('mongoose');
    require('mongoose-long')(mongoose);
    mongoose.connect('mongodb://127.0.0.1/ether',{
        useMongoClient: true,
        /* other options */
    });
let Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

let EtherTxDB = new Schema({
    _id: ObjectId,
    blockHash: String,
    blockNumber: String,
    from: String,
    gas: Number,
    gasPrice: Schema.Types.Long,
    hash: String,
    input: String,
    nonce: Number,
    to: String,
    transactionIndex: Number,
    value: Schema.Types.Long,
    v: String,
    r: String,
    s: String,
    timestamp: Number
});

module.exports = mongoose.model('ether_transactions',EtherTxDB);
let Mongoose = require('mongoose').Mongoose,
    mongoose = new Mongoose();
    require('mongoose-long')(mongoose);
let Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    mongoose.Promise = global.Promise;
    mongoose.connect('mongodb://127.0.0.1/ethertransactions?',{
    useMongoClient: true,
});

let EtherTxDB = new Schema({
    _id: ObjectId, // Id of current document
    blockHash: String, // Hash of the block where this transaction was in. null when its pending.
    blockNumber: Number, // Block number where this transaction was in. null when its pending.
    from: String, // Address of the sender.
    gas: Number, // Gas provided by the sender.
    gasPrice: String, //  Gas price provided by the sender in wei.
    hash: String, // 32 Bytes - String: Hash of the transaction.
    input: String, // The data sent along with the transaction.
    nonce: Number, // The number of transactions made by the sender prior to this one.
    to: String, // Address of the receiver. null when its a contract creation transaction.
    transactionIndex: Number, // Integer of the transactions index position in the block. null when its pending.
    value: String, // Value transferred in wei.
    v: String, // signature[0:64]
    r: String, // signature[64:128]
    s: String, // signature[128:130]
    timestamp: Number // transaction block Unix timestamp in seconds
});

module.exports = mongoose.model('ether_transactions', EtherTxDB);

let mongoose = require('mongoose');
    mongoose.connect('mongodb://127.0.0.1/ether');
let Schema = mongoose.Schema,
    BigDecimal = require('big'),
    ObjectId = Schema.ObjectId;

let etherTx = new Schema({
    _id: ObjectId,
    blockHash: String,
    blockNumber: String,
    from: String,
    gas: Number,
    gasPrice: Schema.Types.BigDecimal,
    hash: String,
    input: String,
    nonce: Number,
    to: String,
    transactionIndex: Number,
    value: Schema.Types.BigNumber,
    v: String,
    r: String,
    s: String,
    timestamp: Number
});

module.exports = etherTx;
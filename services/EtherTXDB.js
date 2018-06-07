let Mongoose = require('mongoose').Mongoose,
    mongoose = new Mongoose();
    require('mongoose-long')(mongoose);
let Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    mongoose.Promise = global.Promise;
    mongoose.connect('mongodb://127.0.0.1/eth?',{
    useMongoClient: true,
});

let EtherTxDB = new Schema({
    _id: ObjectId,
    hash: {
        type: String,
        index: { unique: true }
    },
    timestamp:  String,
    from:       {
        type: String,
        index: { unique: false }
    },
    to:         {
        type: String,
        index: { unique: false }
    },
    value:      String,
    fee:        String,
    blockNum:   Number,
    input: {
        to:     String,
        value:  String,
        from:   String
    },
    status:     Boolean
});

module.exports = mongoose.model('ethtransactions', EtherTxDB);

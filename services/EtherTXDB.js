let Mongoose = require('mongoose').Mongoose,
    mongoose = new Mongoose();
    require('mongoose-long')(mongoose);
let Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    mongoose.Promise = global.Promise;
    mongoose.connect('mongodb://wallet:fgtRes62kJlff55jFFkn18ll@193.200.173.204:27017,193.200.173.204:27018/triumf?replicaSet=triumfReplica',{
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

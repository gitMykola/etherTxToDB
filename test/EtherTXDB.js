let Log = require('../services/logToFile'),
    EtherTXDB = require('../services/EtherTXDB'),
    ethFUNC = require('../services/etherTxToDB');
    ERC20 = require('../assets/erc20');

describe('EtherTxToDB',()=>{
    it('db find test',(done)=>{
        let Et = EtherTXDB;
        Et.find({}).select('blockNumber').sort({blockNumber:-1}).limit(1).exec(
            (err,b)=>{
            console.dir(err);
            console.dir(b[0].blockNumber);
                Et.find({}).select('blockNumber').sort({blockNumber:1}).limit(1).exec(
                    (err,b)=>{
                        console.dir(err);
                        console.dir(b[0].blockNumber);
                        done();
                    });
        });

    });
    it('ERC20',(done)=>{
        let eFUNC = ethFUNC;
        if(!eFUNC.connect())
        {
            console.log('GETH NOT CONNECTED!');
            done();
        }else{
            const address = '0xe04f27eb70e025b78871a2ad7eabe85e61212761',
                  contractAddress = '0x57d90b64a1a57749b0f932f1a3395792e12e7055',
                  tokenContract = eFUNC.web3.eth.contract(ERC20).at(contractAddress);
            console.log(tokenContract.balanceOf(address).toNumber());
            done();
        }
    });
    it('TEST RPC',(done)=>{
        ethFUNC.gethRPC('eth_getBlockByNumber',['0x' + (50003).toString(16),true],(e,r)=>console.log(r.result));
            done();
    })
});
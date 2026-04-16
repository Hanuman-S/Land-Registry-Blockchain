const { Actor, HttpAgent } = require("@dfinity/agent");

const canisterId = "REPLAC_WITH_CANNISTER_ID";

const agent = new HttpAgent({
    host: "http://127.0.0.1:4943"
});

agent.fetchRootKey();

const idlFactory = ({ IDL }) => {
    return IDL.Service({
        storeBlock: IDL.Func([IDL.Text, IDL.Text], [IDL.Text], []),
        getChain: IDL.Func([], [IDL.Vec(
            IDL.Record({
                hash: IDL.Text,
                prevHash: IDL.Text
            })
        )], ["query"])
    });
};

const icp = Actor.createActor(idlFactory, {
    agent,
    canisterId
});

module.exports = icp;
import Array "mo:base/Array";

persistent actor {

  // Define a block structure
  type Block = {
    hash : Text;
    prevHash : Text;
  };

  stable var chain : [Block] = [];

  // Store a new block
  public func storeBlock(hash : Text, prevHash : Text) : async Text {
    let newBlock : Block = {
      hash = hash;
      prevHash = prevHash;
    };

    chain := Array.append(chain, [newBlock]);
    return "stored";
  };

  // Get full chain
  public query func getChain() : async [Block] {
    return chain;
  };
}
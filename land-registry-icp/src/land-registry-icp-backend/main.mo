import Array "mo:base/Array";

persistent actor {

  stable var hashes : [Text] = [];

  public func storeHash(hash : Text) : async Text {
    hashes := Array.append(hashes, [hash]);
    return "stored";
  };

  public query func getAll() : async [Text] {
    return hashes;
  };
}

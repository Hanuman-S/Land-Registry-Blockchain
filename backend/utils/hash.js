const crypto = require("crypto");

exports.createHash = (data) => {
    return crypto.createHash("sha256").update(data).digest("hex");
};
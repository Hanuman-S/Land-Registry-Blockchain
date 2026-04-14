const service = require("../services/registryService");

exports.searchProperty = async (req, res) => {
    try {
        const result = await service.search(req.query.query);
        res.json(result);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.transferProperty = async (req, res) => {
    try {
        const result = await service.transfer(req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.verifyBlockchain = async (req, res) => {
    try {
        const result = await service.verifyWithBlockchain();
        res.json(result);
    } catch (err) {
        res.status(500).json(err);
    }
};
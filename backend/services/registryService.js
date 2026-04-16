const db = require("../config/db");
const { createHash } = require("../utils/hash");
const icp = require("../icp/icpClient");

exports.search = (query) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                lp.parcel_id,
                lp.survey_number,
                lp.village,
                lp.taluk,
                lp.district,
                lp.area_sqft,
                o.full_name AS owner_name
            FROM land_parcels lp
            JOIN ownership_records orr 
                ON lp.parcel_id = orr.parcel_id AND orr.is_current = TRUE
            JOIN owners o 
                ON orr.owner_id = o.owner_id
            WHERE 
                o.full_name LIKE ? OR 
                lp.village LIKE ? OR 
                lp.survey_number LIKE ?
        `;
        db.query(sql, [`%${query}%`, `%${query}%`, `%${query}%`], 
        (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

exports.transfer = (data) => {
    return new Promise((resolve, reject) => {
        const { parcelId, sellerId, buyerId, amount } = data;

        db.query(
            "SELECT * FROM ownership_records WHERE parcel_id=? AND is_current=TRUE",
            [parcelId],
            (err, result) => {
                if (err) return reject(err);

                if (result.length === 0)
                    return resolve({ error: "No ownership record" });

                if (result[0].owner_id != sellerId)
                    return resolve({ error: "Seller not owner" });

                const docNo = "DOC" + Date.now();

                db.query(
                    `INSERT INTO registrations 
                     (parcel_id, seller_id, buyer_id, sale_amount, document_number)
                     VALUES (?, ?, ?, ?, ?)`,
                    [parcelId, sellerId, buyerId, amount, docNo],
                    (err) => {
                        if (err) return reject(err);

                        db.query(
                            `UPDATE ownership_records 
                             SET is_current=FALSE, end_date=NOW()
                             WHERE parcel_id=? AND is_current=TRUE`,
                            [parcelId],
                            (err) => {
                                if (err) return reject(err);

                                db.query(
                                    `INSERT INTO ownership_records (parcel_id, owner_id)
                                     VALUES (?, ?)`,
                                    [parcelId, buyerId],
                                    async (err) => {
                                        if (err) return reject(err);

                                        try{
                                            // HASH
                                            const chain = await icp.getChain();

                                            const prevHash = chain.length === 0
                                            ? "GENESIS"
                                            : chain[chain.length - 1].hash;

                                            const txData = `${parcelId}${sellerId}${buyerId}${amount}${docNo}`;

                                            const txHash = createHash(prevHash + txData);

                                            console.log("Prev Hash:", prevHash);
                                            console.log("New Hash:", txHash);

                                            try{
                                                // store block
                                                await icp.storeBlock(txHash, prevHash);
                                            } catch (err) {
                                                return reject("Blockchain write failed");
                                            }
                                            

                                            resolve({
                                                message: "Transfer successful",
                                                document_number: docNo,
                                                hash: txHash
                                            });
                                        }
                                        catch (e) {
                                            reject(e);
                                        }
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
};

exports.verifyWithBlockchain = () => {
    return new Promise(async (resolve, reject) => {
        try {
            db.query(
                "SELECT * FROM registrations ORDER BY registration_id ASC",
                async (err, records) => {
                    if (err) return reject(err);

                    const chain = await icp.getChain();

                    if (records.length !== chain.length) {
                        return resolve({
                            valid: false,
                            error: "Length mismatch"
                        });
                    }

                    let prevHash = "GENESIS";

                    for (let i = 0; i < records.length; i++) {
                        const r = records[i];

                        const txData = `${r.parcel_id}${r.seller_id}${r.buyer_id}${Number(r.sale_amount)}${r.document_number}`;

                        const expectedHash = createHash(prevHash + txData);

                        const block = chain[i];

                        if (block.hash !== expectedHash || block.prevHash !== prevHash) {
                            return resolve({
                                valid: false,
                                error: `Tampering detected at block ${i}`
                            });
                        }

                        prevHash = block.hash;
                    }

                    resolve({ valid: true });
                }
            );
        } catch (err) {
            reject(err);
        }
    });
};
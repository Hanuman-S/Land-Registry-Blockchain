const db = require("../config/db");
const { createHash } = require("../utils/hash");
const icp = require("../icp/icpClient");

// 🔍 SEARCH
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

// TRANSFER
exports.transfer = (data) => {
    return new Promise((resolve, reject) => {

        const { parcelId, sellerId, buyerId, amount } = data;

        // Check owner
        db.query(
            "SELECT * FROM ownership_records WHERE parcel_id=? AND is_current=TRUE",
            [parcelId],
            (err, result) => {
                if (err) return reject(err);

                if (result.length === 0)
                    return resolve({ error: "No ownership record" });

                if (result[0].owner_id != sellerId)
                    return resolve({ error: "Seller not owner" });

                // Insert registration
                const docNo = "DOC" + Date.now();

                db.query(
                    `INSERT INTO registrations 
                     (parcel_id, seller_id, buyer_id, sale_amount, document_number)
                     VALUES (?, ?, ?, ?, ?)`,
                    [parcelId, sellerId, buyerId, amount, docNo],
                    (err) => {
                        if (err) return reject(err);

                        // Update ownership
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
                                    (err) => {
                                        if (err) return reject(err);

                                        // HASH
                                        const txHash = createHash(
                                            `${parcelId}${sellerId}${buyerId}${amount}${docNo}`
                                        );

                                        console.log("Generated Hash:", txHash);

                                        //  STORE IN ICP
                                        icp.storeHash(txHash)
                                            .then((res) => console.log("ICP SUCCESS:", res))
                                            .catch(err => console.error("ICP ERROR:", err));

                                        resolve({
                                            message: "Transfer successful",
                                            document_number: docNo,
                                            hash: txHash
                                        });
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

// VERIFY
exports.verifyWithBlockchain = () => {
    return new Promise(async (resolve, reject) => {
        try {
            db.query(
                "SELECT * FROM registrations ORDER BY registration_id ASC",
                async (err, records) => {
                    if (err) return reject(err);

                    // get hashes from ICP
                    const rawHashes = await icp.getAll();

                    // normalize ICP output (handles {_0: "..."} issue)
                    const icpHashes = rawHashes.map(h =>
                        typeof h === "string" ? h : h._0
                    );

                    // create local hashes
                    const localHashes = records.map(r =>
                        createHash(
                            `${r.parcel_id}${r.seller_id}${r.buyer_id}${Number(r.sale_amount)}${r.document_number}`
                        )
                    );

                    // DEBUG (optional — remove later)
                    console.log("DB count:", localHashes.length);
                    console.log("ICP count:", icpHashes.length);
                    console.log("Local:", localHashes);
                    console.log("ICP:", icpHashes);

                    // if counts mismatch → definitely invalid
                    if (localHashes.length !== icpHashes.length) {
                        return resolve({
                            valid: false,
                            error: "Mismatch in number of transactions"
                        });
                    }

                    // sort both arrays to avoid order issues
                    localHashes.sort();
                    icpHashes.sort();

                    //  compare
                    for (let i = 0; i < localHashes.length; i++) {
                        if (localHashes[i] !== icpHashes[i]) {
                            return resolve({
                                valid: false,
                                error: "Blockchain mismatch detected"
                            });
                        }
                    }

                    // all good
                    resolve({ valid: true });
                }
            );
        } catch (err) {
            reject(err);
        }
    });
};
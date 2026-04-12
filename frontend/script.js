const BASE_URL = "http://localhost:3000";

// SEARCH
async function searchProperty() {
    const query = document.getElementById("search").value;

    const res = await fetch(`${BASE_URL}/search?q=${query}`);
    const data = await res.json();

    document.getElementById("searchResult").innerText =
        JSON.stringify(data, null, 2);
}

// TRANSFER
async function transfer() {
    const payload = {
        property_id: document.getElementById("propertyId").value,
        seller_id: document.getElementById("sellerId").value,
        buyer_id: document.getElementById("buyerId").value,
        amount: document.getElementById("amount").value
    };

    const res = await fetch(`${BASE_URL}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    document.getElementById("transferResult").innerText =
        JSON.stringify(data, null, 2);
}

// VERIFY
async function verify() {
    const res = await fetch(`${BASE_URL}/verify`);
    const data = await res.json();

    document.getElementById("verifyResult").innerText =
        JSON.stringify(data, null, 2);
}
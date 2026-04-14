const BASE_URL = "http://localhost:3000/api";

// SEARCH
async function search() {
    const query = document.getElementById("searchInput").value;

    const res = await fetch(`${BASE_URL}/search?query=${query}`);
    const data = await res.json();

    document.getElementById("searchResult").innerHTML =
        "<pre>" + JSON.stringify(data, null, 2) + "</pre>";
}

// TRANSFER
async function transfer() {
    const parcelId = document.getElementById("parcelId").value;
    const sellerId = document.getElementById("sellerId").value;
    const buyerId = document.getElementById("buyerId").value;
    const amount = document.getElementById("amount").value;

    const res = await fetch(`${BASE_URL}/transfer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            parcelId,
            sellerId,
            buyerId,
            amount
        })
    });

    const data = await res.json();

    document.getElementById("transferResult").innerHTML =
        "<pre>" + JSON.stringify(data, null, 2) + "</pre>";
}

// VERIFY
async function verify() {
    const res = await fetch(`${BASE_URL}/verify`);
    const data = await res.json();

    document.getElementById("verifyResult").innerHTML =
        "<pre>" + JSON.stringify(data, null, 2) + "</pre>";
}
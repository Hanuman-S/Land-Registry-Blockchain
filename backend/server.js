require("dotenv").config();

const express = require("express");
const cors = require("cors");

const registryRoutes = require("./routes/registry");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", registryRoutes);

app.get("/", (req, res) => {
    res.send("Backend running");
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
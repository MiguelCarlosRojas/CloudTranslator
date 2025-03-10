const cors = require("cors");

const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["GET", "POST"], // Only allow GET and POST
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);
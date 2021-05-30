const mongoose = require("mongoose");

var uri = "mongodb://root:asrkpvg7@svr8.creta.vn/";

mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true });
const connection = mongoose.connection;
connection.once("open", function() {
  console.log("MongoDB database connection established successfully");
});
// Generated with assistance from ChatGPT for setting up the Express server and routes.
const express = require("express");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");


const app = express();
const port = 3000;

//Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload());

// Parse urlencoded bodies for POST form parameters
app.use(express.urlencoded({ extended: true }));

// Route handlers
const webclientRoute = require("./routes/webclient.js");
const apiRoute = require("./routes/api.js");

//Define routing
app.use("/api", apiRoute);
app.use("/", webclientRoute);

// Start the server and listen on the defined port
app.listen(port, () => {
   console.log(`Server listening on port ${port}.`);
});

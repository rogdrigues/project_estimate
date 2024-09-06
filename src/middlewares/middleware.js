const cookies = require("cookie-parser");
const cors = require('cors');

module.exports = function (app, express) {
    //Set up cors
    app.use(cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    }));
    //Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    //Set up middleware to allow CORS
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header("Access-Control-Expose-Headers", "Content-Disposition");
        next();
    });
    //Set up middleware to log request time
    app.use((req, res, next) => {
        console.log('Time:', Date.now());
        next();
    });
    //Adding cookie parser for reading req.cookies
    app.use(cookies());
};

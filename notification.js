const app = require("express")();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const config = require("./config/db");
const router = require('./routes/notification.routes');

mongoose
    .connect(config.DB, { useNewUrlParser: true })
    .then(function () {
    console.log("Database is connected");
}, function (err) {
    console.log("Can not connect to the database" + err);
});


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/api/notification",router)

app.get("/", (req,res) => {
    res.send(`Welcome to Notification service`);
});

var PORT = process.env.PORT || 5001;
app.listen(PORT, function () {
    console.log("NOTIFICATION Server is runing on PORT " + PORT)
});


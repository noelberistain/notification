const app = require("express")();
const server = require("http").createServer(app);
// W O R K S with the PATH flag
const io = module.exports.io = require("socket.io")(server, { path: "/io" });
// const io = module.exports.io = require("socket.io")(server);
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const config = require("./config/db");
const router = require("./routes/notification.routes");
const validateSocket = require('./token');
// const token = require("./token");

const socketManager = require("./socketManager")

var PORT = process.env.PORT || 5001;

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

mongoose.connect(config.DB, { useNewUrlParser: true }).then(
    function () {
        console.log("Database is connected");
    },
    function (err) {
        console.log("Can not connect to the database" + err);
    }
);

// app.use(bodyParser.urlencoded({ extended: false })); ORIGINAL USAGE  extended:false
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (res, next) => {
    res.send(`Welcome to Notification service`);
});

io.use(validateSocket)

io.on("connection", socketManager)

app.use("/api/notification", router);

server.listen(PORT, function () {
    console.log("NOTIFICATION Server is runing on PORT " + PORT);
});

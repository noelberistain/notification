const express = require("express");
const router = express.Router();
const Contact = require("../models/Contacts.model");
const checkToken = require("../checkToken");
const completeUser = require("../connection/completeUser");
// const sockets = require("../SocketManager")
const axios = require("axios");
const io = require("../notification").io;

router.post("/adduser", (req, res) => {
    const { _id, name, email } = req.body;
    console.log(req.body);
    Contact.findOne({
        email: email
    })
        .then(user => {
            if (user) {
                console.log("existent user at notification service database");
                return res.status(400).json({
                    email: "Email already exist"
                });
            } else {
                console.log("addding user at notification service database");
                const newUser = new Contact({
                    _id: _id,
                    name: name,
                    email: email
                });
                newUser
                    .save()
                    .then(newUser => {
                        console.log(
                            "new user SAVED at notification nservice database called ==== CONTACTS",
                            newUser
                        );
                        res.json(newUser);
                    })
                    .catch(e => console.log(e));
            }
        })
        .catch(e => console.log(e));
});

router.get("/allUsers", (req, res) => {
    const contacts = [];
    Contact.find()
        .then(users => {
            users.map(contact => {
                contacts.push(contact);
            });
            console.log("contacts", contacts);
            res.json(contacts);
        })
        .catch(e => console.log(e));
});

router.get("/myfriends", checkToken, completeUser, async (req, res) => {
    const { contacts } = req.body;
    const ids = contacts.map(value => value.contactID); //just ids array
    const statId = contacts.map(
        value => (value = { id: value.contactID, status: value.status })
    ); // array of ids and status
    const getAll = () =>
        axios.post("http://localhost:5000/api/auth/friendsInfo", ids);
    const { data } = (user = await getAll());
    data.forEach(element => {
        statId.map(id => {
            if (element._id == id.id) {
                element.status = id.status;
            }
        });
    });

    res.json(data);
});

router.post("/addContact", (req, res) => {
    console.log(" ------ Info from authentication at CLIENT - - - - /n",req.body);
    const { _id, userId } = req.body;
	console.log('TCL: _id, userId', _id, userId)
    Contact.findOneAndUpdate(
        { _id: userId },
        { $push: { contacts: { contactID: _id } } },
        { new: true }
    ).exec((err, doc) => {
        if (err) {
            console.log(`there was something wrong updating the document${err}`);
        } else {
            console.log("- - - - - - - - - - - - - - - - - - - - - - -- - - document\n",doc);
            res.json(doc);
            Contact.findOneAndUpdate(
                { _id },
                { $push: { contacts: { contactID: userId } } },
                { new: true }
            ).exec((err, doc) => {
                if (err)
                    onsole.log(`there was something wrong updating the document ${err}`);
                else {
                    console.log(
                        "- - - - - - - - - - - - - - - - - - - - - - -- - - document\n",
                        doc
                    );
                }
            });
        }
    });
    io.to(_id).emit("notification",req.body);
    // res.json(`...`)
});

module.exports = router;

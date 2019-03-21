const express = require("express");
const router = express.Router();
const Contact = require("../models/Contacts.model");
const checkToken = require("../checkToken");
const completeUser = require("../connection/completeUser");
const jwt_decode = require("jwt-decode")
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
    const { contacts } = withContacts;
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
    Contact.findOneAndUpdate(
        { _id: userId },
        { $push: { contacts: { contactID: _id } } },
        { new: true }
    ).exec((err, doc) => {
        if (err) {
            console.log(`there was something wrong updating the document${err}`);
        } else {
            console.log(' me with false status And a id in my contacts array- - - - - - - - - - -\n',doc);
            res.json(doc);
            Contact.findOneAndUpdate(
                { _id },
                { $push: { contacts: { contactID: userId, status: 'pending' } } },
                { new: true }
            ).exec((err, doc) => {
                if (err)
                    onsole.log(`there was something wrong updating the document ${err}`);
                else {
                    console.log("The invited Friend with a 'pending' status and my ID into his contacts array\n- - - - - - - - - -\n",doc);
                }
            });
        }
    });
    
    io.to(_id).emit("notification",userId);
});

router.post("/responseFriendship", (req,res)=>{
    const header = req.headers.cookie;
    if(typeof header !== 'undefined') {
        let n = header.split(';')
        let token = n.find(item => item.includes('jwToken'))
        let user = jwt_decode(token)
        const {value, requestingID} = req.body
        console.log(typeof value, value)
        if (value !== 'undefined') {
        try {
                Contact.findOneAndUpdate(
                    {
                        _id: user.id,
                        'contacts.contactID': requestingID
                    },
                    { $set: { 'contacts.$.status': value } },
                    { new: true }
                )
                    .exec((err, doc) => {
                        if (err) {
                            console.log("error", err);
                        }
                        else {
                            try {
                                Contact.findOneAndUpdate(
                                    {
                                        _id: requestingID,
                                        'contacts.contactID': user.id
                                    },
                                    { $set: { 'contacts.$.status': value } },
                                    { new: true }
                                ).exec((err, doc) => {
                                    if (err) console.log(err)
                                    else {
                                        try {
                                            console.log(doc)
                                            console.log("status at both sides has change")
                                            res.json('DONE')
                                        }
                                        catch{ 
                                            console.log("THERE WAS AN ERROR updating status at the Friend who request\n* * * * * ",err)
                                        }
                                    }

                                })
                            }
                                catch{
                        console.log('SOME ERROR')
                    }
                }
            });
        }
        catch{

        }
    io.to(user.id).to(requestingID).emit('notification')
    }
    else {
        // If header is undefined return Forbidden (403)
        res.send("something is wrong").status(403)
    }
}
})

module.exports = router;

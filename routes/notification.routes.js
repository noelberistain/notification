const express = require("express");
const router = express.Router();
const Contact = require("../models/Contacts.model");
const Conversation = require("../models/Conversation.model");
const Message = require("../models/Message.model");
const checkToken = require("../checkToken");
const completeUser = require("../connection/completeUser");
const jwt_decode = require("jwt-decode");
const axios = require("axios");
const io = require("../notification").io;

router.post("/adduser", (req, res) => {
    const { _id, email } = req.body;
    // console.log("TCL: req.body", req.body);
    Contact.findOne({
        email
    })
        .then(user => {
            if (user) {
                // console.log("existent user at notification service database");
                return res.status(400).json({
                    email: "Email already exist"
                });
            } else {
                // console.log("addding user at notification service database");
                const newUser = new Contact({
                    _id: _id
                });
                newUser
                    .save()
                    .then(newUser => res.json(newUser))
                    .catch(e => console.log(e));
            }
        })
        .catch(e => console.log(e));
});

router.post("/addContact", (req, res) => {
    // console.log(" ------ Info from authentication at CLIENT - - - - /n", req.body);
    const { _id, userId } = req.body;

    Contact.findOneAndUpdate(
        { _id: userId },
        { $push: { contacts: { contactID: _id } } },
        { new: true }
    ).exec((err, doc) => {
        if (err) {
            // console.log(`there was something wrong updating the document${err}`);
        } else {
            // console.log(" me with false status And a id in my contacts array- - - - - - - - - - -\n",doc);
            res.json(doc);
            Contact.findOneAndUpdate(
                { _id },
                {
                    $push: {
                        contacts: { contactID: userId, status: "pending" }
                    }
                },
                { new: true }
            ).exec((err, doc) => {
                if (err)
                    console.log(`there was something wrong updating the document ${err}`);
                else {
                    console.log("The invited Friend with a 'pending' status and my ID into his contacts array\n- - - - - - - - - -\n",doc);
                }
            })
            .catch(e => console.log("error", e));
        }
    })
    .catch(e => console.log(e));
    return io.to(_id).emit("notification", userId);
});

router.post("/responseFriendship", (req, res) => {
    const header = req.headers.cookie;
    if (typeof header !== "undefined") {
        let n = header.split(";");
        let token = n.find(item => item.includes("jwToken"));
        let user = jwt_decode(token);
        const { id } = user;
        // console.log("user ID ln-95:\n", id);
        const { value, contactID } = req.body;
        // value means the status - - - requestingID means the id of the element clicked at the dom
        if (value !== "undefined" && value !== "false") {
            try {
                Contact.findOneAndUpdate(
                    {
                        _id: id, // id means the id decoded from token for the ACTIVE USER
                        "contacts.contactID": contactID
                    },
                    { $set: { "contacts.$.status": value } },
                    { new: true }
                ).exec((err, doc) => {
                    if (err) {
                        console.log("E R R O R  at ln-109", err);
                    } else {
                        try {
                            Contact.findOneAndUpdate(
                                {
                                    _id: contactID,
                                    "contacts.contactID": id
                                },
                                { $set: { "contacts.$.status": value } },
                                { new: true }
                            ).exec(async (err, doc) => {
                                if (err)
                                    console.log("E R R O R  at ln-120", err);
                                else {
                                    try {
                                        const { id } = user;
                                        const them = [id, contactID];
                                        const conv = new Conversation({
                                            participants: them
                                        });
                                        Conversation.create(conv)
                                            .then(newConv => {
                                                return io
                                                    .to(id)
                                                    .to(contactID)
                                                    .emit(
                                                        "create_conversation",
                                                        newConv
                                                    );
                                                // res.json(newConv._id)
                                            })
                                            .catch(e => console.log(e));
                                    } catch {
                                        console.log(
                                            "THERE WAS AN ERROR updating status at the Friend who request\n* * * * * ",
                                            err
                                        );
                                    }
                                }
                            })
                            .catch(e => console.log(e));
                        } catch {
                            console.log("SOME ERROR");
                        }
                    }
                });
            } catch {}
            // io.to(id).to(contactID).emit('notification',newConv)
        }
        if (value === "false") {
            try {
                // should be rejecting friendship request,
                // removing the id for both of them
            } catch {
                // if something goes wrong, should be doing something usefull
            }
        } else {
            // If header is undefined return Forbidden (403)
            res.send("something is wrong").status(403);
        }
    }
});

router.get("/getConversation", checkToken, (req, res) => {
    const { id } = user;
    Conversation.find({ participants: id })
        .then(conversations => res.json(conversations))
        .catch(e => console.log("error  - searching for Conversation ID", e));
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

router.post("/createMessage", checkToken, (req, res) => {
    const { id } = user;
    const { convID, content, contact } = req.body;
	const message = new Message({
        conversationID: convID,
        author: id,
        content
    });
    message
        .save()
        .then(newMessage => {
            contact.forEach(user=>{
                io.to(user)
                    .emit("newMessage", newMessage);
            })
            res.end();
        })
        .catch(e => {
            console.log("something went wrong, \n", e);
        });
});

router.get("/getMessages", checkToken, (req, res) => {
    // conversationID inside REQ.QUERY
    const { id } = req.query;
    Message.find({ conversationID: id })
        .then(conversations => {
            return io.to(user.id).emit("getMessages", conversations);
        })
        .catch(e => {
            console.log(`there was an error retrieving all messages for conversationId= ${id}
            ${e}`);
        });
        res.end();
});

router.get("/getGroupMessages", checkToken, (req, res) => {
    // conversationID inside REQ.QUERY
    const { groupID } = req.query;

    Message.find({ conversationID: groupID })
        .then(conversations => {
            const groupInfo = { activeConv: groupID, conversations };
            io.to(user.id).emit("getGroupMessages", groupInfo);
        })
        .catch(e => {
            console.log(`there was an error retrieving all messages for conversationId= ${groupID}
            ${e}`);
        });
        res.end();
});

router.post("/createGroup", checkToken, (req, res) => {
    const { name, list } = req.body;
    list.push(user.id);

    const group = new Conversation({
        groupName: name,
        participants: list
    });
    Conversation.create(group)
        .then(newGroup => {
            list.forEach(user => {
                io.to(user).emit("createGroup", newGroup);
            });
        })
        .catch(e => console.log("Error creating group...") || e);
        res.end()
});

router.get("/getGroups", checkToken, (req, res) => {
    const { id } = user;
    Conversation.find({
        participants: id
    }).then(all => {
        // console.log("***********ALL CONVERSATIONS***********",all)

        // const groups = all.filter(conversation => conversation.participants.length > 2);
        // const theOnes = groups.filter(conv => conv.groupName)
        // console.log("---------GROUPS WITH ME---------\n",theOnes)
        // theOnes.forEach(group => {
        //     group.participants.map(participant=>{
        // 		// console.log("TCL: participant", participant, group)

        //         io.to(participant).emit('loadGroups',group)
        //     })
        // })

        res.json(all);
    })
    .catch(e => console.log(e));
});

router.get("/test", (req,res)=>{
    console.log("this is a test")
    res.send(`this is a test`)
})

module.exports = router;

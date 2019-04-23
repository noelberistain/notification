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

// add Contact gets the USER-ID and the CONTACT-ID to go at notification db and add to both documents the respective id's
// so now they can appear at the Browser rather as a friend at contact list or as a pending friend waiting for response
router.post("/addContact", (req, res) => {
    console.log("\n'Info' from addFriend() at CLIENT/n", req.body);
    const { _id, userId } = req.body;
    console.log(
        "\n****It should contains:\n_id(invited contact) = ",
        _id,
        "\nuserId(active user) = ",
        userId
    );
    
    Contact.findOneAndUpdate(
        { _id: userId },
        { $push: { contacts: { contactID: _id } } },
        { new: true }
    )
        .exec((err,doc) => {
            if (err){
                console.log(
                    "ERROR SAVING invited contact into USERS contacts lists"
                );
                res.status(400).send({invitedAdded: false})
            }
            else {
                console.log(
                    "\nSAVED invited contact INTO user's contactlist with default status 'false'\n**",
                    doc,
                    "\n***NEXT - Add user into the contacts list of the invited contact"
                );
                res.status(200).json(doc);
                // try {
                Contact.findOneAndUpdate(
                    { _id },
                    {
                        $push: {
                            contacts: {
                                contactID: userId,
                                status: "pending"
                            }
                        }
                    },
                    { new: true }
                )
                    .exec((err, doc) => {
                        if (err){
                            console.log(
                                "ln 85 - unable to finish transaction, couldn't add USER into invited Contact (contacts lists)"
                            );
                            res.status(400).send("ln 87 - couldn't add USER into invited Contact (contacts lists)")
                        }
                        else {
                            console.log(
                                "\nSAVED user's info INTO invited friend contacts list with status = 'pending'\n**",
                                doc
                            );
                            console.log("should send the event /'notification/' to id = ", _id)
                            return io.to(_id).emit("notification", userId);
                        }
                    })
            }
        })
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
		console.log("TCL: value, contactID", value, contactID)
        // value means the status - - - requestingID means the id of the element clicked at the dom
        if (value !== "undefined" && value !== "false") {
            // try {
                Contact.findOneAndUpdate(
                    {
                        _id: id, // id means the id decoded from token for the ACTIVE USER
                        "contacts.contactID": contactID
                    },
                    { $set: { "contacts.$.status": value } },
                    { new: true }
                )
                    .exec((err, doc) => {
                        if (err) {
                            console.log("E R R O R  at ln-109", err);
                            res.status(400).send("ln - 138  error changing the value")
                            // res.end()
                        } else {
                            try {
                                Contact.findOneAndUpdate(
                                    {
                                        _id: contactID,
                                        "contacts.contactID": id
                                    },
                                    { $set: { "contacts.$.status": value } },
                                    { new: true }
                                )
                                    .exec((err, doc) => {
                                        if (err){
                                            console.log(
                                                "E R R O R  at ln-140 not able to change the value",
                                                err
                                            );
                                            res.status(400).send("not able to change the value")
                                        }else {
                                            try {
                                                const { id } = user;
                                                const them = [id, contactID];
                                                const conv = new Conversation({
                                                    participants: them
                                                });
                                                Conversation.create(conv)
                                                    .then(newConv => {
														console.log("TCL: newConv", newConv)
                                                        io.to(id)
                                                            .to(contactID)
                                                            .emit(
                                                                "create_conversation",
                                                                newConv
                                                            );
                                                        res.end();
                                                    })
                                                    .catch(e => {
                                                        console.log("error at ln 162. Wasn't able to fire event create_conversation\n* * * * *\n" ,e)
                                                        res.end()
                                                        // res.status(400).json("Wasn't able to fire evnet create_conversation, it might not created a new conversation")
                                                    });
                                            } catch (err) {
                                                console.log(
                                                    "ln 167 - -THERE WAS AN ERROR updating status at the Friend who request\n* * * * * ",
                                                    err
                                                );
                                                res.status(400).json("THERE WAS AN ERROR updating status at the Friend who request")
                                            }
                                        }
                                    })
                                    // .catch(e => {
                                    //     console.log(e);
                                    //     res.status(400).json("couldn't change the value/ error catched at ln 176")
                                    // });
                            } catch {
                                console.log("SOME ERROR");
                                res.status(400).send("catched error at ln 180")
                            }
                        }
                    })
                    // .catch(e => {
                    //     console.log("ln 187 - error .. . . ", e)
                    //     res.end()
                    // });
            // } catch (e) {
                // console.log("error catched at ln-186")
                // res.status(400).send({error: e})
            // }
            // io.to(id).to(contactID).emit('notification',newConv)
        }
        if (value === "false") {
            try {
                // should be rejecting friendship request,
                // removing the id for both of them
            } catch {
                // if something goes wrong, should be doing something usefull
            }
        } 
    }else {
        res.status(403).send("something is wrong with the headers");
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
            contact.forEach(user => {
                io.to(user).emit("newMessage", newMessage);
            });
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
    res.end();
});

router.get("/getGroups", checkToken, (req, res) => {
    const { id } = user;
    Conversation.find({
        participants: id
    })
        .then(all => {
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

router.get("/test", (req, res) => {
    console.log("this is a test");
    res.send(`this is a test`);
});

module.exports = router;

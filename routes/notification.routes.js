const express = require("express");
const router = express.Router();
const Contact = require("../models/Contacts.model");
const Conversation = require("../models/Conversation.model");
const Message = require('../models/Message.model');
const checkToken = require("../checkToken");
const completeUser = require("../connection/completeUser");
const jwt_decode = require("jwt-decode")
const axios = require("axios");
const io = require("../notification").io;

router.post("/adduser", (req, res) => {
    const { _id, email } = req.body;
    console.log(req.body);
    Contact.findOne({
        email
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
                    _id: _id
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
        const {id} = user;
        const {value, contactID} = req.body
        // value means the status - - - requestingID means the id of the element clicked at the dom
        if (value !== 'undefined' && value !== 'false') {
        try {
                Contact.findOneAndUpdate(
                    {
                        _id: id, // id means the id decoded from token for the ACTIVE USER
                        'contacts.contactID': contactID
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
                                        _id: contactID,
                                        'contacts.contactID': id
                                    },
                                    { $set: { 'contacts.$.status': value } },
                                    { new: true }
                                ).exec((err, doc) => {
                                    if (err) console.log(err)
                                    else {
                                        try {
                                            const {id} = user;
                                                const conv = new Conversation(
                                                    { participants: [id, contactID] },
                                                    );
                                                Conversation.create(conv)
                                                .then(newConv => {
                                                    console.log("NEW CONVERSATION CREATED-------",newConv);
                                                    io.to(id).to(contactID).emit('create_conversation', newConv)
                                                    // res.json(newConv._id)
                                                })
                                                .catch(e => console.log(e));
                                            }
                                        catch{console.log("THERE WAS AN ERROR updating status at the Friend who request\n* * * * * ",err)}
                                    }
                                })
                            }
                                catch{console.log('SOME ERROR')}
                }
            });
        }
        catch{}
    // io.to(id).to(contactID).emit('notification',newConv)
    }
        if(value === 'false'){
            try{
                // should be rejecting friendship request,
                // removing the id for both of them
            }
            catch{
                // if something goes wrong, should be doing something usefull
            }
        }
    else {
        // If header is undefined return Forbidden (403)
        res.send("something is wrong").status(403)
    }
}
})

router.get("/getConversation", checkToken, (req,res)=>{
    const {id} = user;
    Conversation.find(
        { participants: id}
    )
    .then(conversations => {
        console.log(conversations)
        res.json(conversations)
    })
    //     { 
    //     const twoParticipants = conversations.filter(conversation => conversation.participants.length === 2);
    //     const theOne = twoParticipants.filter(participant => participant.participants.includes(contact))
	// // console.log("TCL: theOne", theOne[0]._id)
    //     const{_id}= theOne[0];
    //     io.to(id).to(contact).emit('get_conversation_id')//,_id)
    //     res.json(_id) // conversation ID
    // })
    .catch(e=> console.log("error  - searching for Conversation ID",e))
})

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
    const message = new Message(
        {
            conversationID: convID,
            author: id,
            content
        }
        )
    message.save()
        .then(newMessage => {
            io.to(contact).emit('newMessage', newMessage)
            res.json('DONE')
        })
        .catch(e => {
            console.log("something went wrong, \n", e)
        })
})

module.exports = router;

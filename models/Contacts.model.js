const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const objectID = Schema.Types.ObjectId;

const Friends = new Schema({
    contactID: { type: objectID, ref: 'Contacts' },
    status: {
            type: Boolean,
            default: 'false'
    },
    date: {
        type: Date,
        default: Date.now
    },
}, {_id:false})

const Contacts = new Schema({
    contacts: [
        {
            type: Friends
        }
    ],
    conversations: [
        {
            userID: {
                type: objectID
            },
            friendID: {
                type: objectID
            },
            messages: {
                type: String
            }
        }

    ]
});

module.exports = Contact = mongoose.model("Contacts", Contacts);
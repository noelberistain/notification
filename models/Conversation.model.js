const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Conversations = new Schema({
    groupName: String
    ,
    participants: [
        {
            type: String
        }
    ]
});

module.exports = Conversation = mongoose.model("Conversations", Conversations);
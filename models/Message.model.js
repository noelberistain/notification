const mongoose = require("mongoose");
const Conversation = require("./Conversation.model")
const Schema = mongoose.Schema;
const objectID = Schema.Types.ObjectId;

const Messages = new Schema({
    conversationID :{
        type: objectID,
        ref: Conversation
    },
    author: {
        type: String
    },
    content:{
        type:String
    },
    date:{
        type: Date,
        default: Date.now
    }
})

module.exports = Message = mongoose.model("Messages", Messages)
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Conversations = new Schema({
    participants:[ 
        {
                type: String
            }
        
    ]
});

module.exports = Conversation = mongoose.model("Conversations", Conversations);
const Contact = require("../models/Contacts.model")
module.exports = (req, res, next) => {
    const {id}=user
    if(id){
        const restrictions = { contacts: 1 };
        Contact.findOne({ _id: id }, restrictions)
        .then(user => {
            withContacts = user
            // WHERE withContacts = 'id' of active User with the array of 'contacts' id's
            next();
        })
        .catch(e => console.log(e));
    }
    
    else {res.send(`something wrong`)}
}
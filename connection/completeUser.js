const Contact = require("../models/Contacts.model")
module.exports = (req, res, next) => {
    if(req.body.id){
        const restrictions = { contacts: 1 };
        Contact.findOne({ _id: req.body.id }, restrictions)
        .then(user => {
            req.body = user
            // WHERE req.body = 'id' of active User with the array of 'contacts' id's
            next();
        })
        .catch(e => console.log(e));
    }
    
    else {res.send(`something wrong`)}
}
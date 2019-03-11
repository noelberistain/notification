const Contact = require("../models/Contacts.model")
module.exports = (req, res, next) => {
    if(req.body.id){
        const restrictions = { contacts: 1 };
        Contact.findOne({ _id: req.body.id }, restrictions)
        .then(user => {
                console.log(" - - - -  VALIDATED USER FOUND - - - - -",user)
            req.body = user
            next();
        })
        .catch(e => console.log(e));
    }
    
    else {res.send(`something wrong`)}
}
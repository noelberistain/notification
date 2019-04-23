const Contact = require("../models/Contacts.model")
module.exports = (req, res, next) => {
    console.log(user)
    const { id } = user
    if (id) {
        const restrictions = { contacts: 1 };
        Contact.findOne({ _id: id }, restrictions)
            .then(user => {
                    withContacts = user
                    console.log("user with contacts = ",withContacts)
                    next();
                // WHERE withContacts = 'id' of active User with the array of 'contacts' id's
            })
            .catch(e => console.log(e));
    }

    else { res.send(`something wrong`) }
}
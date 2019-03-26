const jwt_decode = require("jwt-decode");

module.exports = (req, res, next) => {
    const header = req.headers.cookie;
    if(typeof header !== 'undefined') {
        const n = header.split(';')
        const aux = n.find(item => item.includes('jwToken'))
        user = jwt_decode(aux)
        // WHERE user =  id of active user
        next();
    } 
    else {
        // If header is undefined return Forbidden (403)
        res.send("something is wrong").status(403)
    }
}
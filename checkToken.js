const jwt_decode = require ("jwt-decode");

module.exports = (req, res, next) => {
    const header = req.headers.cookie;
    if(typeof header !== 'undefined') {
        req.body = header.split('=')[1].replace(/^"(.+)"$/,'$1');
        req.body = jwt_decode(req.body)
        next();
    } else {
        //If header is undefined return Forbidden (403)
        res.sendStatus(403)
    }
}
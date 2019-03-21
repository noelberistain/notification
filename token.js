const jwt_decode = require("jwt-decode");
function getCookies(headers){
    const keyVal = headers.split(';');
    return keyVal.reduce((cookies, value)=>{
        const [key, val] = value.split('=');
        cookies[key] = val;
        return cookies;
    }, {});

}

module.exports = (socket, next) => {
    const header = socket.handshake.headers.cookie;
    if (typeof header !== 'undefined') {
        const cookies = getCookies(header);
        if ('jwToken' in cookies) {
            try{
                socket.user = jwt_decode(cookies.jwToken)
                next();
            }
            catch{}
        }
    }
    next("Invalid user");
}
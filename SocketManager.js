const io = require("./notification").io;

module.exports = function (socket) {
  const { id } = socket.user;
  
  socket.join(id, () => {
    // console.log(`Client ${id} has joined to his own room`);
    emitVisitors();
  });

  socket.on("disconnect", () => {
    // console.log("Client -> in room = ", id, " has been disconnected");
    // console.log("remaining users connecteds  - ");
    emitVisitors();
  });
};

const getVisitors = () => {
  const clients = io.sockets.clients().connected;
  const socket = Object.values(clients);
  const users = socket.map(s => {
    return s.user.id;
  });
  // console.log("-----ACTIVE ROOMS-----\n", users);
  return users;
};

const emitVisitors = () => {
  io.emit("visitors", getVisitors());
};

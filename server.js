const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const _debug = false;

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine','html');

app.use('/', (req, res) => {
    res.render('index.html');
});

var players = [];

// Add a connect listener
io.on('connection', socket => {
    if(_debug) console.log(`Client connected. ${socket.id}`);

    socket.emit('getMyId', socket.id); //send socketid to client

    // Disconnect listener
    socket.on('disconnect', () => {
        players = players.filter(item=> item.userId!==socket.id); // Remove disconected users
    });
    
    socket.on('sendMessage', data => {             
        var filtered = players.filter(item=> item.userId===socket.id);

        if(filtered.length===0) {   
            data.serverTimestamp = Date.now();         
            data.userId = socket.id;   
            players.push(data);
        }else{
            
            filtered[0].serverTimestamp = Date.now();
            filtered[0].posX = data.posX;
            filtered[0].posY = data.posY;
            filtered[0].dirX = data.dirX;
            filtered[0].dirY = data.dirY;
        }
        
        io.sockets.emit('receivedMessage', players);
    });
    
});

server.listen(80);
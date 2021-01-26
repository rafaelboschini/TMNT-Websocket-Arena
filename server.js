const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine','html');

app.use('/', (req, res) => {
    res.render('index.html');
});

var players = [];
var pizzaloc = {x:0,y:0};

// Add a connect listener
io.on('connection', socket => {
    socket.emit('token', socket.id); //send socketid to client

    // Disconnect listener
    socket.on('disconnect', () => {
        players = players.filter(item=> item.userId!==socket.id); // Remove disconected users
    });
    
    socket.on('sendPos', data => {
        var filtered = players.filter(item=> item.userId===socket.id);

        if(filtered.length===0) {   
            data.serverTimestamp = Date.now();         
            data.userId = socket.id;
            data.score = 0;
            switch(players.length+1){
                case 1:
                    data.skin = "raphael";
                    break;
                case 2:
                    data.skin = "donatello";
                    break;
                case 3:
                    data.skin =  "michelangelo";
                    break;
                case 4:
                    data.skin = "leonardo";
                    break;
                default:
                    data.skin = "ghost"; //this skin is for specters waiting to play
            }

            players.push(data);
        } else {            
            filtered[0].serverTimestamp = Date.now();
            filtered[0].posX = data.posX;
            filtered[0].posY = data.posY;
            filtered[0].dirX = data.dirX;
            filtered[0].dirY = data.dirY;
        }
        
        if(pizzaloc.x === 0 && pizzaloc.y === 0){
            gen_pizza();
        }

        //Clear chat
        for(var x=0;x<players.length;x++){
            if(players[x].chat){
                var date1 = new Date(players[x].chat.date);

                if(Math.floor((new Date() - date1)/1000) > 3)
                    players[x].chat = undefined;
            }
        }

        io.sockets.emit('pizzaLocation',pizzaloc);
        io.sockets.emit('updatePlayers', players);
    });

    socket.on('catch', () => {
        var filtered = players.filter(item=> item.userId===socket.id);
        filtered[0].score += 1;
        gen_pizza();

        io.sockets.emit('updatePlayers', players);
        io.sockets.emit('pizzaLocation',pizzaloc);
    });

    socket.on('sendChat', (data) => {
        var filtered = players.filter(item=> item.userId===socket.id);
        if(filtered.length===0)return false;
        
        filtered[0].chat = {message: data, date: Date.now() };

        io.sockets.emit('updatePlayers', players);
    });
});

function gen_pizza() {
    do {
        pizzaloc.x = Math.floor(Math.random() * 20) + 1;
        pizzaloc.y = Math.floor(Math.random() * 16) + 4;
    } while (check_collision(pizzaloc.x, pizzaloc.y));

    pizzaloc.spritePosition = Math.floor(Math.random() * 4) + 0; // get position from 0-4    
}

function check_collision(x, y) {
    var foundCollision = false;

    //collision with de edges
    if (
        x < 1 ||
        x > 20 ||
        y < 2 ||
        y > 20 ||
        (y > 0 && y < 4 && (x == 20 || x == 19)) || //right corner
        (y > 0 && y < 4 && (x == 2 || x == 3)) || //left corner
        (y > 18 && (x == 2 || x == 3)) || //left corner
        (x > 17 && (y == 19 || y == 20)) || //left corner
        (x > 19 && (y == 17 || y == 18)) //left corner 2
    ) {
        foundCollision = true;
    }

    return foundCollision;
}

server.listen(process.env.PORT || 3000);
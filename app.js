var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('main', { title: '온라인 빙고 게임', username: req.query.username });
});

var users = {};
var user_count = 0;
var turn_count = 0;

io.on('connection', function (socket) {

    console.log('user connected : ', socket.id);
    socket.on('join', (data) => {
        // 들어오면 기본 세팅 
        var username = data.username;
        socket.username = username;

        users[user_count] = {};
        users[user_count].id = socket.id;
        users[user_count].name = username;
        users[user_count].turn = false;
        user_count++;

        io.emit('update_users', users, user_count);
    })

    socket.on('game_start', (data) => {
        socket.broadcast.emit("game_started", data);
        users[turn_count].turn = true;
        // 0번째 유저가 먼저 시작함 
        io.emit('update_users', users);
    })

    socket.on('select', function (data) {
        socket.broadcast.emit("check_number", data);

        users[turn_count].turn = false;
        turn_count++;

        if (turn_count >= user_count) {
            turn_count = 0;
        }
        users[turn_count].turn = true;

        io.sockets.emit('update_users', users);
    });

    socket.on('disconnect', function () {
        console.log('user disconnected : ', socket.id, socket.username);
        for (var i = 0; i < user_count; i++) {
            if (users[i].id == socket.id)
                delete users[i];
        }

        user_count--;
        io.emit('update_users', users, user_count);
    });
});

http.listen(3000, function () {
    console.log('server connected .. ');
})
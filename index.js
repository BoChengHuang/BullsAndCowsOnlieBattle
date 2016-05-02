var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = process.env.PORT || 1234;
var io = require('socket.io')(http);

var userList = [];
var battleList = [];
var isReady = 0;
var isP1Turn = true;
var p1ID;
var p2ID;
var p1Ans;
var p2Ans;
var bulls = 0;
var cows = 0;

app.use(express.static(__dirname + '/public'));

http.listen(port, function () {
    console.log('Listening at * 1234...');
});

io.on('connection', function (socket) {
    console.log('A Client connected...');
    
    socket.on('id', function (id) {
        console.log(id + ' connected...');
        userList.push(id);
        console.log(userList);
        io.emit('userList', userList);
    });
    
    socket.on('play', function (msgin) {
        console.log(msgin.id + ' play with ' + msgin.enemy);
        battleList.push(msgin.id);
        battleList.push(msgin.enemy);
        console.log(battleList);
        io.emit('battle', {id: msgin.id, enemy: msgin.enemy});
    });
    
    socket.on('disconnect', function () {
        console.log('A Client disconnected...');
        userList = [];
        battleList = [];
        io.emit('gameDisconnect');
        isReady = 0;
    });
    
    socket.on('ready', function (msgin) {
        p1ID = battleList[0];
        p2ID = battleList[1];
        if (msgin.id == p1ID) {
            p1Ans = msgin.ans;
        } else if (msgin.id == p2ID) {
            p2Ans = msgin.ans;
        } 
        isReady++;
        if (isReady == 2) {
            console.log('P1: ' + p1Ans);
            console.log('P2: ' + p2Ans);
            play();
        }
    });
    
    socket.on('guess', function (msgin) {
        if (msgin.id == p1ID) {
            checkAns(p2Ans, msgin.guess);
            isP1Turn = false;
            if (bulls == 4) {
                io.emit('over', p1ID);
            }
        } else if (msgin.id == p2ID) {
            checkAns(p1Ans, msgin.guess);
            isP1Turn = true;
            if (bulls == 4) {
                io.emit('over', p2ID);
            }
        }
        socket.emit('result', {a: bulls, b: cows});
        if (bulls != 4) {
            play();
        }
    });
    
    function play() {        
        if (isP1Turn) {
            io.emit('guessTurn', p1ID);
        } else {
            io.emit('guessTurn', p2ID);
        }
    }
    
    function checkAns(ans, guess) {
        var ans_str = [];
        var guess_str = [];
        bulls = 0;
        cows = 0;
        
        ans_str[0] = Math.floor(ans / 1000);
        ans_str[1] = Math.floor((ans / 100) % 10);
        ans_str[2] = Math.floor((ans / 10) % 10);
        ans_str[3] = Math.floor(ans % 10);
        
        guess_str[0] = Math.floor(guess / 1000);
        guess_str[1] = Math.floor((guess / 100) % 10);
        guess_str[2] = Math.floor((guess / 10) % 10);
        guess_str[3] = Math.floor(guess % 10);
   
        for (var i = 0; i < 4; i++) {
            if (guess_str[i] == ans_str[i]) {
                bulls++;
            } else {
                for (var j = 0; j < 4; j++) {
                    if (guess_str[i] == ans_str[j]) {
                        cows++;
                    } 
                }
            }
        }
    }
    
});
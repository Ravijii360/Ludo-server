const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let gameState = {
    players: [],
    activePlayerIndex: 0,
    currentRoll: 0,
    pawnStates: {
        red: [-1, -1, -1, -1],
        green: [-1, -1, -1, -1],
        yellow: [-1, -1, -1, -1],
        blue: [-1, -1, -1, -1]
    }
};

io.on('connection', (socket) => {
    socket.emit('init-state', gameState);

    socket.on('join-game', (color) => {
        if (!gameState.players.includes(color) && gameState.players.length < 4) {
            gameState.players.push(color);
            io.emit('update-state', gameState);
        }
    });

    socket.on('request-roll', (color) => {
        const activeColor = gameState.players[gameState.activePlayerIndex];
        if (color === activeColor && gameState.currentRoll === 0) {
            gameState.currentRoll = Math.floor(Math.random() * 6) + 1;
            io.emit('update-state', gameState);
        }
    });

    socket.on('request-move', ({ color, pawnIndex }) => {
        const activeColor = gameState.players[gameState.activePlayerIndex];
        if (color === activeColor && gameState.currentRoll > 0) {
            let state = gameState.pawnStates[color][pawnIndex];
            if (state === -1 && gameState.currentRoll === 6) {
                gameState.pawnStates[color][pawnIndex] = 0;
            } else if (state >= 0 && state + gameState.currentRoll <= 56) {
                gameState.pawnStates[color][pawnIndex] += gameState.currentRoll;
            }
            
            gameState.currentRoll = 0;
            gameState.activePlayerIndex = (gameState.activePlayerIndex + 1) % gameState.players.length;
            io.emit('update-state', gameState);
        }
    });

    socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

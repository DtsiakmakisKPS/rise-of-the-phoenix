export function gamesStateListeners(game) {
    // Game State Updates
    game.socket.on('phaseChange', (data) => {
        const { phase, phaseEndTime } = data;
        console.log(`Phase changed to: ${phase}`);
        const remainingTime = Math.floor(phaseEndTime / 1000);
        console.log(`Remaining time: ${remainingTime}`);

        switch(phase) {
            case 'PRE_GAME':
                game.startLobby(remainingTime);
                break;
            case 'GAME': 
                game.startGame(remainingTime);
                break;
            case 'GAME_BREAK':
                game.stopGame(remainingTime);
                break;
        }
    });
}
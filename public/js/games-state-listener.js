export function gamesStateListeners(game) {
    // Game State Updates
    game.socket.on('phaseChange', (data) => {
        const { phase, phaseEndTime, roundCount } = data;
        console.log(`Phase changed to: ${phase} in round ${roundCount}`);
        const remainingTime = Math.floor(phaseEndTime / 1000);
        console.log(`Remaining time: ${remainingTime}`);

        switch(phase) {
            case 'PRE_GAME':
                game.startLobby(remainingTime, roundCount);
                break;
            case 'GAME': 
                game.startGame(remainingTime, roundCount);
                break;
            case 'GAME_BREAK':
                game.stopGame(remainingTime, roundCount);
                break;
        }
    });
}
export function gamesStateListeners(game) {
    // Game State Updates
    game.socket.on('phaseChange', (data) => {
        const { phase, phaseEndTime } = data;
        console.log(`Phase changed to: ${phase}`);
        const remainingTime = Math.max(0, Math.floor((phaseEndTime - Date.now()) / 1000));

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
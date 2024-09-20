export function gamesStateListeners(game) {
    // Game State Updates
    game.socket.on('phaseChange', (data) => {
        const { phase, phaseEndTime } = data;
        console.log(`Phase changed to: ${phase}`);
        const remainingTime = Math.max(0, Math.floor((phaseEndTime - Date.now()) / 1000));

        if (phase === 'PRE_GAME') {
            game.startLobby(remainingTime);
        } else if (phase === 'GAME') {
            game.startGame(remainingTime);
        } else if (phase === 'GAME_BREAK') {
            game.stopGame(remainingTime);
        }
    });
}
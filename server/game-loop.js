export default class GameLoop {
    constructor(io) {
        this.io = io;

        // Phase durations in milliseconds
        this.PRE_GAME_DURATION = 10 * 1000;      // 10 seconds
        this.GAME_DURATION = 60 * 1000;         // 150 seconds (2.5 minutes)
        this.GAME_BREAK_DURATION = 2 * 1000;     // 2 seconds

        this.currentPhase = 'PRE_GAME'; // Possible phases: 'PRE_GAME', 'GAME', 'GAME_BREAK'
        this.phaseTimeout = null;
        this.phaseEndTime = null;

        // Start the game loop
        this.startGameLoop();
    }

    startGameLoop() {
        this.setPhase('PRE_GAME', this.PRE_GAME_DURATION, this.startGamePhase.bind(this));
    }

    startGamePhase() {
        this.setPhase('GAME', this.GAME_DURATION, this.startGameBreak.bind(this));
    }

    startGameBreak() {
        this.setPhase('GAME_BREAK', this.GAME_BREAK_DURATION, this.startGameLoop.bind(this));
    }

    setPhase(phaseName, duration, nextPhaseCallback) {
        this.currentPhase = phaseName;
        this.phaseEndTime = Date.now() + duration; // Record expected end time

        this.io.emit('phaseChange', {
            phase: this.currentPhase,
            phaseEndTime: this.phaseEndTime
        });
        console.log(`Phase changed to: ${this.currentPhase}`);

        // Clear any existing timeout
        if (this.phaseTimeout) {
            clearTimeout(this.phaseTimeout);
        }

        // Set timeout for the next phase
        this.phaseTimeout = setTimeout(() => {
            nextPhaseCallback();
        }, duration);
    }

    getCurrentPhase() {
        return this.currentPhase;
    }

    getRemainingTime() {
        console.log(`Remaining time: ${this.phaseEndTime - Date.now()}`);
        if (this.phaseEndTime) {
            return Math.max(0, this.phaseEndTime - Date.now());
        } else {
            return 0;
        }
    }

    // Clean up when necessary
    stop() {
        if (this.phaseTimeout) {
            clearTimeout(this.phaseTimeout);
        }
    }
}

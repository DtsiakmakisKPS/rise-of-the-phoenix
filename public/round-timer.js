const ROUND_TIME = 150;

export class RoundTimer {
    constructor(gameScene) {
        this.gameScene = gameScene;
        this.roundTime = ROUND_TIME;
        this.roundTimerString = null;
        this.roundTimerEvent = null;
    }

    initiateRoundTimer() {
        this.roundTimerString = this.gameScene.add.text(20, 20, 'Countdown: ' + this.formatTime(this.roundTime), {
            font: '200px Arial',
            fill: '#ffffff',
        });
        this.roundTimerEvent = this.gameScene.time.addEvent({
            delay: 1000,
            callback: this.onRoundTimerUpdate,
            callbackScope: this,
            loop: true,
        });
        this.roundTimerEvent.paused = true;
    }

    startRoundTimer() {
        this.roundTime = ROUND_TIME;
        this.roundTimerEvent.paused = false;
    }

    onRoundTimerUpdate() {
        if (this.roundTime <= 0) {
            this.roundTimerEvent.paused = true;
        } else {
            this.roundTime -= 1; // One second
            this.roundTimerString.setText('Countdown: ' + this.formatTime(this.roundTime));
        }
    }

    formatTime(seconds) {
        let minutes = Math.floor(seconds / 60);
        let partInSeconds = seconds % 60;
        partInSeconds = partInSeconds.toString().padStart(2, '0');
        return `${minutes}:${partInSeconds}`;
    }
}

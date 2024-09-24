import { PlayerFeedback } from "../components/player-feedback.js";

export class HUD extends Phaser.Scene {
    constructor() {
        super({ key: 'HUD', active: true });
    }

    create() {
        const Game = this.scene.get('scene-game');

        const gameGoal = new PlayerFeedback(this, 'Find the last free seat to win!', { x: 0, y: -40}, 'center');
        const preGameCounter = new PlayerFeedback(
            this,
            'Round 1 starts in: ',
            null,
            'center'
        );
        preGameCounter.setBackgroundColor('#000', 0.3);

        const roundTimer = new PlayerFeedback(
            this,
            'Round Timer: ',
            null,
            'top-right'
        );
        roundTimer.setBackgroundColor('#001e3c', 0.8);

        const roundOverFeedback = new PlayerFeedback(this, 'Round Over!', null, 'center');
        roundOverFeedback.setBackgroundColor('#000', 0.3);


        Game.events.on('startLobby', function (remainingTime, roundCount) {
            console.log('startLobby', remainingTime);
            let timer = remainingTime;
            if(remainingTime === 'NaN' || !remainingTime) {
                timer = 10;
            }
            roundOverFeedback.removeFeedback();
            gameGoal.setDuration(timer);
            gameGoal.render();
            preGameCounter.addCountdown('preGameEnd', timer);
            preGameCounter.setMessage(`Round ${roundCount} starts in: `);
            preGameCounter.render();
        }, this);

        Game.events.on('startGame', function (remainingTime, roundCount) {
            console.log('startGame', remainingTime);
            let timer = remainingTime;
            if(remainingTime === 'NaN' || !remainingTime) {
                timer = 60;
            }
            preGameCounter.removeFeedback();
            gameGoal.removeFeedback();
            roundTimer.addCountdown('roundTimerEnd', timer);
            roundTimer.render();
        }, this);

        Game.events.on('stopGame', function (remainingTime, roundCount) {
            console.log('stopGame', remainingTime);
            let timer = remainingTime;
            if(remainingTime === 'NaN' || !remainingTime) {
                timer = 2;
            }
            roundTimer.removeFeedback();
            roundOverFeedback.setDuration(timer)
            roundOverFeedback.render();
        }, this);
    }
}
export class PlayerFeedback {
    constructor(
        hudScene,
        message = '',
        sizes = { width: 800, height: 600 },
        position = null,
    ) {
        // Core properties
        this.hudScene = hudScene;
        this.message = message;
        this.sizes = sizes;
        this.position = position;
        this.duration = 2;
        this.type = 'default';

        // Visual elements
        this.textNode = null;
        this.backgroundNode = null;

        // Styles
        this.textStyle = { font: '200px Arial', fill: '#fff' };
        this.backgroundColor = { color: '#000', alpha: 1 };

        // Timer properties
        this.eventName = 'feedbackEvent';
        this.timerEvent = null;
        this.countdownLength = 10;
    }

    // Renders the feedback with optional countdown
    render() {
        const { textWidth, textHeight } = this.renderMessage();
        this.renderBackground(textWidth + 100, textHeight + 100);

        if (this.type === 'countdown') {
            this.startCountdownTimer();
        } else if (this.type === 'default') {
            this.setExpireTime(this.duration);
        }
    }

    // Renders the message and returns its dimensions
    renderMessage(textStyle = this.textStyle) {
        const { x, y } = this.getPosition();

        let displayMessage = this.message;

        if (this.type === 'countdown') {
            const formattedTime = this.formatTime(this.countdownLength);
            displayMessage += ` ${formattedTime}`;
        }

        this.textNode = this.hudScene.add.text(x, y, displayMessage, textStyle);
        this.textNode.setOrigin(0.5, 0.5);
        this.textNode.setDepth(2);

        return { textWidth: this.textNode.width, textHeight: this.textNode.height };
    }

    // Renders the background rectangle
    renderBackground(width, height, color = this.backgroundColor.color, alpha = this.backgroundColor.alpha) {
        const { x, y } = this.getPosition();
        const convertedColor = color.startsWith('#') ? color.replace('#', '0x') : color;
        this.backgroundNode = this.hudScene.add.rectangle(x, y, width, height, convertedColor, alpha);
        this.backgroundNode.setOrigin(0.5, 0.5);
        this.backgroundNode.setDepth(1);
    }

    // Determines the position of the feedback
    getPosition() {
        if (this.position === null) {
            return {
                x: this.sizes.width / 2,
                y: this.sizes.height / 2,
            };
        } else {
            return {
                x: this.position.x,
                y: this.position.y,
            };
        }
    }

    // Starts the countdown timer
    startCountdownTimer() {
        this.updateMessageWithTime();

        this.timerEvent = this.hudScene.time.addEvent({
            delay: 1000,
            callback: this.onTimerUpdate,
            callbackScope: this,
            loop: true
        });
    }

    // Called every second to update the timer
    onTimerUpdate() {
        this.countdownLength -= 1;

        if (this.countdownLength <= 0) {
            this.timerEvent.remove(false);
            this.removeFeedback();
            if(this.eventName) {
                this.hudScene.events.emit(this.eventName);
            }
        } else {
            this.updateMessageWithTime();
        }
    }

    // Updates the message with the remaining time
    updateMessageWithTime() {
        const formattedTime = this.formatTime(this.countdownLength);
        this.textNode.setText(`${this.message} ${formattedTime}`);

        // Adjust the background size if needed
        const newWidth = this.textNode.width + 100;
        const newHeight = this.textNode.height + 100;
        this.backgroundNode.setSize(newWidth, newHeight);
    }

    // Formats the time as MM:SS
    formatTime(seconds) {
        let minutes = Math.floor(seconds / 60);
        let partInSeconds = seconds % 60;
        partInSeconds = partInSeconds.toString().padStart(2, '0');
        return `${minutes}:${partInSeconds}`;
    }

    // Removes the feedback elements and clears events
    removeFeedback() {
        if (this.textNode) this.textNode.destroy();
        if (this.backgroundNode) this.backgroundNode.destroy();
        if (this.expireTimeEvent) this.hudScene.time.removeEvent(this.expireTimeEvent);
        if (this.timerEvent) this.hudScene.time.removeEvent(this.timerEvent);
    }

    // Sets a duration for non-timer feedback
    setExpireTime(duration = 1000) {
        this.expireTimeEvent = this.hudScene.time.addEvent({
            delay: duration * 1000,
            callback: this.removeFeedback,
            callbackScope: this,
            loop: false
        });
    }

    // Updates the message text
    setMessage(message) {
        this.message = message;
        if (this.textNode) {
            this.updateMessageWithTime();
        }
    }

    // Changes the text color
    setTextColor(color) {
        this.textStyle.fill = color;
        if (this.textNode) {
            this.textNode.setStyle({ fill: color });
        }
    }

    // Changes the duration of the feedback
    setDuration(duration) {
        this.duration = duration;
    }

    // Changes the background color
    setBackgroundColor(color, alpha = 1) {
        this.backgroundColor = { color: color, alpha: alpha };
        if (this.backgroundNode) {
            this.backgroundNode.setFillStyle(color, alpha);
        }
    }

    addCountdown(eventName, countdownLength) {
        this.eventName = eventName;
        this.countdownLength = countdownLength;
        this.type = 'countdown';
    }
}

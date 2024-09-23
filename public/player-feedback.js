export class PlayerFeedback {
    constructor(
        hudScene,
        message = '',
        position = null,
        align = 'center',
        margin = { x: 20, y: 20 }
    ) {
        // Core properties
        this.hudScene = hudScene;
        this.message = message;
        this.position = position;
        this.align = align;
        this.margin = margin;
        this.duration = 2;
        this.type = 'default';

        // Visual elements
        this.textNode = null;
        this.backgroundNode = null;

        // Styles
        this.textStyle = { font: '25px Arial', fill: '#fff' };
        this.backgroundColor = { color: '#000', alpha: 1 };

        // Timer properties
        this.eventName = 'feedbackEvent';
        this.timerEvent = null;
        this.countdownLength = 10;

        this.hudScene.scale.on('resize', this.onResize, this);
    }

    // Renders the feedback with optional countdown
    render() {
        this.removeFeedback();
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

        const origin = this.getOrigin();
        this.textNode.setOrigin(origin.x, origin.y);

        this.textNode.setDepth(2);

        return { textWidth: this.textNode.width, textHeight: this.textNode.height };
    }

    // Renders the background rectangle
    renderBackground(width, height, color = this.backgroundColor.color, alpha = this.backgroundColor.alpha) {
        const { x, y } = this.getPosition();
        const convertedColor = color.startsWith('#') ? color.replace('#', '0x') : color;
        //this.backgroundNode = this.hudScene.add.rectangle(x, y, width, height, convertedColor, alpha);
        this.backgroundNode = null

        const origin = this.getOrigin();
        //this.backgroundNode.setOrigin(origin.x, origin.y);

        //this.backgroundNode.setDepth(1);
    }

    // Determines the position of the feedback
    getPosition() {
        const canvasWidth = this.hudScene.scale.width;
        const canvasHeight = this.hudScene.scale.height;

        let x = canvasWidth / 2;
        let y = canvasHeight / 2;

        if (this.position) {
            x = x + this.position.x;
            y = y + this.position.y;
        }

        if (this.align === 'top-right') {
            x = canvasWidth - this.margin.x;
            y = this.margin.y;
        } else if (this.align === 'top-left') {
            x = this.margin.x;
            y = this.margin.y;
        } else if (this.align === 'bottom-left') {
            x = this.margin.x;
            y = canvasHeight - this.margin.y;
        } else if (this.align === 'bottom-right') {
            x = canvasWidth - this.margin.x;
            y = canvasHeight - this.margin.y;
        } else if (this.align === 'top-center') {
            x = canvasWidth / 2;
            y = this.margin.y;
        } else if (this.align === 'bottom-center') {
            x = canvasWidth / 2;
            y = canvasHeight - this.margin.y;
        }

        return { x, y };
    }

    getOrigin() {
        switch (this.align) {
            case 'top-right':
                return { x: 1, y: 0 };
            case 'top-left':
                return { x: 0, y: 0 };
            case 'bottom-left':
                return { x: 0, y: 1 };
            case 'bottom-right':
                return { x: 1, y: 1 };
            case 'top-center':
                return { x: 0.5, y: 0 };
            case 'bottom-center':
                return { x: 0.5, y: 1 };
            default:
                return { x: 0.5, y: 0.5 };
        }
    }

    onResize(gameSize, baseSize, displaySize, resolution) {
        // Update position based on new canvas size
        const { x, y } = this.getPosition();
        if (this.textNode) {
            this.textNode.setPosition(x, y);
        }
        if (this.backgroundNode) {
            this.backgroundNode.setPosition(x, y);
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
        try {
            this.textNode.setText(`${this.message} ${formattedTime}`);
        }   catch (e) {
            console.log(e);
        }

        /*// Adjust the background size if needed
        const newWidth = this.textNode.width + 100;
        const newHeight = this.textNode.height + 100;
        this.backgroundNode.setSize(newWidth, newHeight);*/
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

    setPermanent(permanent = true) {
        this.type = permanent ? 'permanent' : 'default';
    }
}

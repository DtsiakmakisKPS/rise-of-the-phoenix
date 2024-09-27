export class MusicController {
    backgroundMusic = null;

    constructor(sound) {
        this.backgroundMusic = sound.add('backgroundMusic', { loop: true });
        this.backgroundMusic.play();

        const volumeSlider = document.querySelector('.volume-slider');
        this.backgroundMusic.setVolume(volumeSlider.value);

        volumeSlider.addEventListener('input', (event) => {
            const volume = event.target.value;
            this.backgroundMusic.setVolume(volume);
            if (volumeOnIcon.classList.contains('hidden')) {
                volumeOnIcon.classList.remove('hidden');
                volumeOffIcon.classList.add('hidden');
            }
        });

        const volumeOnIcon = document.getElementById('volumeOn');
        const volumeOffIcon = document.getElementById('volumeOff');
        const volumeButton = document.querySelector('.volume-button');
        volumeButton.addEventListener('click', (event) => {
            event.preventDefault();
            const volumeOn = !volumeOnIcon.classList.contains('hidden');
            if (volumeOn) {
                volumeOnIcon.classList.add('hidden');
                volumeOffIcon.classList.remove('hidden');
                volumeSlider.value = 0;
                this.backgroundMusic.setVolume(0);
            } else {
                volumeOnIcon.classList.remove('hidden');
                volumeOffIcon.classList.add('hidden');
                volumeSlider.value = 0.2;
                this.backgroundMusic.setVolume(0.2);
            }
        });
    }

    stopMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
    }
}

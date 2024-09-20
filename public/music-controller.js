export function musicController(sound) {
    const backgroundMusic = sound.add('backgroundMusic', { loop: true });
    backgroundMusic.play();

    const volumeSlider = document.querySelector('.volume-slider');
    backgroundMusic.setVolume(volumeSlider.value);

    volumeSlider.addEventListener('input', (event) => {
        const volume = event.target.value;
        backgroundMusic.setVolume(volume);
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
            backgroundMusic.setVolume(0);
        } else {
            volumeOnIcon.classList.remove('hidden');
            volumeOffIcon.classList.add('hidden');
            volumeSlider.value = 0.2;
            backgroundMusic.setVolume(0.2);
        }
    });
}

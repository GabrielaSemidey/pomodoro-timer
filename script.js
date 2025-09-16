// ==========================================
// 🍅 POMODORO TIMER LOGIC - VERSIÓN COMPLETA FINAL
// Creado por Gabchan con mucho código y café ☕
// ==========================================

// Variables globales (nuestro estado principal)
let timer = {
    isRunning: false,
    isPaused: false,
    currentMode: 'work', // 'work', 'break', 'longBreak'
    timeLeft: 25 * 60, // 25 minutos en segundos
    totalTime: 25 * 60,
    sessionCount: 1,
    currentCycle: 1, // Qué pomodoro del ciclo estamos (1-4)
    completedCycles: 0,
    timerInterval: null
};

// Configuración (valores por defecto)
let settings = {
    workTime: 25, // minutos
    breakTime: 5, // minutos
    longBreakTime: 30, // minutos para descanso largo
    soundEnabled: true,
    soundType: 'beep', // 'beep', 'nature', 'zen'
    volume: 0.5 // 0.0 to 1.0
};

// Sistema de estadísticas
let stats = {
    todayPomodoros: 0,
    totalFocusTime: 0, // en minutos
    currentStreak: 0,
    lastActiveDate: null,
    weeklyData: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
    }
};

// Referencias a elementos del DOM
const elements = {
    container: document.getElementById('container'),
    timeDisplay: document.getElementById('timeDisplay'),
    currentMode: document.getElementById('currentMode'),
    sessionCount: document.getElementById('sessionCount'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    playPauseIcon: document.getElementById('playPauseIcon'),
    resetBtn: document.getElementById('resetBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    statsBtn: document.getElementById('statsBtn'),
    
    // Configuración
    settingsPanel: document.getElementById('settingsPanel'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    workTimeInput: document.getElementById('workTime'),
    breakTimeInput: document.getElementById('breakTime'),
    longBreakTimeInput: document.getElementById('longBreakTime'),
    soundToggle: document.getElementById('soundToggle'),
    soundType: document.getElementById('soundType'),
    volumeControl: document.getElementById('volumeControl'),
    volumeValue: document.getElementById('volumeValue'),
    saveSettingsBtn: document.getElementById('saveSettings'),
    
    // Estadísticas
    statsPanel: document.getElementById('statsPanel'),
    closeStatsBtn: document.getElementById('closeStatsBtn'),
    todayPomodoros: document.getElementById('todayPomodoros'),
    totalFocusTime: document.getElementById('totalFocusTime'),
    currentStreak: document.getElementById('currentStreak'),
    motivationText: document.getElementById('motivationText'),
    
    // Ciclos
    cycleIndicator: document.getElementById('cycleIndicator'),
    dot1: document.getElementById('dot1'),
    dot2: document.getElementById('dot2'),
    dot3: document.getElementById('dot3'),
    dot4: document.getElementById('dot4'),
    
    // Modal de transición
    transitionModal: document.getElementById('transitionModal'),
    modalTitle: document.getElementById('modal-title'),
    completionMessage: document.getElementById('completionMessage'),
    completedTimeValue: document.getElementById('completedTimeValue'),
    nextSessionValue: document.getElementById('nextSessionValue'),
    continueBtn: document.getElementById('continueBtn'),
    continueBtnText: document.getElementById('continueBtnText'),
    extraTimeBtn: document.getElementById('extraTimeBtn'),
    skipBtn: document.getElementById('skipBtn'),
    skipBtnText: document.getElementById('skipBtnText'),
    modalTodayCount: document.getElementById('modalTodayCount'),
    modalStreak: document.getElementById('modalStreak'),
    
    progressCircle: document.querySelector('.progress-circle')
};

// Sistema de sonidos avanzado
const sounds = {
    // Crear contexto de audio
    audioContext: null,
    
    // Inicializar contexto de audio
    init: function() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    
    // Sonido beep básico
    createBeep: function(frequency = 800, duration = 200) {
        if (!settings.soundEnabled) return;
        
        this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(settings.volume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    },
    
    // Sonido zen (campanas)
    createZen: function() {
        if (!settings.soundEnabled) return;
        
        this.createBeep(523, 300); // Do
        setTimeout(() => this.createBeep(659, 300), 150); // Mi
        setTimeout(() => this.createBeep(784, 400), 300); // Sol
    },
    
    // Sonido naturaleza (ondas)
    createNature: function() {
        if (!settings.soundEnabled) return;
        
        // Simular ondas con frecuencias bajas
        this.createBeep(150, 500);
        setTimeout(() => this.createBeep(120, 600), 200);
        setTimeout(() => this.createBeep(180, 400), 400);
    },
    
    // Reproducir sonido según configuración
    play: function(type = 'session') {
        if (!settings.soundEnabled) return;
        
        switch (settings.soundType) {
            case 'zen':
                this.createZen();
                break;
            case 'nature':
                this.createNature();
                break;
            default:
                if (type === 'session') {
                    this.createBeep(600, 300);
                } else {
                    this.createBeep(400, 100);
                }
        }
    }
};

// Función para formatear tiempo (convierte segundos a MM:SS)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Formatear tiempo en horas y minutos para estadísticas
function formatTotalTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

// Función para actualizar estadísticas
function updateStats() {
    // Actualizar elementos en pantalla
    elements.todayPomodoros.textContent = stats.todayPomodoros;
    elements.totalFocusTime.textContent = formatTotalTime(stats.totalFocusTime);
    elements.currentStreak.textContent = stats.currentStreak;
    
    // Actualizar progreso semanal
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => {
        const count = stats.weeklyData[day];
        const maxDaily = 12; // Máximo 12 pomodoros por día para la escala
        const percentage = Math.min((count / maxDaily) * 100, 100);
        
        const progressFill = document.querySelector(`[data-day="${day}"]`);
        const dayCount = document.getElementById(`${day}Count`);
        
        if (progressFill) {
            progressFill.style.height = `${percentage}%`;
        }
        if (dayCount) {
            dayCount.textContent = count;
        }
    });
    
    // Actualizar mensaje motivacional
    updateMotivationalMessage();
}

// Mensajes motivacionales
function updateMotivationalMessage() {
    const messages = {
        start: [
            "¡Comienza tu primer pomodoro! 🚀",
            "¡Hora de enfocarse y brillar! ✨",
            "¡Tu productividad te está esperando! 💪"
        ],
        progress: [
            "¡Vas súper bien! Sigue así 🔥",
            "¡Cada pomodoro te acerca a tus metas! 🎯",
            "¡Tu concentración es impresionante! 🌟",
            "¡Eres imparable hoy! 💎"
        ],
        achievement: [
            "¡WOW! ¡Más de 5 pomodoros completados! 🏆",
            "¡Eres oficialmente una máquina de productividad! ⚡",
            "¡Este nivel de enfoque es épico! 👑",
            "¡Gabchan está en modo bestia! 🦁"
        ],
        streak: [
            `¡${stats.currentStreak} días seguidos! ¡Increíble! 🔥`,
            "¡Tu constancia es inspiradora! 🌈",
            "¡Cada día eres más fuerte! 💪"
        ]
    };
    
    let selectedMessage;
    
    if (stats.todayPomodoros === 0) {
        selectedMessage = messages.start[Math.floor(Math.random() * messages.start.length)];
    } else if (stats.todayPomodoros >= 8) {
        selectedMessage = messages.achievement[Math.floor(Math.random() * messages.achievement.length)];
    } else if (stats.currentStreak > 1) {
        selectedMessage = messages.streak[Math.floor(Math.random() * messages.streak.length)];
    } else {
        selectedMessage = messages.progress[Math.floor(Math.random() * messages.progress.length)];
    }
    
    elements.motivationText.textContent = selectedMessage;
}

// Función para obtener el día de la semana
function getCurrentDay() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
}

// Función para completar un pomodoro (actualizar estadísticas)
function completePomodoro() {
    stats.todayPomodoros++;
    stats.totalFocusTime += settings.workTime;
    
    // Actualizar datos semanales
    const today = getCurrentDay();
    stats.weeklyData[today]++;
    
    // Actualizar racha
    const today_date = new Date().toDateString();
    if (stats.lastActiveDate !== today_date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (stats.lastActiveDate === yesterday.toDateString()) {
            stats.currentStreak++;
        } else {
            stats.currentStreak = 1;
        }
        stats.lastActiveDate = today_date;
    }
    
    updateStats();
}

// Función para actualizar indicadores de ciclo
function updateCycleIndicator() {
    const dots = [elements.dot1, elements.dot2, elements.dot3, elements.dot4];
    
    // Resetear todas las clases
    dots.forEach(dot => {
        dot.classList.remove('active', 'completed');
    });
    
    // Marcar completados
    for (let i = 0; i < timer.currentCycle - 1; i++) {
        dots[i].classList.add('completed');
    }
    
    // Marcar actual
    if (timer.currentCycle <= 4) {
        dots[timer.currentCycle - 1].classList.add('active');
    }
    
    // Actualizar texto
    const cycleText = elements.cycleIndicator.querySelector('.cycle-text');
    if (timer.currentMode === 'longBreak') {
        cycleText.textContent = '¡Descanso largo merecido!';
    } else {
        cycleText.textContent = `Pomodoro ${timer.currentCycle} de 4`;
    }
}

// Función para actualizar la interfaz visual
function updateDisplay() {
    // Actualizar el tiempo mostrado
    elements.timeDisplay.textContent = formatTime(timer.timeLeft);
    
    // Actualizar el contador de sesiones
    elements.sessionCount.textContent = timer.sessionCount;
    
    // Actualizar el modo actual
    let modeText = '';
    switch (timer.currentMode) {
        case 'work':
            modeText = 'Trabajo';
            break;
        case 'break':
            modeText = 'Descanso';
            break;
        case 'longBreak':
            modeText = 'Descanso Largo';
            break;
    }
    elements.currentMode.textContent = `Modo: ${modeText}`;
    
    // Cambiar colores según el modo
    elements.container.classList.remove('break-mode', 'long-break-mode');
    if (timer.currentMode === 'break') {
        elements.container.classList.add('break-mode');
    } else if (timer.currentMode === 'longBreak') {
        elements.container.classList.add('long-break-mode');
    }
    
    // Actualizar el círculo de progreso
    updateProgressCircle();
    
    // Actualizar indicador de ciclo
    updateCycleIndicator();
}

// Función para animar el círculo de progreso
function updateProgressCircle() {
    const circumference = 879.64; // 2 * π * 140 (radio del círculo)
    const progress = (timer.totalTime - timer.timeLeft) / timer.totalTime;
    const offset = circumference - (progress * circumference);
    
    elements.progressCircle.style.strokeDashoffset = offset;
}

// Función para mostrar modal de transición
function showTransitionModal() {
    // Determinar el contexto actual
    const isWorkSession = timer.currentMode === 'work';
    const completedTime = formatTime(timer.totalTime);
    
    // Configurar contenido del modal según el contexto
    if (isWorkSession) {
        // Acabamos de completar trabajo
        elements.modalTitle.textContent = '🎉 ¡Pomodoro Completado!';
        elements.completionMessage.textContent = '¡Excelente trabajo! Has completado tu sesión de enfoque.';
        elements.completedTimeValue.textContent = completedTime;
        
        // Determinar siguiente sesión
        if (timer.currentCycle >= 4) {
            elements.nextSessionValue.textContent = `Descanso largo de ${settings.longBreakTime} minutos`;
            elements.continueBtnText.textContent = 'Iniciar Descanso Largo';
            elements.skipBtnText.textContent = 'Nuevo Ciclo';
        } else {
            elements.nextSessionValue.textContent = `Descanso de ${settings.breakTime} minutos`;
            elements.continueBtnText.textContent = 'Iniciar Descanso';
            elements.skipBtnText.textContent = 'Continuar Trabajando';
        }
    } else {
        // Acabamos de completar descanso
        const isLongBreak = timer.currentMode === 'longBreak';
        elements.modalTitle.textContent = isLongBreak ? '✨ ¡Descanso Largo Completado!' : '😌 ¡Descanso Completado!';
        elements.completionMessage.textContent = isLongBreak ? 
            '¡Perfecto! Te has tomado un descanso largo merecido.' : 
            '¡Genial! Ya estás listo para otra sesión productiva.';
        elements.completedTimeValue.textContent = completedTime;
        elements.nextSessionValue.textContent = `Trabajo de ${settings.workTime} minutos`;
        elements.continueBtnText.textContent = 'Iniciar Trabajo';
        elements.skipBtnText.textContent = 'Extender Descanso';
    }
    
    // Actualizar estadísticas en el modal
    elements.modalTodayCount.textContent = stats.todayPomodoros;
    elements.modalStreak.textContent = stats.currentStreak;
    
    // Mostrar modal
    elements.transitionModal.classList.add('active');
    elements.transitionModal.setAttribute('aria-hidden', 'false');
    
    // Sonido especial para el modal
    sounds.play('session');
    
    // Añadir animación de celebración si es un logro importante
    if (stats.todayPomodoros > 0 && stats.todayPomodoros % 4 === 0) {
        elements.transitionModal.classList.add('celebration');
        setTimeout(() => {
            elements.transitionModal.classList.remove('celebration');
        }, 1200);
    }
}

// Función para cerrar modal de transición
function hideTransitionModal() {
    elements.transitionModal.classList.remove('active', 'celebration');
    elements.transitionModal.setAttribute('aria-hidden', 'true');
}

// Función para continuar con la siguiente sesión
function continueToNextSession() {
    hideTransitionModal();
    
    // La lógica original de completeSession pero sin el modal
    if (timer.currentMode === 'work') {
        // Completamos un pomodoro de trabajo
        completePomodoro();
        timer.sessionCount++;
        
        // Determinar siguiente modo
        if (timer.currentCycle >= 4) {
            // Descanso largo después del 4to pomodoro
            timer.currentMode = 'longBreak';
            timer.timeLeft = settings.longBreakTime * 60;
            timer.currentCycle = 1; // Reiniciar ciclo
            timer.completedCycles++;
            
            showNotification('🏆 ¡Ciclo completo!', '¡Disfruta tu descanso largo!');
        } else {
            // Descanso corto
            timer.currentMode = 'break';
            timer.timeLeft = settings.breakTime * 60;
            timer.currentCycle++;
            
            showNotification('🎉 ¡Pomodoro completado!', '¡Hora de descansar!');
        }
    } else {
        // Completamos un descanso
        timer.currentMode = 'work';
        timer.timeLeft = settings.workTime * 60;
        
        showNotification('💪 ¡Vamos a trabajar!', '¡Nueva sesión de enfoque!');
    }
    
    // Actualizar tiempo total y display
    timer.totalTime = timer.timeLeft;
    updateDisplay();
    updateStats();
    
    // Auto-iniciar la siguiente sesión
    setTimeout(() => {
        startTimer();
    }, 1000);
}

// Función para agregar 5 minutos extra
function addExtraTime() {
    hideTransitionModal();
    
    // Agregar 5 minutos al tiempo actual
    timer.timeLeft += 5 * 60; // 5 minutos en segundos
    timer.totalTime += 5 * 60;
    
    // Mostrar notificación
    showNotification('⏰ ¡5 minutos extra!', 'Sigue con el gran trabajo');
    
    // Actualizar display
    updateDisplay();
    
    // Continuar el timer automáticamente
    setTimeout(() => {
        startTimer();
    }, 500);
}

// Función para saltar al siguiente tipo de sesión
function skipToNext() {
    hideTransitionModal();
    
    if (timer.currentMode === 'work') {
        // Si estábamos trabajando, saltar al siguiente trabajo
        timer.currentMode = 'work';
        timer.timeLeft = settings.workTime * 60;
        timer.currentCycle++;
        
        showNotification('🚀 ¡Continuamos!', 'Otra sesión de trabajo');
    } else {
        // Si estábamos descansando, extender descanso
        const extraBreakTime = timer.currentMode === 'longBreak' ? 10 : 5;
        timer.timeLeft += extraBreakTime * 60;
        timer.totalTime += extraBreakTime * 60;
        
        showNotification('😌 ¡Descanso extendido!', `${extraBreakTime} minutos más de relax`);
    }
    
    // Actualizar tiempo total y display
    timer.totalTime = timer.timeLeft;
    updateDisplay();
    
    // Auto-iniciar
    setTimeout(() => {
        startTimer();
    }, 1000);
}

// Función principal del timer
function startTimer() {
    timer.isRunning = true;
    timer.isPaused = false;
    
    // Cambiar icono a pause
    elements.playPauseIcon.className = 'fas fa-pause';
    
    // Sonido de click
    sounds.play('click');
    
    // Crear el intervalo que se ejecuta cada segundo
    timer.timerInterval = setInterval(() => {
        timer.timeLeft--;
        updateDisplay();
        
        // Cuando llegamos a cero
        if (timer.timeLeft <= 0) {
            completeSession();
        }
    }, 1000);
}

// Función para pausar el timer
function pauseTimer() {
    timer.isRunning = false;
    timer.isPaused = true;
    
    // Limpiar el intervalo
    clearInterval(timer.timerInterval);
    
    // Cambiar icono a play
    elements.playPauseIcon.className = 'fas fa-play';
    
    // Sonido de click
    sounds.play('click');
}

// Función para resetear el timer
function resetTimer() {
    // Limpiar cualquier intervalo activo
    clearInterval(timer.timerInterval);
    
    // Resetear valores
    timer.isRunning = false;
    timer.isPaused = false;
    
    // Determinar tiempo según modo actual
    switch (timer.currentMode) {
        case 'work':
            timer.timeLeft = settings.workTime * 60;
            break;
        case 'break':
            timer.timeLeft = settings.breakTime * 60;
            break;
        case 'longBreak':
            timer.timeLeft = settings.longBreakTime * 60;
            break;
    }
    
    timer.totalTime = timer.timeLeft;
    
    // Cambiar icono a play
    elements.playPauseIcon.className = 'fas fa-play';
    
    // Actualizar display
    updateDisplay();
    
    // Sonido de click
    sounds.play('click');
}

// Función cuando se completa una sesión
function completeSession() {
    // Limpiar el intervalo
    clearInterval(timer.timerInterval);
    timer.isRunning = false;
    
    // Cambiar icono a play
    elements.playPauseIcon.className = 'fas fa-play';
    
    // Mostrar modal en lugar de continuar automáticamente
    showTransitionModal();
}

// Función para mostrar notificaciones del navegador
function showNotification(title, body) {
    // Verificar si las notificaciones están permitidas
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '🍅'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body: body });
                }
            });
        }
    }
}

// Funciones para manejar el panel de estadísticas
function toggleStats() {
    elements.statsPanel.classList.toggle('active');
    sounds.play('click');
    
    // Actualizar estadísticas al abrir
    if (elements.statsPanel.classList.contains('active')) {
        updateStats();
    }
}

// Función para mostrar/ocultar panel de configuración
function toggleSettings() {
    elements.settingsPanel.classList.toggle('active');
    sounds.play('click');
}

// Función para guardar configuración
function saveSettings() {
    // Obtener valores de los inputs
    const newWorkTime = parseInt(elements.workTimeInput.value);
    const newBreakTime = parseInt(elements.breakTimeInput.value);
    const newLongBreakTime = parseInt(elements.longBreakTimeInput.value);
    const newSoundEnabled = elements.soundToggle.checked;
    const newSoundType = elements.soundType.value;
    const newVolume = parseInt(elements.volumeControl.value) / 100;
    
    // Validar que los valores sean correctos
    if (newWorkTime < 1 || newWorkTime > 60) {
        alert('⚠️ El tiempo de trabajo debe estar entre 1 y 60 minutos');
        return;
    }
    
    if (newBreakTime < 1 || newBreakTime > 30) {
        alert('⚠️ El tiempo de descanso debe estar entre 1 y 30 minutos');
        return;
    }
    
    if (newLongBreakTime < 15 || newLongBreakTime > 60) {
        alert('⚠️ El tiempo de descanso largo debe estar entre 15 y 60 minutos');
        return;
    }
    
    // Guardar nueva configuración
    settings.workTime = newWorkTime;
    settings.breakTime = newBreakTime;
    settings.longBreakTime = newLongBreakTime;
    settings.soundEnabled = newSoundEnabled;
    settings.soundType = newSoundType;
    settings.volume = newVolume;
    
    // Si no está corriendo el timer, actualizar tiempos
    if (!timer.isRunning) {
        switch (timer.currentMode) {
            case 'work':
                timer.timeLeft = settings.workTime * 60;
                break;
            case 'break':
                timer.timeLeft = settings.breakTime * 60;
                break;
            case 'longBreak':
                timer.timeLeft = settings.longBreakTime * 60;
                break;
        }
        timer.totalTime = timer.timeLeft;
        updateDisplay();
    }
    
    // Cerrar panel de configuración
    toggleSettings();
    
    // Sonido de confirmación
    sounds.play('click');
}

// ===================================
// EVENT LISTENERS
// ===================================

// Controles principales
elements.playPauseBtn.addEventListener('click', () => {
    if (timer.isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

elements.resetBtn.addEventListener('click', resetTimer);
elements.settingsBtn.addEventListener('click', toggleSettings);
elements.statsBtn.addEventListener('click', toggleStats);
elements.saveSettingsBtn.addEventListener('click', saveSettings);

// Cerrar paneles
elements.closeSettingsBtn.addEventListener('click', toggleSettings);
elements.closeStatsBtn.addEventListener('click', toggleStats);

// Event listeners para el modal
elements.continueBtn.addEventListener('click', continueToNextSession);
elements.extraTimeBtn.addEventListener('click', addExtraTime);
elements.skipBtn.addEventListener('click', skipToNext);

// Control de volumen en tiempo real
elements.volumeControl.addEventListener('input', (e) => {
    const volume = parseInt(e.target.value);
    elements.volumeValue.textContent = `${volume}%`;
    settings.volume = volume / 100;
});

// Cerrar paneles al hacer click fuera de ellos
document.addEventListener('click', (e) => {
    // Cerrar configuración
    if (!elements.settingsPanel.contains(e.target) && 
        !elements.settingsBtn.contains(e.target) && 
        elements.settingsPanel.classList.contains('active')) {
        toggleSettings();
    }
    
    // Cerrar estadísticas
    if (!elements.statsPanel.contains(e.target) && 
        !elements.statsBtn.contains(e.target) && 
        elements.statsPanel.classList.contains('active')) {
        toggleStats();
    }
});

// Atajos de teclado completos
document.addEventListener('keydown', (e) => {
    // Evitar atajos si estamos escribiendo en inputs
    if (e.target.tagName === 'INPUT') {
        return;
    }
    
    // Atajos específicos para el modal (cuando está activo)
    if (elements.transitionModal.classList.contains('active')) {
        // Enter para continuar
        if (e.code === 'Enter') {
            e.preventDefault();
            continueToNextSession();
        }
        
        // Número 1 para continuar
        if (e.code === 'Digit1') {
            e.preventDefault();
            continueToNextSession();
        }
        
        // Número 2 para tiempo extra
        if (e.code === 'Digit2') {
            e.preventDefault();
            addExtraTime();
        }
        
        // Número 3 para saltar
        if (e.code === 'Digit3') {
            e.preventDefault();
            skipToNext();
        }
        
        // Escape para continuar por defecto
        if (e.code === 'Escape') {
            e.preventDefault();
            continueToNextSession();
        }
        
        return; 
    }
    
    // Atajos generales (solo cuando el modal NO está activo)
    // Espaciadora para play/pause
    if (e.code === 'Space') {
        e.preventDefault();
        if (timer.isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    }
    
    // R para reset
    if (e.code === 'KeyR') {
        e.preventDefault();
        resetTimer();
    }
    
    // S para settings
    if (e.code === 'KeyS') {
        e.preventDefault();
        toggleSettings();
    }
    
    // D para dashboard/stats
    if (e.code === 'KeyD') {
        e.preventDefault();
        toggleStats();
    }
    
    // Escape para cerrar paneles
    if (e.code === 'Escape') {
        if (elements.settingsPanel.classList.contains('active')) {
            toggleSettings();
        } else if (elements.statsPanel.classList.contains('active')) {
            toggleStats();
        }
    }
});

// ===================================
// INICIALIZACIÓN
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Configurar valores iniciales en los inputs
    elements.workTimeInput.value = settings.workTime;
    elements.breakTimeInput.value = settings.breakTime;
    elements.longBreakTimeInput.value = settings.longBreakTime;
    elements.soundToggle.checked = settings.soundEnabled;
    elements.soundType.value = settings.soundType;
    elements.volumeControl.value = settings.volume * 100;
    elements.volumeValue.textContent = `${Math.round(settings.volume * 100)}%`;
    
    // Actualizar display inicial
    updateDisplay();
    updateStats();
    
    // Pedir permiso para notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Logs de inicialización
    console.log('🍅 Pomodoro Timer Pro inicializado correctamente!');
    console.log('💡 Atajos básicos: Espacio (play/pause), R (reset), S (settings), D (stats)');
    console.log('🎭 Atajos del modal: Enter/1 (continuar), 2 (extra), 3 (saltar)');
    console.log('✨ Características: Dashboard, Sonidos avanzados, Ciclos automáticos, Modal de control');
    console.log('🎯 Creado por Gabchan con mucho amor y café ☕');
});

// ===================================
// SISTEMA DE MENSAJES MOTIVACIONALES
// ===================================

const motivationalSystem = {
    messages: [
        '¡Excelente trabajo, Gabchan! 🌟',
        '¡Sigue así, lo estás haciendo genial! 💪',
        '¡Tu productividad está por las nubes! 🚀',
        '¡Eres imparable! ✨',
        '¡Otro pomodoro completado como una pro! 🏆',
        '¡Tu concentración es admirable! 🧠',
        '¡Cada minuto cuenta hacia tus metas! 🎯',
        '¡Tu disciplina es inspiradora! 💜',
        '¡Sigue construyendo ese momentum! ⚡',
        '¡Eres una máquina de productividad! 🤖'
    ],
    
    achievements: [
        { count: 1, message: '🎉 ¡Tu primer pomodoro del día! ¡Bien hecho!' },
        { count: 3, message: '🔥 ¡3 pomodoros! ¡Estás en racha!' },
        { count: 5, message: '⭐ ¡5 pomodoros! ¡Nivel experto desbloqueado!' },
        { count: 8, message: '👑 ¡8 pomodoros! ¡Eres oficialmente una reina de la productividad!' },
        { count: 10, message: '🏆 ¡10 pomodoros! ¡ÉPICO! ¡Mereces una celebración!' },
        { count: 12, message: '🚀 ¡12 pomodoros! ¡Estás rompiendo todos los récords!' }
    ],
    
    show: function() {
        if (stats.todayPomodoros > 0) {
            // Verificar si hay un logro especial
            const achievement = this.achievements.find(a => a.count === stats.todayPomodoros);
            
            if (achievement) {
                console.log(`%c${achievement.message}`, 'color: #ff6b6b; font-size: 16px; font-weight: bold; background: linear-gradient(45deg, #ff6b6b, #ffd93d); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
            } else {
                // Mensaje motivacional regular
                const randomMessage = this.messages[Math.floor(Math.random() * this.messages.length)];
                console.log(`%c${randomMessage}`, 'color: #ff6b6b; font-size: 14px; font-weight: bold;');
            }
        }
    },
    
    // Mensaje especial para rachas
    showStreak: function() {
        if (stats.currentStreak >= 3) {
            const streakMessages = [
                `🔥 ¡${stats.currentStreak} días consecutivos! ¡Imparable!`,
                `⚡ ¡Racha de ${stats.currentStreak} días! ¡La constancia es tu superpoder!`,
                `💎 ¡${stats.currentStreak} días seguidos! ¡Eres pura determinación!`
            ];
            
            const message = streakMessages[Math.floor(Math.random() * streakMessages.length)];
            console.log(`%c${message}`, 'color: #4ecdc4; font-size: 15px; font-weight: bold;');
        }
    }
};

// Mostrar mensajes motivacionales periódicamente
setInterval(() => {
    motivationalSystem.show();
}, 300000); // Cada 5 minutos

// Mostrar mensaje de racha al completar un pomodoro
function showAchievementMessage() {
    motivationalSystem.show();
    
    // Mostrar mensaje de racha si aplica
    if (stats.currentStreak >= 3) {
        setTimeout(() => {
            motivationalSystem.showStreak();
        }, 2000);
    }
}

// ===================================
// 🛠️ FUNCIONES AUXILIARES ADICIONALES
// ===================================

// Función para verificar si es un nuevo día
function checkNewDay() {
    const today = new Date().toDateString();
    
    // Si es un nuevo día, resetear estadísticas diarias pero mantener la racha
    if (stats.lastActiveDate && stats.lastActiveDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Si no trabajó ayer, resetear racha
        if (stats.lastActiveDate !== yesterday.toDateString()) {
            stats.currentStreak = 0;
        }
        
        // Resetear pomodoros del día
        stats.todayPomodoros = 0;
        updateStats();
    }
}

// Verificar nuevo día cada minuto
setInterval(checkNewDay, 60000);


// ===================================
// 🎨 EFECTOS VISUALES ADICIONALES
// ===================================

// Función para agregar efectos de celebración
function triggerCelebration() {
    // Agregar clase de celebración al contenedor
    elements.container.classList.add('celebration');
    
    // Remover después de la animación
    setTimeout(() => {
        elements.container.classList.remove('celebration');
    }, 2000);
    
    // Crear confetti virtual en consola
    console.log('🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉🎊');
}

// Función mejorada para completar pomodoro con celebraciones
const originalCompletePomodoro = completePomodoro;
completePomodoro = function() {
    originalCompletePomodoro();
    
    // Mostrar mensaje de logro
    showAchievementMessage();
    
    // Celebración especial para múltiplos de 5
    if (stats.todayPomodoros % 5 === 0) {
        setTimeout(triggerCelebration, 1000);
    }
    
    // Efectos especiales para rachas largas
    if (stats.currentStreak >= 7) {
        setTimeout(() => {
            console.log('%c🏆 ¡RACHA LEGENDARIA! ¡Una semana completa! 🏆', 
                       'color: gold; font-size: 18px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);');
        }, 3000);
    }
};


// Mensaje final de carga
setTimeout(() => {
    console.log('%c✨ Pomodoro Timer cargado completamente ✨', 'color: #4ecdc4; font-size: 16px; font-weight: bold;');
    console.log('%c¡Listo para maximizar tu productividad! 🚀', 'color: #ff6b6b; font-size: 14px;');
}, 1000);
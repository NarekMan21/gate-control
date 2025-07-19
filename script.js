const NPOINT_URL = 'https://api.npoint.io/5da080e5ab67708d4549';
const CORRECT_PASSWORD = '2121';

// Элементы DOM
const modal = document.getElementById('password-modal');
const controlPanel = document.getElementById('control-panel');
const passwordInput = document.getElementById('password-input');
const passwordSubmit = document.getElementById('password-submit');
const passwordError = document.getElementById('password-error');
const logoutButton = document.getElementById('logout-button');
const openButton = document.getElementById('open-button');
const closeButton = document.getElementById('close-button');
const messageEl = document.getElementById('message');
const loaderEl = document.querySelector('.loader');
const buttons = document.querySelectorAll('.btn');

// --- Логика аутентификации ---

if (localStorage.getItem('gateAuth') === 'true') {
    showControlPanel();
} else {
    showPasswordModal();
}

passwordSubmit.addEventListener('click', handleLogin);
passwordInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        handleLogin();
    }
});

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('gateAuth');
    showPasswordModal();
});

function handleLogin() {
    if (passwordInput.value === CORRECT_PASSWORD) {
        localStorage.setItem('gateAuth', 'true');
        showControlPanel();
    } else {
        passwordError.textContent = 'Неверный пароль';
        passwordInput.value = '';
        setTimeout(() => passwordError.textContent = '', 2000);
    }
}

function showPasswordModal() {
    modal.classList.remove('hidden');
    controlPanel.classList.add('hidden');
}

function showControlPanel() {
    modal.classList.add('hidden');
    controlPanel.classList.remove('hidden');
}

// --- Логика отправки команд ---

openButton.addEventListener('click', () => sendCommand('OPEN'));
closeButton.addEventListener('click', () => sendCommand('CLOSE'));

function sendCommand(action) {
    setLoading(true);
    const commandId = Date.now();
    const commandPayload = { command: `${commandId}:${action}` };

    fetch(NPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commandPayload)
    })
    .then(response => {
        if (response.ok) {
            showMessage(`Команда "${action}" успешно отправлена!`);
        } else {
            throw new Error(`Ошибка сервера (статус: ${response.status}).`);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showMessage(error.message, true);
    })
    .finally(() => {
        setTimeout(() => {
            setLoading(false);
            showMessage('');
        }, 2000);
    });
}

function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.style.color = isError ? '#ff4d4d' : '#4dff91';
}

function setLoading(isLoading) {
    if (isLoading) {
        loaderEl.classList.remove('hidden');
        buttons.forEach(button => button.disabled = true);
        messageEl.textContent = '';
    } else {
        loaderEl.classList.add('hidden');
        buttons.forEach(button => button.disabled = false);
    }
}
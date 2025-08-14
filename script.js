const NPOINT_URL = 'https://api.npoint.io/5da080e5ab67708d4549';
const CORRECT_PASSWORD = '2121';
const LOG_PASSWORD = '21212121';

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

// Элементы логов
const logButton = document.getElementById('log-button');
const logPasswordModal = document.getElementById('log-password-modal');
const logPasswordInput = document.getElementById('log-password-input');
const logPasswordSubmit = document.getElementById('log-password-submit');
const logPasswordError = document.getElementById('log-password-error');
const logViewModal = document.getElementById('log-view-modal');
const logContainer = document.getElementById('log-container');
const closeModalButtons = document.querySelectorAll('.close-modal-btn');


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

// --- Логика отправки команд и логов ---

openButton.addEventListener('click', () => sendCommand('OPEN'));
closeButton.addEventListener('click', () => sendCommand('CLOSE'));

async function sendCommand(action) {
    setLoading(true);
    const commandId = Date.now();
    const newLogEntry = {
        id: commandId,
        action: action,
        timestamp: new Date().toISOString()
    };

    try {
        // 1. Получаем текущие данные
        const response = await fetch(NPOINT_URL);
        if (!response.ok) throw new Error(`Ошибка при чтении данных (статус: ${response.status})`);
        const data = await response.json();

        // 2. Модифицируем данные
        data.command = `${commandId}:${action}`;
        if (!data.log) {
            data.log = [];
        }
        data.log.unshift(newLogEntry); // Добавляем в начало
        if (data.log.length > 50) { // Ограничиваем размер лога
            data.log.pop();
        }

        // 3. Отправляем обновленные данные
        const postResponse = await fetch(NPOINT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (postResponse.ok) {
            showMessage(`Команда "${action}" успешно отправлена!`);
        } else {
            throw new Error(`Ошибка при записи данных (статус: ${postResponse.status}).`);
        }

    } catch (error) {
        console.error('Ошибка:', error);
        showMessage(error.message, true);
    } finally {
        setTimeout(() => {
            setLoading(false);
            showMessage('');
        }, 2000);
    }
}

// --- Логика отображения логов ---

logButton.addEventListener('click', () => {
    logPasswordModal.classList.remove('hidden');
});

logPasswordSubmit.addEventListener('click', handleLogLogin);
logPasswordInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        handleLogLogin();
    }
});

closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modalToClose = document.getElementById(button.dataset.target);
        modalToClose.classList.add('hidden');
    });
});

function handleLogLogin() {
    if (logPasswordInput.value === LOG_PASSWORD) {
        logPasswordModal.classList.add('hidden');
        logPasswordInput.value = '';
        showLogs();
    } else {
        logPasswordError.textContent = 'Неверный пароль';
        logPasswordInput.value = '';
        setTimeout(() => logPasswordError.textContent = '', 2000);
    }
}

async function showLogs() {
    setLoading(true);
    logViewModal.classList.remove('hidden');
    logContainer.innerHTML = '';

    try {
        const response = await fetch(NPOINT_URL);
        if (!response.ok) throw new Error(`Не удалось загрузить логи. Код: ${response.status}`);
        const data = await response.json();

        // Если логи есть — показываем и сохраняем их в localStorage
        if (data.log && data.log.length > 0) {
            localStorage.setItem('gateLogsBackup', JSON.stringify(data.log));
            data.log.forEach(entry => {
                const logElement = document.createElement('p');
                const date = new Date(entry.timestamp);
                const formattedDate = `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}`;
                logElement.innerHTML = `<b>${entry.action}</b> - ${formattedDate}`;
                logContainer.appendChild(logElement);
            });
        } else {
            // Если логов нет — пробуем взять из localStorage
            const backupLogs = localStorage.getItem('gateLogsBackup');
            if (backupLogs) {
                const logs = JSON.parse(backupLogs);
                if (logs.length > 0) {
                    logs.forEach(entry => {
                        const logElement = document.createElement('p');
                        const date = new Date(entry.timestamp);
                        const formattedDate = `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}`;
                        logElement.innerHTML = `<b>${entry.action}</b> - ${formattedDate}`;
                        logContainer.appendChild(logElement);
                    });
                    logContainer.innerHTML += '<p style="color: #ffb400;">Показана резервная история. Облако временно недоступно.</p>';
                    return;
                }
            }
            logContainer.innerHTML = '<p>История пуста.</p>';
        }
    } catch (error) {
        console.error('Ошибка:', error);
        // Если ошибка 502 или другая с сетью — показываем резервную историю
        const backupLogs = localStorage.getItem('gateLogsBackup');
        if (backupLogs) {
            const logs = JSON.parse(backupLogs);
            if (logs.length > 0) {
                logs.forEach(entry => {
                    const logElement = document.createElement('p');
                    const date = new Date(entry.timestamp);
                    const formattedDate = `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}`;
                    logElement.innerHTML = `<b>${entry.action}</b> - ${formattedDate}`;
                    logContainer.appendChild(logElement);
                });
                logContainer.innerHTML += '<p style="color: #ffb400;">Показана резервная история. Облако временно недоступно.</p>';
                setLoading(false);
                return;
            }
        }
        logContainer.innerHTML = `<p style="color: #ff4d4d;">${error.message}<br>Облако временно недоступно. Попробуйте позже.</p>`;
    } finally {
        setLoading(false);
    }
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
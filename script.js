const NPOINT_URL = 'https://api.npoint.io/5da080e5ab67708d4549';

const messageEl = document.getElementById('message');
const loaderEl = document.querySelector('.loader');
const buttons = document.querySelectorAll('.btn');

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

function sendCommand(action) {
  setLoading(true);

  const commandId = Date.now();
  const commandPayload = {
    command: `${commandId}:${action}`
  };

  fetch(NPOINT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
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
        showMessage(''); // Очищаем сообщение через некоторое время
    }, 2000);
  });
}

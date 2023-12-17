(function() {
    'use strict';
    const fetchData = async (link, apiEndpoint = '/get/anime/info') => {
        const cyclicUrl = 'https://elated-cummerbund-eel.cyclic.app';
        try {
            const response = await fetch(`${cyclicUrl}${apiEndpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ link }),
            });

            if (!response.ok) {
                throw new Error(`Ошибка при получении данных.  ` + response);
            }
            const responseData = await response.json();
            console.log('Успешно: ', responseData);
        } catch (error) {
            console.error('Ошибка: ', error.message);
        }
    };

    function addRow() {
        const tbody = document.getElementById('rel-tpl');
        const newRow = tbody.insertRow(0);

        // Создаем ячейку с классом rel-title
        const titleCell = newRow.insertCell(0);
        titleCell.className = 'rel-title';
        titleCell.innerText = 'Ссылка на аниме:';

        // Создаем ячейку с классом rel-inputs
        const inputsCell = newRow.insertCell(1);
        inputsCell.className = 'rel-inputs';

        // Создаем текстовое поле в ячейке с классом rel-input
        const textField = document.createElement('input');
        textField.className = 'rel-el rel-input';
        textField.type = 'text';
        textField.id = 'titleLink';
        textField.maxLength = 200;
        textField.size = 80;
        textField.placeholder = '';
        inputsCell.appendChild(textField);

        // Создаем span с классом rel-el rel-free-el
        const freeEl = document.createElement('span');
        freeEl.className = 'rel-el rel-free-el';
        freeEl.innerText = 'URL';
        inputsCell.appendChild(freeEl);

        // Создаем span с классом rel-el
        const buttonSpan = document.createElement('span');
        buttonSpan.className = 'rel-el';

        // Создаем кнопку "Заполнить" внутри span
        const fillButton = document.createElement('input');
        fillButton.type = 'button';
        fillButton.style.width = '100px';
        fillButton.value = 'Заполнить';
        fillButton.onclick = async function() {
            fillButton.disabled = true;
            const link = document.getElementById('titleLink').value;
            if (!link) {
                alert("Вставьте ссылку с сайта world-art");
            }
            else {
                await fetchData(link);
            }
            fillButton.disabled = false;
        };
        buttonSpan.appendChild(fillButton);

        // Добавляем span с кнопкой в ячейку
        inputsCell.appendChild(buttonSpan);

        const br = document.createElement('br');
        inputsCell.appendChild(br);

        const infoSpan = document.createElement('span');
        infoSpan.className = 'rel-el rel-free-el';

        const textNode = document.createTextNode('Вставьте ссылку с сайта ');
        infoSpan.appendChild(textNode);

        const link = document.createElement('a');
        link.href = 'http://world-art.ru';
        link.innerText = 'world-art';
        link.target = '_blank';

        infoSpan.appendChild(link);

        inputsCell.appendChild(infoSpan);
    }

    addRow();
})();
// ==UserScript==
// @name         rutracker release helper
// @version      1.1
// @description  Заполнение полей по данным со страницы аниме на сайте World-Art
// @author       NiackZ
// @match        https://rutracker.org/forum/posting.php?f=1105&mode=new_rel
// @grant        none
// @homepage     https://github.com/NiackZ/rutracker-anime-helper
// @downloadURL  https://raw.githubusercontent.com/NiackZ/rutracker-anime-helper/master/helper.js
// @updateURL    https://raw.githubusercontent.com/NiackZ/rutracker-anime-helper/master/helper.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=rutracker.org
// ==/UserScript==
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
    const addRow = () => {
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
                const response = await fetchData(link);
                if (!!response.anime) {
                    fillFields(response.anime);
                }
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
    const fillFields = (anime) => {
        const rusName = document.getElementById("title_rus");
        const engName = document.getElementById("title_eng");
        const othName = document.getElementById("19196242af37f0ad77a7f593b45f8207");
        const country = document.getElementById("country_anime");
        const year = document.getElementById("year");
        const genre = document.getElementById("genre");
        const animeType = document.getElementById("anime_type");
        const episodes = document.getElementById("731ffae21574667873e9717a7fa433b5");
        const duration = document.getElementById("playtime");
        const director = document.getElementById("director");
        const studio = document.getElementById("c6ed4beb1b80956095e7c0aba867d08f");
        const description = document.getElementById("description");
        const episodeList = document.getElementById("bd78750529cad34e379eca8e6a255d42");
    }
    addRow();
})();
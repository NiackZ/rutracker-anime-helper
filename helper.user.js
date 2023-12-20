// ==UserScript==
// @name         rutracker release helper
// @namespace    rutracker helpers
// @description  Заполнение полей по данным со страницы аниме на сайте World-Art
// @version      2.7
// @author       NiackZ
// @homepage     https://github.com/NiackZ/rutracker-anime-helper
// @downloadURL  https://github.com/NiackZ/rutracker-anime-helper/raw/master/helper.user.js
// @updateURL    https://github.com/NiackZ/rutracker-anime-helper/raw/master/helper.user.js
// @match        https://rutracker.org/forum/posting.php?f=1105&mode=new_rel
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=rutracker.org
// ==/UserScript==
//

(function() {
    'use strict';
    let miInfo = null;
    let animeInfo = null;
    const localStorageName = 'animeTemplate';
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
            return await response.json();
        } catch (error) {
            console.error('Ошибка: ', error.message);
        }
    };
    const MiParser = (miData) => {
        const RU = 'RU';
        const EN = 'EN';
        const REGEX_EN = {
            CODEC: /Format\s+:\s+([^\r\n]+)/,
            CODEC_PROFILE: /Format profile\s+:\s+([^\r\n]+)/,
            BIT_RATE: /Bit rate\s+:\s+([^\r\n]+)/,
            WIDTH: /Width\s+:\s+(\d+(?:\s+\d*)?)/,
            HEIGHT: /Height\s+:\s+(\d+(?:\s+\d*)?)/,
            ASPECT: /Display aspect ratio\s+:\s+([^\r\n]+)/,
            FRAME_RATE: /Frame rate\s+:\s+([^\r\n]+)/,
            CHROMA_SUBSAMPLING: /Chroma subsampling\s+:\s+([^\r\n]+)/,
            COLOR_PRIMARIES: /Color primaries\s+:\s+([^\r\n]+)/,
            BIT_DEPTH: /Bit depth\s+:\s+(\d+)/,
            CHANNELS: /Channel\(s\)\s+:\s+(\d+)/,
            SAMPLING_RATE: /Sampling rate\s+:\s+(.+)/,
            LANGUAGE: /Language\s+:\s+(.+)/,
            TITLE: /Title\s+:\s+(.+)/,
            NAME: /Complete name\s+:\s+([^\r\n]+)/
        };
        const REGEX_RU = {
            CODEC: /Формат\s+:\s+([^\r\n]+)/,
            CODEC_PROFILE: /Профиль формата\s+:\s+([^\r\n]+)/,
            BIT_RATE: /Битрейт\s+:\s+([^\r\n]+)/,
            WIDTH: /Ширина\s+:\s+(\d+(?:\s+\d*)?)/,
            HEIGHT: /Высота\s+:\s+(\d+(?:\s+\d*)?)/,
            ASPECT: /Соотношение сторон\s+:\s+([^\r\n]+)/,
            FRAME_RATE: /Частота кадров\s+:\s+([^\r\n]+)/,
            CHROMA_SUBSAMPLING: /Субдискретизация насыщенности\s+:\s+([^\r\n]+)/,
            COLOR_PRIMARIES: /Основные цвета\s+:\s+([^\r\n]+)/,
            BIT_DEPTH: /Битовая глубина\s+:\s+(\d+)/,
            CHANNELS: /Каналы\s+:\s+(\d+)/,
            SAMPLING_RATE: /Частота\s+:\s+(.+)/,
            LANGUAGE: /Язык\s+:\s+(.+)/,
            TITLE: /Заголовок\s+:\s+(.+)/,
            NAME: /Полное имя\s+:\s+([^\r\n]+)/
        };

        const parseField = (block, regex, fieldName) => {
            const match = block.match(regex);
            return match ? match[1].trim() : null;
        };
        const translateLanguage = (lang) => {
            if (lang) {
                switch (lang.toLowerCase()) {
                    case "russian":
                        return "Русский";
                    case "japanese":
                        return "Японский";
                    case "english":
                        return "Английский";
                    default:
                        return lang;
                }
            }
            return null;
        }
        const getFileExt = (generalBlockMatch, lang) => {
            if (generalBlockMatch) {
                const generalBlock = generalBlockMatch[1].trim();
                const fileName = parseField(generalBlock, lang === EN ? REGEX_EN.NAME: REGEX_RU.NAME);
                return fileName.split('.').pop().toUpperCase();
            }
            return null;
        };
        const getVideoInfo = (videoBlockMatch, lang) => {
            if (videoBlockMatch) {
                const parseVideoBlock = (videoBlock, regex) => {
                    const _width = parseField(videoBlock, regex.WIDTH);
                    const _height = parseField(videoBlock, regex.HEIGHT);
                    const _fps = parseField(videoBlock, regex.FRAME_RATE);

                    return {
                        codec: parseField(videoBlock, regex.CODEC),
                        codeProfile: parseField(videoBlock, regex.CODEC_PROFILE),
                        width: _width ? _width.replaceAll(" ", "") : null,
                        height: _height ? _height.replaceAll(" ", "") : null,
                        aspect: parseField(videoBlock, regex.ASPECT),
                        fps: _fps ? _fps.split(" ")[0] : null,
                        chromaSubsampling: parseField(videoBlock, regex.CHROMA_SUBSAMPLING),
                        colorPrimaries: parseField(videoBlock, regex.COLOR_PRIMARIES),
                        bitDepth: parseField(videoBlock, regex.BIT_DEPTH),
                        bitRate: parseField(videoBlock, regex.BIT_RATE),
                        fileExt: null
                    };
                }

                return parseVideoBlock(videoBlockMatch[1].trim(), lang === EN ? REGEX_EN : REGEX_RU);
            }

            return null;
        }
        const getAudioInfo = (blocks, lang) => {
            if (blocks) {
                const parseAudioBlock = (blocks, regex) => {
                    return Array.from(blocks).map(audioBlockMatch => {
                        const audioBlock = audioBlockMatch[1].trim();
                        return {
                            language: translateLanguage(parseField(audioBlock, regex.LANGUAGE)),
                            codec: parseField(audioBlock, regex.CODEC),
                            bitRate: parseField(audioBlock, regex.BIT_RATE),
                            sampleRate: parseField(audioBlock, regex.SAMPLING_RATE),
                            bitDepth: parseField(audioBlock, regex.BIT_DEPTH),
                            channels: parseField(audioBlock, regex.CHANNELS),
                            title: parseField(audioBlock, regex.TITLE)
                        }
                    });
                }

                return parseAudioBlock(blocks, lang === EN ? REGEX_EN : REGEX_RU);
            }
            return null;
        }
        const getTextInfo = (blocks, lang) => {
            if (blocks) {
                const parseTextBlock = (blocks, regex) => {
                    return Array.from(blocks).map(textBlockMatch => {
                        const textBlock = textBlockMatch[1].trim();
                        return {
                            language: translateLanguage(parseField(textBlock, regex.LANGUAGE)),
                            format: parseField(textBlock, regex.CODEC),
                            title: parseField(textBlock, regex.TITLE)
                        }
                    });
                }

                return parseTextBlock(blocks, lang === EN ? REGEX_EN : REGEX_RU);
            }
            return null;
        }

        const getRegexBlocks = {
            VIDEO: /Video([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/,
            VIDEO_RU: /Видео([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/,
            AUDIO: /Audio([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/g,
            AUDIO_RU: /Аудио([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/g,
            TEXT: /Text([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/g,
            TEXT_RU: /Текст([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/g,
            GENERAL: /General([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/,
            GENERAL_RU: /Общее([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/
        }

        const videoBlockMatch = miData.match(getRegexBlocks.VIDEO);
        const audioBlockMatches = miData.matchAll(getRegexBlocks.AUDIO);
        const textBlockMatches = miData.matchAll(getRegexBlocks.TEXT);
        const generalBlockMatch = miData.match(getRegexBlocks.GENERAL);

        const videoBlockMatch_RU = miData.match(getRegexBlocks.VIDEO_RU);
        const audioBlockMatches_RU = miData.matchAll(getRegexBlocks.AUDIO_RU);
        const textBlockMatches_RU = miData.matchAll(getRegexBlocks.TEXT_RU);
        const generalBlockMatch_RU = miData.match(getRegexBlocks.GENERAL_RU);

        const useEN = videoBlockMatch_RU === null &&
            Array.from(audioBlockMatches_RU).length === 0 &&
            Array.from(textBlockMatches_RU).length === 0 &&
            generalBlockMatch_RU === null;

        const lang = useEN ? EN : RU;

        const videoInfo = getVideoInfo(useEN ? videoBlockMatch : videoBlockMatch_RU, lang);
        const audioInfo = getAudioInfo(useEN ? audioBlockMatches : audioBlockMatches_RU, lang);
        const textInfo = getTextInfo(useEN ? textBlockMatches : textBlockMatches_RU, lang);
        videoInfo.fileExt = getFileExt(useEN ? generalBlockMatch : generalBlockMatch_RU, lang);

        return { videoInfo, audioInfo, textInfo };
    }
    const addUrlRow = () => {
        const tbody = document.getElementById('rel-tpl');
        const newRow = tbody.insertRow(0);

        const titleCell = newRow.insertCell(0);
        titleCell.className = 'rel-title';
        titleCell.innerText = 'Ссылка на аниме:';

        const inputsCell = newRow.insertCell(1);
        inputsCell.className = 'rel-inputs';

        const textField = document.createElement('input');
        textField.className = 'rel-el rel-input';
        textField.type = 'text';
        textField.id = 'titleLink';
        textField.maxLength = 200;
        textField.size = 80;
        textField.placeholder = '';
        inputsCell.appendChild(textField);

        const freeEl = document.createElement('span');
        freeEl.className = 'rel-el rel-free-el';
        freeEl.innerText = 'URL';
        inputsCell.appendChild(freeEl);

        const buttonSpan = document.createElement('span');
        buttonSpan.className = 'rel-el';

        const fillButton = document.createElement('input');
        fillButton.type = 'button';
        fillButton.style.width = '100px';
        fillButton.value = 'Заполнить';
        fillButton.onclick = async function() {

            try {
                fillButton.disabled = true;
                const link = document.getElementById('titleLink').value;
                if (!link) {
                    alert("Вставьте ссылку с сайта world-art");
                }
                else {
                    animeInfo = null;
                    const response = await fetchData(link);
                    if (!!response.anime) {
                        animeInfo = response.anime;
                        fillFields(response.anime);
                    }
                }
            }
            catch (error) {
                console.error(error);
            }
            finally {
                fillButton.disabled = false;
            }

        };
        buttonSpan.appendChild(fillButton);
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
    const addActionRow = () => {
        const tbody = document.getElementById('rel-tpl');
        const newRow = tbody.insertRow(0);

        const actionCell = newRow.insertCell(0);
        actionCell.colSpan = 2;
        actionCell.style.textAlign = 'center';
        actionCell.style.padding = '10px 5px';

        const setSpan = document.createElement('span');
        setSpan.className = 'rel-el';

        const setTemplateButton = document.createElement('input');
        setTemplateButton.id = 'setTemplateButton';
        setTemplateButton.type = 'button';
        setTemplateButton.style.width = '130px';
        setTemplateButton.value = 'Настроить шаблон';

        const calcSpan = document.createElement('span');
        calcSpan.className = 'rel-el';

        const calcTemplateButton = document.createElement('input');
        calcTemplateButton.disabled = true;
        calcTemplateButton.id = 'calcTemplateButton';
        calcTemplateButton.type = 'button';
        calcTemplateButton.style.width = '165px';
        calcTemplateButton.value = 'Сгенерировать описание';

        setSpan.appendChild(setTemplateButton);
        calcSpan.appendChild(calcTemplateButton);
        actionCell.appendChild(setSpan);
        actionCell.appendChild(calcSpan);
    }

    const createModal = () => {
        // Создаем элементы модального окна
        const modalContainer = document.createElement('div');
        modalContainer.style.display = 'none';
        modalContainer.style.position = 'fixed';
        modalContainer.style.top = '0';
        modalContainer.style.left = '0';
        modalContainer.style.width = '100%';
        modalContainer.style.height = '100%';
        modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalContainer.style.justifyContent = 'center';
        modalContainer.style.alignItems = 'center';

        const modalContent = document.createElement('div');
        modalContent.id = "templateModal";
        modalContent.style.boxShadow = '0 0 10px 1px black'
        modalContent.style.background = '#fff';
        modalContent.style.width = '1000px';
        modalContent.style.minHeight = '400px';
        modalContent.style.height = '80%';
        modalContent.style.overflow = 'auto';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '8px';
        modalContent.style.position = 'relative';

        const modalTitle = document.createElement('h1');
        modalTitle.textContent = 'Шаблон';
        modalTitle.style.marginBottom = '10px';
        modalTitle.style.textAlign = 'center';
        modalContent.appendChild(modalTitle);

        const infoContainer = document.createElement('div');
        infoContainer.style.margin = '15px 0';
        infoContainer.innerHTML = `
        <b>_HEADER_</b> — заголовок релиза с краткой технической информацией;<br>
        <b>_NAMES_</b> — названия аниме, каждое название с новой строки <b>_STRINGNAMES_</b> — названия аниме, выводятся все в одну строку;<br>
        <b>_POSTER_</b> — постер;<br>
        <b>_COUNTRY_</b> — страна; <br>
        <b>_YEAR_</b> — год выпуска; <b>_SEASON_</b> — сезон;<br>
        <b>_GENRE_</b> — жанр; <b>_TYPE_</b> — тип;<br>
        <b>_COUNT_</b> — количество эпизодов; <b>_DURATION_</b> — длительность;<br>
        <b>_DIRECTOR_</b> — режиссер;<br>
        <b>_STUDIO_</b> — название студии со ссылкой в BB формате; <b>_STUDIONAME_</b> — название студии;<br>
        <br>
        <b>_DESCRIPTION_</b> — описание;<br>
        <br>
        <b>_EPISODES_</b> — список эпизодов;<br>
        <br>
        Если поле "Подробные тех. данные" заполнено MediaInfo информацией, то заполняются следующие поля;<br>
        <b>_MEDIAINFO_</b> — отчёт MediaInfo;<br>
        <b>_VIDEOFORMAT_</b> — формат видео;  <b>_VIDEOHEIGHT_</b> — высота видео; <b>_VIDEOWIDTH_</b> — ширина видео; <br>
        <b>_VIDEOCODEC_</b> — кодек видео; <b>_VIDEOASPECT_</b> — соотношение сторон; <b>_VIDEOBITRATE_</b> — битрейт видео;<br>
        <b>_VIDEOFPS_</b> — частота кадров (fps); <b>_VIDEOBITDEPTH_</b> — битовая глубина;<br>
        <br>
        <b>_AUDIOLANG_</b> — язык аудио; <b>_AUDIOCODEC_</b> — кодек аудио;<br>
        <b>_AUDIOBITRATE_</b> — битрейт аудио; <b>_AUDIOASAMPLERATE_</b> — частота аудио;<br>
        <b>_AUDIOCHANNELS_</b> — количество каналов в аудио; <b>_AUDIOTITLE_</b> — название аудио;<br>
        <br>
        <b>_SUBLANG_</b> — язык субтитров; <b>_SUBFORMAT_</b> — формат субтитров; <b>_SUBNAME_</b> — название субтитров;
    `;

        modalContent.appendChild(infoContainer);

        const templateArea = document.createElement('textarea');
        templateArea.value = localStorage.getItem(localStorageName);
        templateArea.rows = 20;
        templateArea.id = 'templateArea';
        templateArea.style.width = '100%';
        templateArea.style.resize = 'vertical';
        modalContent.appendChild(templateArea);

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.marginTop = '10px'; // Добавим отступ между кнопками и содержимым

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Сохранить';
        saveButton.style.marginRight = '10px'; // Добавим отступ между кнопками
        saveButton.style.backgroundColor = '#547eca';
        saveButton.style.padding = '5px 10px';
        saveButton.style.borderRadius = '5px';

        saveButton.addEventListener('click', function () {
            localStorage.setItem(localStorageName, templateArea.value);

            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = 'Шаблон сохранен';
            notification.style.position = 'fixed';
            notification.style.top = '30px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.padding = '10px';
            notification.style.backgroundColor = 'green';
            notification.style.color = 'white';
            notification.style.borderRadius = '5px';
            notification.style.opacity = '0'; // Устанавливаем начальную прозрачность
            notification.style.transition = 'opacity 0.1s ease-in-out'; // Добавляем анимацию
            document.body.appendChild(notification);

            setTimeout(function () {
                notification.style.opacity = '1';
            }, 100);

            setTimeout(function () {
                notification.style.opacity = '0';

                setTimeout(function () {
                    document.body.removeChild(notification);
                }, 500);
            }, 3000);
        });

        // Создаем кнопку "Закрыть"
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Закрыть';
        closeButton.style.backgroundColor = '#d67688';
        closeButton.style.padding = '5px 10px';
        closeButton.style.borderRadius = '5px';
        closeButton.addEventListener('click', closeModal);

        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(closeButton);
        modalContent.appendChild(buttonContainer);

        const closeButtonSymbol = document.createElement('div');
        closeButtonSymbol.innerHTML = '❌';
        closeButtonSymbol.style.position = 'absolute';
        closeButtonSymbol.style.top = '10px';
        closeButtonSymbol.style.right = '10px';
        closeButtonSymbol.style.fontSize = '24px';
        closeButtonSymbol.style.cursor = 'pointer';
        closeButtonSymbol.addEventListener('click', closeModal);

        modalContent.appendChild(closeButtonSymbol);
        modalContainer.appendChild(modalContent);
        document.body.appendChild(modalContainer);

        function openModal() {
            modalContainer.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        }

        function closeModal() {
            modalContainer.style.display = 'none';
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }

        const openButton = document.getElementById('setTemplateButton');
        openButton.addEventListener('click', openModal);
    }

    const setOptionIfExists = (select, value) => {
        const optionExists = Array.from(select.options).some(option => option.value === value);
        if (optionExists) {
            select.value = value;
        }
    };
    const fillFields = (anime) => {
        console.log(anime);
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
        const episodeTextArea = document.getElementById("bd78750529cad34e379eca8e6a255d42");
        othName.value = "";
        episodeTextArea.value = "";
        if (anime.names.ru) {
            rusName.value = anime.names.ru;
        }
        let fillRomaji = true;
        if (anime.names.en) {
            engName.value = anime.names.en;
        }
        else {
            if (anime.names.romaji) {
                engName.value = anime.names.romaji;
                fillRomaji = false;
            }
        }
        if (fillRomaji && anime.names.romaji && engName.value !== anime.names.romaji) {
            othName.value = anime.names.romaji;
        }

        if (anime.names.kanji) {
            othName.value = !!othName.value
                ? `${othName.value} / ${anime.names.kanji}`
                :anime.names.kanji;
        }

        if (anime.country) {
            setOptionIfExists(country, anime.country);
        }

        if (anime.season) {
            if (anime.season.year) {
                year.value = anime.season.year;
            }
        }

        if (anime.genres) {
            genre.value = anime.genres
        }

        if (anime.type.shortType) {
            setOptionIfExists(animeType, anime.type.shortType);
        }

        if (!!anime.type.episodes && Number(anime.type.episodes) > 1) {
            episodes.value = `${anime.type.episodes} из ${anime.type.episodes}`;
        }

        if (anime.type.duration && anime.type.episodes) {
            duration.value = Number(anime.type.episodes) === 1
                ? anime.type.duration
                : `${anime.type.episodes} эп, ~${anime.type.duration}`;
        }

        if (anime.director) {
            director.value = anime.director;
        }

        if (anime.description) {
            description.value = anime.description;
        }

        if (!!anime.studios) {
            studio.value = anime.studios.map(st => st.name).join(', ');
        }

        if (!!anime.episodes) {
            anime.episodes.forEach((name, index) => {
                episodeTextArea.value = `${episodeTextArea.value}${index + 1}. ${name}\n`;
            });
        }

    }
    const getTechData = (miData) => {
        const textareaElement = document.getElementById("60503004a43535a7eb84520612a2e26c");
        return textareaElement.value ? MiParser(textareaElement.value) : null;
    }
    const addTechButton = () => {
        const textareaElement = document.getElementById("60503004a43535a7eb84520612a2e26c");
        if (textareaElement) {
            const buttonSpan = document.createElement('span');
            buttonSpan.className = 'rel-el';

            const fillButton = document.createElement('input');
            fillButton.type = 'button';
            fillButton.style.width = '150px';
            fillButton.value = 'Заполнить тех. данные';
            fillButton.onclick = function() {
                try{
                    miInfo = null;
                    const techData = getTechData();
                    miInfo = techData;
                    console.log(techData);
                    if (techData) {
                        const videoFormat = document.getElementById("video_format");
                        const HDFormat = document.getElementById("7dc5360181c073093213c3a33682c1ea");
                        const video = document.getElementById("video");
                        const audioFields = [
                            {
                                audio: document.getElementById("390c478dabbdfa0a78d0f7a1e69d4dfa"),
                                lang: document.getElementById("lang_anime"),
                                title: document.getElementById("3890534b0fe393e9ff6490d7160b000d")
                            },
                            {
                                audio: document.getElementById("8f8407c22d6ee07cdee27ef409fc7fb1"),
                                lang: document.getElementById("lang_anime_2"),
                                title: document.getElementById("59bbcdb0c6493c4faf8a92e7c6345004")
                            },
                            {
                                audio: document.getElementById("bb467dadf3966b8bed32a178e398bdbb"),
                                lang: document.getElementById("lang_anime_3"),
                                title: document.getElementById("5c5af4d271c2bcdba51db721004b8de2")
                            }
                        ]
                        const textField = [
                            {
                                text: document.getElementById("38f8b090c53af5748bfc06686db808f6"),
                                lang: document.getElementById("sub_all_anime"),
                                title: document.getElementById("ea9559bbb5520f92f25309d8194035e2")
                            },
                            {
                                text: document.getElementById("0bc605b1fd444b189e35ee70aa5ca5ac"),
                                lang: document.getElementById("sub_all_anime_2"),
                                title: document.getElementById("7f34a9e3be76d5f4dfc7fd27bc2f745b")
                            },
                            {
                                text: document.getElementById("0736e6092bce471f377fe38e33eac723"),
                                lang: document.getElementById("sub_all_anime_3"),
                                title: document.getElementById("112f186c9190a9cf4d95c151d3a3fe42")
                            }
                        ]
                        if (techData.videoInfo) {
                            if (techData.videoInfo?.fileExt) {
                                setOptionIfExists(videoFormat, techData.videoInfo.fileExt);
                            }
                            if (techData.videoInfo?.height) {
                                setOptionIfExists(HDFormat, `${techData.videoInfo?.height}p`);
                            }
                            const videoInfo = [];
                            if (techData.videoInfo?.codec) {
                                videoInfo.push(techData.videoInfo.codec);
                            }
                            if (techData.videoInfo?.width && techData.videoInfo?.height && techData.videoInfo?.aspect) {
                                videoInfo.push(`${techData.videoInfo.width}x${techData.videoInfo.height} (${techData.videoInfo.aspect})`);
                            }
                            if (techData.videoInfo?.bitRate) {
                                videoInfo.push(techData.videoInfo.bitRate);
                            }
                            if (techData.videoInfo?.fps) {
                                videoInfo.push(`${techData.videoInfo.fps} fps`);
                            }
                            if (techData.videoInfo?.bitDepth) {
                                videoInfo.push(`${techData.videoInfo.bitDepth}bit`);
                            }
                            video.value = videoInfo.join(', ');
                        }
                        if (techData.audioInfo) {
                            for (let i = 0; i < techData.audioInfo.length; i++) {
                                const audio = techData.audioInfo[i];
                                const audioBlock = audioFields[i];
                                if (!audioBlock) break;
                                const audioInfo = [];
                                if (audio?.language) {
                                    audioInfo.push(audio.language);
                                }
                                if (audio?.codec) {
                                    audioInfo.push(audio.codec);
                                }
                                if (audio?.bitRate) {
                                    audioInfo.push(audio.bitRate);
                                }
                                if (audio?.sampleRate) {
                                    audioInfo.push(audio.sampleRate);
                                }
                                if (audio?.channels) {
                                    audioInfo.push(`${audio.channels} канала`);
                                }
                                audioBlock.audio.value = audioInfo.join(', ');
                                setOptionIfExists(audioBlock.lang, audio.language === "Русский"
                                    ? 'Русский (в составе контейнера)'
                                    : audio.language
                                );
                                if (audio?.title) {
                                    audioBlock.title.value = audio.title;
                                }
                            }
                        }
                        if (techData.textInfo) {
                            for (let i = 0; i < techData.textInfo.length; i++) {
                                const text = techData.textInfo[i];
                                const textBlock = textField[i];
                                if (!textBlock) break;
                                //Русский, ASS, Полные + Надписи - Crunchyroll (в составе контейнера)
                                const textInfo = [];
                                if (text?.language) {
                                    textInfo.push(text.language);
                                }
                                if (text?.format) {
                                    textInfo.push(text.format);
                                }
                                textInfo.push("встроенные");
                                textBlock.text.value = textInfo.join(", ");
                                setOptionIfExists(textBlock.lang, text.language?.toLowerCase());
                                if (text?.title) {
                                    textBlock.title.value = text.title;
                                }
                            }
                        }

                    }
                }
                catch (error) {
                    console.error('Ошибка: ', error.message);
                }
            };
            buttonSpan.appendChild(fillButton);
            textareaElement.parentNode.appendChild(buttonSpan);

        } else {
            console.error("Textarea не найден по указанному идентификатору.");
        }
    }

    addUrlRow();
    addActionRow();
    addTechButton();
    createModal();
})();
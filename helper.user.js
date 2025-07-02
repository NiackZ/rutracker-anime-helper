// ==UserScript==
// @name         rutracker release helper
// @namespace    rutracker helpers
// @description  Заполнение полей по данным со страницы аниме на сайте World-Art
// @version      7.0
// @author       NiackZ
// @homepage     https://github.com/NiackZ/rutracker-anime-helper
// @downloadURL  https://github.com/NiackZ/rutracker-anime-helper/raw/master/helper.user.js
// @updateURL    https://github.com/NiackZ/rutracker-anime-helper/raw/master/helper.user.js
// @match        https://rutracker.org/forum/posting.php?f=599&mode=new_rel
// @match        https://rutracker.org/forum/posting.php?f=1105&mode=new_rel
// @match        https://rutracker.org/forum/posting.php?f=1106&mode=new_rel
// @match        https://rutracker.org/forum/posting.php?f=1389&mode=new_rel
// @match        https://rutracker.org/forum/posting.php?f=1391&mode=new_rel
// @match        https://rutracker.org/forum/posting.php?f=2491&mode=new_rel
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=rutracker.org
// ==/UserScript==
//

(function() {
    'use strict';
    let miInfo = null;
    let animeInfo = null;
    let additionalVoiceRowCount = 0;
    const defaultTemplate = `$Header$
[font=sans2][align=center][size=28][b]$Names$[/b][/size][/align]

[img=right]$Poster$[/img]
[size=16]
[b]Страна[/b] $Country$
[b]Год выпуска[/b] $Year$
[b]Жанр[/b] $Genre$
[b]Тип[/b] $Type$
[b]Продолжительность[/b] $Count$ эп. по $Duration$
[b]Режиссер[/b] $Director$
[b]Студия[/b] $Studio$
[b]Информационные ссылки[/b] [url=$WA_Link$][b]World Art[/b][/url][b], [/b][url=$Shikimori_Link$][b]Shikimori[/b][/url][b], [/b][url=$MAL_Link$][b]MyAnimeList[/b][/url][b], [/b][url=$AniDb_Link$][b]AniDB[/b][/url], [url=https://www.kinopoisk.ru/film/123/][b]КиноПоиск[/b][/url], [url=https://www.imdb.com/title/123][b]IMDB[/b][/url]

[b]Описание[/b] $Description$

[b]Субтитры[/b]
_USERSUBS [b]#{index}[/b]: [img=1em]{flag}[/img] {language}, {format}, {title} - ()  USERSUBS_

[b]Качество[/b] $Quality$ [$Reaper$]
[b]Формат видео[/b] $Video_ext$
[b]Видео[/b] $Video_codec$, $Video_width$x$Video_height$ ($Video_aspect$), $Video_bit_rate$, $Video_bit_depth$ bits, $Video_fps$ fps

[b]Аудио[/b]
_USERAUDIO [b]#{index}[/b]: [img=1em]{flag}[/img] {language}, {codec}, {bitRate}, {sampleRate}, {bitDepth} bits, {channels} ch- {voice} от {title} {type} USERAUDIO_

[b]Все субтитры и озвучки в составе контейнера[/b]
[/size]

[spoiler="Список эпизодов"]
$Episodes$
[/spoiler]

[spoiler="Скриншоты"][align=center]
$Screenshots$
[/align][/spoiler]

[spoiler="Отличия от предыдущих раздач"]
$Differences$
[/spoiler][/font]

[spoiler="Подробные тех. данные"][pre]$MediaInfo$[/pre][/spoiler]`;
    const localStorageName = 'animeTemplate';
    const newAudioRowSubstringId = 'new_audio_row_';
    const LANG = {
        RUS: "Русский",
        ENG: "Английский",
        CHI: "Китайский",
        KAZ: "Казахский",
        JAP: "Японский"
    }
    const TAG = {
        header: '$Header$',
        names: '$Names$',
        namesString: '$String_names$',
        country: '$Country$',
        year: '$Year$',
        season: '$Season$',
        genre: '$Genre$',
        type: '$Type$',
        episodeCount: '$Count$',
        episodeDuration: '$Duration$',
        director: '$Director$',
        studio: '$Studio$',
        studioNames: '$Studio_names$',
        description: '$Description$',
        episodes: '$Episodes$',
        LINK: {
            WA: '$WA_Link$',
            Shikimori: '$Shikimori_Link$',
            MAL: '$MAL_Link$',
            AniDb: '$AniDb_Link$',
            ANN: '$ANN_Link$',
        },
        VIDEO: {
            ext: '$Video_ext$',
            height: '$Video_height$',
            width: '$Video_width$',
            codec: '$Video_codec$',
            codecProfile: '$Video_codec_profile$',
            aspect: '$Video_aspect$',
            bitrate: '$Video_bit_rate$',
            fps: '$Video_fps$',
            bitDepth: '$Video_bit_depth$',
            chromaSubsampling: '$Video_chroma_subsampling$',
            colorPrimaries: '$Video_color_primaries$'
        },
        FORM: {
            quality: '$Quality$',
            reaper: '$Reaper$',
            poster: '$Poster$',
            screenshots: '$Screenshots$',
            MI: '$MediaInfo$',
            differences: '$Differences$'
        },
        AUDIO: {
            start: '_USERAUDIO',
            end: 'USERAUDIO_',
        },
        SUB: {
            start: '_USERSUBS',
            end: 'USERSUBS_'
        },
        TEMPLATE: {
            index: '{index}',
            language: '{language}',
            flag: '{flag}',
            codec: '{codec}',
            bitRate: '{bitRate}',
            sampleRate: '{sampleRate}',
            bitDepth: '{bitDepth}',
            channels: '{channels}',
            title: '{title}',
            format: '{format}',
            type: '{type}',
            voice: '{voice}'
        }
    }
    const episodeType = {
        TV: 'TV',
        SP: 'Special'
    }
    const audioVoice = {
        single: 'Одноголосная',
        double: 'Двухголосная',
        multi: 'Многоголосная'
    }
    const voiceType = {
        over: 'Закадровая',
        dub: 'Дубляж'
    }
    const FIELDS = {
        RUS_NAME: document.getElementById("title_rus"),
        ENG_NAME: document.getElementById("title_eng"),
        OTHER_NAME: document.getElementById("19196242af37f0ad77a7f593b45f8207"),
        COUNTRY: document.getElementById("country_anime"),
        YEAR: document.getElementById("year"),
        GENRE: document.getElementById("genre"),
        ANIME_TYPE: document.getElementById("anime_type"),
        EPISODES: document.getElementById("731ffae21574667873e9717a7fa433b5"),
        DURATION: document.getElementById("playtime"),
        DIRECTOR: document.getElementById("director"),
        STUDIO: document.getElementById("c6ed4beb1b80956095e7c0aba867d08f"),
        DESCRIPTION: document.getElementById("description"),
        EPISODE_TEXTAREA: document.getElementById("bd78750529cad34e379eca8e6a255d42"),
        TECH_TEXTAREA: document.getElementById("60503004a43535a7eb84520612a2e26c"),
        VIDEO_FORMAT: document.getElementById("video_format"),
        HD_FORMAT: document.getElementById("7dc5360181c073093213c3a33682c1ea"),
        VIDEO: document.getElementById("video"),
        VIDEO_QUALITY: document.getElementById('c7d386dc7aa7d073d3d451fd279461da'),
        VIDEO_QUALITY_QC: document.getElementById('video_quality_cart_serial'),
        REAPER: document.getElementById('ccf5afda3cc4295d97c0bdb89e5dbd67'),
        POSTER: document.getElementById('poster'),
        SCREENSHOTS: document.getElementById('screenshots'),
        MEDIA_INFO: document.getElementById('60503004a43535a7eb84520612a2e26c'),
        DIFFERENCES: document.getElementById('1a3a0e59f6289fc73e6834c3709c1ffa'),
        AUDIO: [
            {
                INFO: document.getElementById("390c478dabbdfa0a78d0f7a1e69d4dfa"),
                LANG: document.getElementById("lang_anime"),
                TITLE: document.getElementById("3890534b0fe393e9ff6490d7160b000d")
            },
            {
                INFO: document.getElementById("8f8407c22d6ee07cdee27ef409fc7fb1"),
                LANG: document.getElementById("lang_anime_2"),
                TITLE: document.getElementById("59bbcdb0c6493c4faf8a92e7c6345004")
            },
            {
                INFO: document.getElementById("bb467dadf3966b8bed32a178e398bdbb"),
                LANG: document.getElementById("lang_anime_3"),
                TITLE: document.getElementById("5c5af4d271c2bcdba51db721004b8de2")
            }
        ],
        SUBS: [
            {
                INFO: document.getElementById("38f8b090c53af5748bfc06686db808f6"),
                LANG: document.getElementById("sub_all_anime"),
                TITLE: document.getElementById("ea9559bbb5520f92f25309d8194035e2")
            },
            {
                INFO: document.getElementById("0bc605b1fd444b189e35ee70aa5ca5ac"),
                LANG: document.getElementById("sub_all_anime_2"),
                TITLE: document.getElementById("7f34a9e3be76d5f4dfc7fd27bc2f745b")
            },
            {
                INFO: document.getElementById("0736e6092bce471f377fe38e33eac723"),
                LANG: document.getElementById("sub_all_anime_3"),
                TITLE: document.getElementById("112f186c9190a9cf4d95c151d3a3fe42")
            }
        ]
    }

    if (localStorage.getItem(localStorageName) === null) {
        localStorage.setItem(localStorageName, defaultTemplate);
    }
    const getTableTitles = () => {
        return document.querySelectorAll('.rel-title');
    }
    const valueIsEmpty = (value) => {
        return value === null || value === undefined || value === "";
    }
    const findLastTitleRow = (title) => {
        let maxNumber = -1;
        let element = null;
        getTableTitles().forEach(function(titleElement) {
            if (titleElement.textContent.includes(title)) {
                const match = titleElement.textContent.match(/(\d+)/);
                if (match && parseInt(match[0]) > maxNumber) {
                    maxNumber = parseInt(match[0]);
                    element = titleElement.parentElement;
                }
            }
        });
        return element;
    }
    function createVoiceElements(rowId) {
        const json = {
            voiceSelectId: `audio_voice_${rowId}`,
            voiceTypeSelectId: `voice_type_${rowId}`
        }
        const voice = document.createElement('select');
        voice.className = 'rel-el rel-input rel-single-sel';
        voice.id = json.voiceSelectId;

        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '» Голосность';
        voice.appendChild(emptyOption);

        for (const key in audioVoice) {
            if (audioVoice.hasOwnProperty(key)) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = audioVoice[key];
                voice.appendChild(option);
            }
        }

        const type = document.createElement('select');
        type.className = 'rel-el rel-input rel-single-sel';
        type.id = json.voiceTypeSelectId;

        const emptyVoiceType = document.createElement('option');
        emptyVoiceType.value = '';
        emptyVoiceType.textContent = '» Тип';
        type.appendChild(emptyVoiceType);

        for (const key in voiceType) {
            if (voiceType.hasOwnProperty(key)) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = voiceType[key];
                type.appendChild(option);
            }
        }

        return { voice, type, json };
    }
    const addVoiceFields = () => {
        getTableTitles().forEach(function(titleElement) {
            if (titleElement.textContent.includes('Аудио')) {
                additionalVoiceRowCount++;
                const audioRow = titleElement.parentElement;
                const secondCell = audioRow.querySelector('.rel-inputs');
                const result = createVoiceElements(additionalVoiceRowCount);
                secondCell.appendChild(document.createElement('br'));
                secondCell.appendChild(result.type);
                secondCell.appendChild(result.voice);
            }
        });
    }
    const fetchData = async (link, apiEndpoint = '/get/anime/info') => {
        const appUrl = 'https://anime-info-service.vercel.app';
        try {
            const response = await fetch(`${appUrl}${apiEndpoint}`, {
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
    }
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
            ASPECT: /Соотношение сторон дисплея\s+:\s+([^\r\n]+)/,
            FRAME_RATE: /Частота кадров\s+:\s+([^\r\n]+)/,
            CHROMA_SUBSAMPLING: /Субдискретизация насыщенности\s+:\s+([^\r\n]+)/,
            COLOR_PRIMARIES: /Основные цвета\s+:\s+([^\r\n]+)/,
            BIT_DEPTH: /Битовая глубина\s+:\s+(\d+)/,
            CHANNELS: /Канал\(-ы\)\s+:\s+(\d+)/,
            SAMPLING_RATE: /Частота дискретизации\s+:\s+(.+)/,
            LANGUAGE: /Язык\s+:\s+(.+)/,
            TITLE: /Заголовок\s+:\s+(.+)/,
            NAME: /Полное имя\s+:\s+([^\r\n]+)/
        };

        const parseField = (block, regex) => {
            const match = block.match(regex);
            return match ? match[1].trim() : null;
        };
        const translateLanguage = (lang) => {
            if (lang) {
                switch (lang.toLowerCase()) {
                    case "russian":
                        return LANG.RUS;
                    case "japanese":
                        return LANG.JAP;
                    case "english":
                        return LANG.ENG;
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
        }
        const removeSpacesExceptLast = (str) => {
            const spaceCount = (str.match(/ /g) || []).length;
            if (spaceCount <= 1) {
                return str;
            }

            const lastSpaceIndex = str.lastIndexOf(' ');
            const beforeLastSpace = str.slice(0, lastSpaceIndex);
            const afterLastSpace = str.slice(lastSpaceIndex);

            return `${beforeLastSpace.replace(/ /g, '')}${afterLastSpace}`;
        };
        const getVideoInfo = (videoBlockMatch, lang) => {
            if (videoBlockMatch) {
                const parseVideoBlock = (videoBlock, regex) => {
                    const _width = parseField(videoBlock, regex.WIDTH);
                    const _height = parseField(videoBlock, regex.HEIGHT);
                    const _fps = parseField(videoBlock, regex.FRAME_RATE);
                    const _bitRate = parseField(videoBlock, regex.BIT_RATE)?.replaceAll(',', '.');
                    return {
                        codec: parseField(videoBlock, regex.CODEC),
                        codecProfile: parseField(videoBlock, regex.CODEC_PROFILE),
                        width: _width ? _width.replaceAll(" ", "") : null,
                        height: _height ? _height.replaceAll(" ", "") : null,
                        aspect: parseField(videoBlock, regex.ASPECT),
                        fps: _fps ? _fps?.replaceAll(',', '.')?.split(" ")[0] : null,
                        chromaSubsampling: parseField(videoBlock, regex.CHROMA_SUBSAMPLING),
                        colorPrimaries: parseField(videoBlock, regex.COLOR_PRIMARIES),
                        bitDepth: parseField(videoBlock, regex.BIT_DEPTH),
                        bitRate: removeSpacesExceptLast(_bitRate),
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
                        const codec = parseField(audioBlock, regex.CODEC);
                        if (codec == null) return null;
                        return {
                            language: translateLanguage(parseField(audioBlock, regex.LANGUAGE)),
                            codec,
                            bitRate: removeSpacesExceptLast(parseField(audioBlock, regex.BIT_RATE)),
                            sampleRate: parseField(audioBlock, regex.SAMPLING_RATE)?.replaceAll(',', '.'),
                            bitDepth: parseField(audioBlock, regex.BIT_DEPTH),
                            channels: parseField(audioBlock, regex.CHANNELS),
                            title: parseField(audioBlock, regex.TITLE)
                        }
                    });
                }
                return parseAudioBlock(blocks, lang === EN ? REGEX_EN : REGEX_RU).filter(item => !!item);
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
            AUDIO_EXT: /Audio([\s\S]+?)(?=Audio|$)/g,
            AUDIO_RU_EXT: /Аудио([\s\S]*?)(?=Аудио|$)/g,
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
        const audioInfo = {
            int: null, ext: null
        }
        const textAreaExt = document.getElementById('ext_audio_area')?.value;
        if (!valueIsEmpty(textAreaExt)) {
            const audioExtBlockMatches = [...textAreaExt.matchAll(getRegexBlocks.AUDIO_EXT)];
            const audioExtBlockMatches_RU = [...textAreaExt.matchAll(getRegexBlocks.AUDIO_RU_EXT)];
            audioInfo.ext = audioExtBlockMatches_RU.length === 0
                ? getAudioInfo(audioExtBlockMatches, EN)
                : getAudioInfo(audioExtBlockMatches_RU, RU);
        }

        audioInfo.int = getAudioInfo(useEN ? audioBlockMatches : audioBlockMatches_RU, lang);
        const textInfo = getTextInfo(useEN ? textBlockMatches : textBlockMatches_RU, lang);
        if (videoInfo !== null) {
            videoInfo.fileExt = getFileExt(useEN ? generalBlockMatch : generalBlockMatch_RU, lang);
        }

        return { videoInfo, audioInfo, textInfo };
    }
    const addUrlRow = () => {
        const tbody = document.getElementById('rel-tpl');
        if (!tbody) return;
        const newRow = tbody.insertRow(0);

        const titleCell = newRow.insertCell(0);
        titleCell.className = 'rel-title';
        titleCell.innerText = 'Ссылка на аниме:';
        titleCell.appendChild(createNewScriptSpan());

        const inputsCell = newRow.insertCell(1);
        inputsCell.className = 'rel-inputs';

        const textField = document.createElement('input');
        textField.className = 'rel-el rel-input';
        textField.type = 'text';
        textField.id = 'titleLink';
        textField.maxLength = 200;
        textField.size = 80;
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
        if (!tbody) return;
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
        calcSpan.style.position = 'relative';

        const calcTemplateButton = document.createElement('input');
        calcTemplateButton.id = 'calcTemplateButton';
        calcTemplateButton.type = 'button';
        calcTemplateButton.style.width = '165px';
        calcTemplateButton.value = 'Сгенерировать описание';
        calcTemplateButton.onclick = async () => {
            const code = generate(localStorage.getItem(localStorageName));
            if (code) {
                await navigator.clipboard.writeText(code);
                console.info(code);
                showNotification('Сгенерированное описание скопировано в буфер обмена');
            }
        };

        setSpan.appendChild(setTemplateButton);
        calcSpan.appendChild(calcTemplateButton);
        actionCell.appendChild(setSpan);
        actionCell.appendChild(calcSpan);
    }
    const showNotification = (message) => {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
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
    }
    const createModal = () => {

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
        modalContent.style.width = '1200px';
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
        infoContainer.style.fontSize = '10pt';
        infoContainer.innerHTML = `
        <b>${TAG.header}</b> — заголовок релиза с краткой технической информацией;<br>
        <b>${TAG.names}</b> — названия аниме, каждое название с новой строки <b>${TAG.namesString}</b> — названия аниме, выводятся все в одну строку;<br>
        <b>${TAG.country}</b> — страна; <br>
        <b>${TAG.year}</b> — год выпуска; <b>${TAG.season}</b> — сезон;<br>
        <b>${TAG.genre}</b> — жанр; <b>${TAG.type}</b> — тип;<br>
        <b>${TAG.episodeCount}</b> — количество эпизодов; <b>${TAG.episodeDuration}</b> — длительность;<br>
        <b>${TAG.director}</b> — режиссер;<br>
        <b>${TAG.studio}</b> — названия студий со ссылкой в BB формате; <b>${TAG.studioNames}</b> — названия студий;<br>
        <b>${TAG.description}</b> — описание;<br>
        <b>${TAG.episodes}</b> — список эпизодов;<br>
        <b>${TAG.LINK.WA}</b> — ссылка на WA; <b>${TAG.LINK.Shikimori}</b> — ссылка на Shikimori; <b>${TAG.LINK.AniDb}</b> — ссылка на AniDb;<br>
        <b>${TAG.LINK.MAL}</b> — ссылка на MAL; <b>${TAG.LINK.ANN}</b> — ссылка на ANN;<br>
        <br>
        Если поле "Подробные тех. данные" заполнено MediaInfo информацией, то заполняются следующие поля;<br>
        <b>${TAG.VIDEO.ext}</b> — формат видео;  <b>${TAG.VIDEO.height}</b> — высота видео; <b>${TAG.VIDEO.width}</b> — ширина видео; <br>
        <b>${TAG.VIDEO.codec}</b> — кодек видео; <b>${TAG.VIDEO.codecProfile}</b> — профиль кодека; <b>${TAG.VIDEO.aspect}</b> — соотношение сторон; <br>
        <b>${TAG.VIDEO.bitrate}</b> — битрейт видео; <b>${TAG.VIDEO.fps}</b> — частота кадров (fps); <b>${TAG.VIDEO.bitDepth}</b> — битовая глубина;<br>
        <b>${TAG.VIDEO.chromaSubsampling}</b> — субдискретизация насыщенности; <b>${TAG.VIDEO.colorPrimaries}</b> — основные цвета;<br>
        <br>
        Поля ниже берутся из формы, если значения заполнены:<br>
        <b>${TAG.FORM.quality}</b> — качество видео; <b>${TAG.FORM.reaper}</b> — автор рипа;<br>
        <b>${TAG.FORM.poster}</b> — ссылка на постер; <b>${TAG.FORM.MI}</b> — тех. данные;<br>
        <b>${TAG.FORM.screenshots}</b> — скриншоты; <b>${TAG.FORM.differences}</b> — отличия;<br>
        <br>
        <b>${TAG.AUDIO.start}</b> — начало блока аудио; <b>${TAG.AUDIO.end}</b> — конец блока аудио;<br>
        <br>
        Внутри блока можно сформировать свой шаблон дорожки с аудио:<br>
        <b>${TAG.TEMPLATE.index}</b> — порядоковый номер <b>${TAG.TEMPLATE.language}</b> — язык; <b>${TAG.TEMPLATE.flag}</b> — ссылка на флаг с static.rutracker.cc;<br>
        <b>${TAG.TEMPLATE.codec}</b> — кодек; <b>${TAG.TEMPLATE.bitRate}</b> — битрейт; <br>
        <b>${TAG.TEMPLATE.sampleRate}</b> — частота; <b>${TAG.TEMPLATE.bitDepth}</b> — битовая глубина;<br>
        <b>${TAG.TEMPLATE.channels}</b> — количество каналов; <b>${TAG.TEMPLATE.title}</b> — название;<br>
        <b>${TAG.TEMPLATE.type}</b> — 'в составе контейнера' или 'внешним файлом'; <b>${TAG.TEMPLATE.voice}</b> — тип и голосность;<br>
        <br>
        <b>${TAG.SUB.start}</b> — начало блока субтитров; <b>${TAG.SUB.end}</b> — конец блока субтитров;<br>
        <br>
        Внутри блока можно сформировать свой шаблон строки субтитров:<br>
        <b>${TAG.TEMPLATE.index}</b> — порядоковый номер; <b>${TAG.TEMPLATE.language}</b> — язык; <b>${TAG.TEMPLATE.flag}</b> — ссылка на флаг с static.rutracker.cc;<br>
        <b>${TAG.TEMPLATE.format}</b> — формат субтитров; <b>${TAG.TEMPLATE.title}</b> — название;<br>
        <br>
        <i>${TAG.TEMPLATE.language}</i> — поддерживает следующие языки: русский, английский, японский, китайский, казахский;<br>
        <i>${TAG.TEMPLATE.flag}</i> — поддерживает флаги: русский, английский, японский;<br>
        <i>${TAG.TEMPLATE.voice}</i> — строка формируется в том случае, если значения выбраны из списка в строке "Аудио"<br>
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
            showNotification('Шаблон сохранен');
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
        if (!openButton) return;
        openButton.addEventListener('click', openModal);
    }
    const setOptionIfExists = (select, value) => {
        const optionExists = Array.from(select.options).some(option => option.value === value);
        if (optionExists) {
            select.value = value;
        }
    }
    const fillFields = (anime) => {
        console.log(anime);

        FIELDS.DESCRIPTION.value = "";
        FIELDS.DIRECTOR.value = "";
        FIELDS.EPISODES.value = "";
        FIELDS.OTHER_NAME.value = "";
        FIELDS.EPISODE_TEXTAREA.value = "";

        if (anime.names.ru) {
            anime.names.ru = anime.names.ru
                ?.replace('[', '(')
                ?.replace(']', ')');
            FIELDS.RUS_NAME.value = anime.names.ru;
        }
        let fillRomaji = true;
        if (anime.names.en) {
            anime.names.en = anime.names.en
                .replace('[', '')
                .replace(']', '');
            FIELDS.ENG_NAME.value = anime.names.en;
        }
        else {
            if (anime.names.romaji) {
                FIELDS.ENG_NAME.value = anime.names.romaji;
                fillRomaji = false;
            }
        }
        if (fillRomaji && anime.names.romaji && FIELDS.ENG_NAME.value.toLowerCase() !== anime.names.romaji.toLowerCase()) {
            FIELDS.OTHER_NAME.value = anime.names.romaji;
        }
        else if (anime.names.synonym) {
            FIELDS.OTHER_NAME.value = FIELDS.OTHER_NAME.value ? `${FIELDS.OTHER_NAME.value} / ${anime.names.synonym}`.trim() : anime.names.synonym;
        }

        if (anime.names.kanji) {
            FIELDS.OTHER_NAME.value = !!FIELDS.OTHER_NAME.value
                ? `${FIELDS.OTHER_NAME.value} / ${anime.names.kanji}`
                :anime.names.kanji;
        }

        if (anime.country) {
            setOptionIfExists(FIELDS.COUNTRY, anime.country);
        }

        if (anime.season) {
            if (anime.season.year) {
                FIELDS.YEAR.value = anime.season.year;
            }
        }

        if (anime.genres) {
            FIELDS.GENRE.value = anime.genres
        }

        if (anime.type.shortType) {
            setOptionIfExists(FIELDS.ANIME_TYPE, anime.type.shortType);
        }

        if (!!anime.type.episodes && Number(anime.type.episodes) > 1) {
            FIELDS.EPISODES.value = `${anime.type.episodes} из ${anime.type.episodes}`;
        }

        if (anime.type.duration && anime.type.episodes) {
            FIELDS.DURATION.value = Number(anime.type.episodes) === 1
                ? anime.type.duration
                : `${anime.type.episodes} эп, ~${anime.type.duration}`;
        }

        if (anime.director) {
            FIELDS.DIRECTOR.value = anime.director;
        }

        if (anime.description) {
            FIELDS.DESCRIPTION.value = anime.description;
        }

        if (!!anime.studios) {
            FIELDS.STUDIO.value = anime.studios.map(st => st.name).join(', ');
        }

        if (!!anime.episodes) {
            const episodesArray = anime.episodes.map((episode, index) => {
                const episodeNumber = (index + 1).toString().padStart(2, '0'); // Добавляем ведущие нули
                if (episode.type === episodeType.TV) {
                    return `${episodeNumber}. ${episode.name}`;
                } else {
                    return `${episodeNumber}. ${episode.name} (${episode.type})`;
                }
            });
            FIELDS.EPISODE_TEXTAREA.value = episodesArray.join('\n');
        }

    }
    const getTechData = () => {
        return FIELDS.TECH_TEXTAREA.value ? MiParser(FIELDS.TECH_TEXTAREA.value) : null;
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

                        FIELDS.VIDEO_FORMAT.value = '';
                        FIELDS.HD_FORMAT.value = '';
                        FIELDS.VIDEO.value = '';
                        FIELDS.AUDIO.forEach(audioField => {
                            audioField.INFO.value = "";
                            audioField.LANG.value = "";
                            audioField.TITLE.value = "";
                        });
                        FIELDS.SUBS.forEach(textField => {
                            textField.INFO.value = "";
                            textField.LANG.value = "";
                            textField.TITLE.value = "";
                        });

                        if (techData.videoInfo) {
                            if (techData.videoInfo?.fileExt) {
                                setOptionIfExists(FIELDS.VIDEO_FORMAT, techData.videoInfo.fileExt);
                            }
                            if (techData.videoInfo?.height) {
                                setOptionIfExists(FIELDS.HD_FORMAT, `${techData.videoInfo?.height}p`);
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
                                videoInfo.push(`${techData.videoInfo.bitDepth} bits`);
                            }
                            FIELDS.VIDEO.value = videoInfo.join(', ');
                        }

                        const processAudioInfo = (audioList, audioFields, langPrefix) => {
                            for (let i = 0; i < audioList.length; i++) {
                                const audio = audioList[i];
                                const audioBlock = audioFields[i] ? audioFields[i] : createAudioRow();
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
                                    let ch = audio.channels;
                                    if (ch == 6) {
                                        ch = "5.1";
                                    } else if (ch == 8) {
                                        ch = "7.1";
                                    }
                                    audioInfo.push(`${ch} ch.`);
                                }
                                audioBlock.INFO.value = audioInfo.join(', ');
                                setOptionIfExists(audioBlock.LANG, audio.language === LANG.RUS
                                    ? `${LANG.RUS} (${langPrefix})`
                                    : audio.language
                                );
                                if (audio?.title) {
                                    audioBlock.TITLE.value = audio.title;
                                }
                            }
                        }

                        //сброс значений
                        const audioRowToDelete = document.querySelectorAll(`[id^="${newAudioRowSubstringId}"]`);
                        audioRowToDelete.forEach(element => element.remove());
                        additionalVoiceRowCount = 3;

                        if (techData.audioInfo.int) {
                            const audioList = techData.audioInfo.int;
                            processAudioInfo(audioList, FIELDS.AUDIO, 'в составе контейнера');
                        }

                        if (techData.audioInfo.ext) {
                            const audioExtList = techData.audioInfo.ext;
                            const audioIntList = techData.audioInfo.int;
                            if (audioIntList !== null && audioIntList.length > 0) {
                                const intCount = audioIntList.length;
                                const processType = intCount > 3 ? [] : FIELDS.AUDIO.slice(intCount);
                                processAudioInfo(audioExtList, processType, 'внешним файлом');
                            } else if (audioExtList.length > 0) {
                                processAudioInfo(audioExtList, FIELDS.AUDIO, 'внешним файлом');
                            }
                        }

                        if (techData.textInfo) {
                            for (let i = 0; i < techData.textInfo.length; i++) {
                                const text = techData.textInfo[i];
                                const textBlock = FIELDS.SUBS[i];
                                if (!textBlock) break;
                                const textInfo = [];
                                if (text?.language) {
                                    textInfo.push(text.language);
                                }
                                if (text?.format) {
                                    textInfo.push(text.format);
                                }
                                textInfo.push("встроенные");
                                textBlock.INFO.value = textInfo.join(", ");
                                setOptionIfExists(textBlock.LANG, text.language?.toLowerCase());
                                if (text?.title) {
                                    textBlock.TITLE.value = text.title;
                                }
                            }
                        }

                    }
                }
                catch (error) {
                    console.error('Ошибка: ', error);
                }
            };
            buttonSpan.appendChild(fillButton);
            textareaElement.parentNode.appendChild(buttonSpan);

        } else {
            console.error("Textarea не найден по указанному идентификатору.");
        }
    }
    const generate = (template) => {
        if (miInfo == null) {
            alert("Вставьте MediaInfo в поле \"Подробные тех. данные\" и нажмите \"Заполнить тех. данные\"");
            return;
        }
        const audio = miInfo.audioInfo;
        let code = template;
        let qualityElement = FIELDS.VIDEO_QUALITY;//HD
        if (qualityElement == null) {
            qualityElement = FIELDS.VIDEO_QUALITY_QC;//QC
        }
        const qualityValue = qualityElement.value;
        const header = () => {
            const names = [];

            if (FIELDS.RUS_NAME.value) {
                names.push(FIELDS.RUS_NAME.value);
            }
            if (!valueIsEmpty(animeInfo?.names)) {
                const romName = animeInfo.names?.romaji;
                if (romName) {
                    if (romName.toLowerCase() === animeInfo.names?.en?.toLowerCase()) {
                        if (animeInfo.names.synonym) {
                            names.push(animeInfo.names.synonym);
                        }
                    }
                    else {
                        names.push(romName);
                    }
                }
            }
            else if (FIELDS.OTHER_NAME.value) {
                names.push(...FIELDS.OTHER_NAME.value
                    .split("/")
                    .filter(n => !valueIsEmpty(n))
                    .map(n => n.trim())
                );
            }

            if (FIELDS.ENG_NAME.value) {
                names.push(FIELDS.ENG_NAME.value);
            }
            function checkAudioLanguages(audioArray) {
                if (!audioArray) return null;
                return {
                    hasRussian: audioArray.some(track => track.language?.toLowerCase() === LANG.RUS.toLowerCase()),
                    hasChinese: audioArray.some(track => track.language?.toLowerCase() === LANG.CHI.toLowerCase()),
                    hasEnglish: audioArray.some(track => track.language?.toLowerCase() === LANG.ENG.toLowerCase()),
                    hasKazakh: audioArray.some(track => track.language?.toLowerCase() === LANG.KAZ.toLowerCase()),
                    hasJapanese: audioArray.some(track => track.language?.toLowerCase() === LANG.JAP.toLowerCase()),
                };
            }
            const intResult = checkAudioLanguages(audio.int);
            const extResult = checkAudioLanguages(audio.ext);
            const hasRussianAudio = intResult?.hasRussian || extResult?.hasRussian;
            const hasChineseAudio = intResult?.hasChinese || extResult?.hasChinese;
            const hasEnglishAudio = intResult?.hasEnglish || extResult?.hasEnglish;
            const hasKazakhAudio = intResult?.hasKazakh || extResult?.hasKazakh;
            const hasJapaneseAudio = intResult?.hasJapanese || extResult?.hasJapanese;
            const hasSubtitles = miInfo.textInfo.length > 0;

            const langArray = [];
            if (hasRussianAudio) {
                const arr = [];
                if (extResult?.hasRussian) {
                    arr.push('ext')
                }
                if (intResult?.hasRussian) {
                    arr.push('int')
                }
                langArray.push(`RUS(${arr.join('/')})`);
            }
            if (hasEnglishAudio) {
                langArray.push("ENG");
            }
            if (hasChineseAudio) {
                langArray.push("CHI");
            }
            if (hasKazakhAudio) {
                langArray.push("KAZ");
            }
            if (hasJapaneseAudio) {
                langArray.push("JAP");
            }
            let audioDescription = null;
            if (langArray.length > 0) {
                audioDescription = langArray.join(', ');
                if (hasSubtitles) {
                    audioDescription += "+Sub";
                }
            }
            let headerType = FIELDS.ANIME_TYPE.value;
            let episodes = FIELDS.EPISODES.value;
            if (animeInfo?.episodes) {
                const spCount = animeInfo.episodes?.filter(ep => ep.type === episodeType.SP).length || 0;
                if (spCount > 0) {
                    headerType = `${FIELDS.ANIME_TYPE.value}+${episodeType.SP}`;
                    episodes = `${animeInfo.type.episodes}+${spCount}`;
                    episodes = `${episodes} из ${episodes}`;
                }
            }

            return `${names.join(" / ")} [${headerType}] [${episodes}] [${audioDescription}] [${FIELDS.YEAR.value}, ${FIELDS.GENRE.value}, ${qualityValue}] [${miInfo.videoInfo.height}p]`;
        }
        const names = () => {
            return formatNames("\n");
        };
        const namesString = () => {
            return formatNames(" / ");
        };
        const formatNames = (separator) => {
            const names = [];
            if (FIELDS.OTHER_NAME.value) {
                names.push(...FIELDS.OTHER_NAME.value
                    .split("/")
                    .reverse()
                    .filter(n => !valueIsEmpty(n))
                    .map(n => n.trim())
                );
            }
            if (FIELDS.ENG_NAME.value) {
                names.push(FIELDS.ENG_NAME.value);
            }
            if (FIELDS.RUS_NAME.value) {
                names.push(FIELDS.RUS_NAME.value);
            }
            return names.join(separator);
        };
        const formatLink = (name, link) => `[url=${link}]${name}[/url]`;
        const studioNames = () => {
            if (!valueIsEmpty(animeInfo)) {
                return animeInfo.studios.map(studio => studio.name).join(', ');
            }
            return FIELDS.STUDIO.value;
        }
        const studio = () => {
            if (!valueIsEmpty(animeInfo)) {
                return animeInfo.studios.map(studio => formatLink(studio.name, studio.link)).join(', ');
            }
            return FIELDS.STUDIO.value;
        };
        const getFlagByLang = (lang) => {
            switch (lang) {
                case LANG.JAP:
                    return 'https://static.rutracker.cc/flags/87.gif';
                case LANG.RUS:
                    return 'https://static.rutracker.cc/flags/143.gif';
                case LANG.ENG:
                    return 'https://static.rutracker.cc/flags/1.gif';
            }
            return null;
        }

        code = code.replaceAll(TAG.header, header)
            .replaceAll(TAG.names, names)
            .replaceAll(TAG.namesString, namesString)
            .replaceAll(TAG.country, FIELDS.COUNTRY.value)
            .replaceAll(TAG.year, FIELDS.YEAR.value)
            .replaceAll(TAG.season, animeInfo?.season.name)
            .replaceAll(TAG.genre, FIELDS.GENRE.value)
            .replaceAll(TAG.type, FIELDS.ANIME_TYPE.value)
            .replaceAll(TAG.episodeCount, animeInfo?.type.episodes)
            .replaceAll(TAG.episodeDuration, animeInfo?.type.duration
                ? animeInfo?.type.duration
                : FIELDS.DURATION.value
            )
            .replaceAll(TAG.director, FIELDS.DIRECTOR.value)
            .replaceAll(TAG.studio, studio)
            .replaceAll(TAG.studioNames, studioNames)
            .replaceAll(TAG.description, FIELDS.DESCRIPTION.value)
            .replaceAll(TAG.episodes, FIELDS.EPISODE_TEXTAREA.value)
            .replaceAll(TAG.LINK.AniDb, animeInfo?.links.AniDb ? animeInfo.links.AniDb : TAG.LINK.AniDb)
            .replaceAll(TAG.LINK.ANN, animeInfo?.links.ANN ? animeInfo.links.ANN : TAG.LINK.ANN)
            .replaceAll(TAG.LINK.MAL, animeInfo?.links.MAL ? animeInfo.links.MAL : TAG.LINK.MAL)
            .replaceAll(TAG.LINK.Shikimori, animeInfo?.links.Shikimori ? animeInfo.links.Shikimori : TAG.LINK.Shikimori)
            .replaceAll(TAG.LINK.WA, animeInfo?.links.WA ? animeInfo.links.WA : TAG.LINK.WA)

            .replaceAll(TAG.VIDEO.ext, miInfo.videoInfo.fileExt)
            .replaceAll(TAG.VIDEO.codec, miInfo.videoInfo.codec)
            .replaceAll(TAG.VIDEO.codecProfile, miInfo.videoInfo.codecProfile)
            .replaceAll(TAG.VIDEO.width, miInfo.videoInfo.width)
            .replaceAll(TAG.VIDEO.height, miInfo.videoInfo.height)
            .replaceAll(TAG.VIDEO.aspect, miInfo.videoInfo.aspect)
            .replaceAll(TAG.VIDEO.chromaSubsampling, miInfo.videoInfo.chromaSubsampling)
            .replaceAll(TAG.VIDEO.colorPrimaries, miInfo.videoInfo.colorPrimaries)
            .replaceAll(TAG.VIDEO.bitrate, miInfo.videoInfo.bitRate)
            .replaceAll(TAG.VIDEO.fps, miInfo.videoInfo.fps)
            .replaceAll(TAG.VIDEO.bitDepth, miInfo.videoInfo.bitDepth);

        const matchAudio = code.match(new RegExp(`${TAG.AUDIO.start}(.*?)${TAG.AUDIO.end}`));
        const matchSubs = code.match(new RegExp(`${TAG.SUB.start}(.*?)${TAG.SUB.end}`));

        if (matchAudio) {
            const audioTemplate = matchAudio[1];
            const audios = [];
            if (!!audio.int) {
                audio.int.forEach(item => {
                    item.type = 'в составе контейнера';
                    audios.push(item);
                });
            }
            if (!!audio.ext) {
                audio.ext.forEach(item => {
                    item.type = 'внешним файлом';
                    audios.push(item);
                });
            }
            const elements = document.querySelectorAll('[id^="voice_type_"], [id^="audio_voice_"]');
            const voiceIdsData = {};
            elements.forEach(element => {
                const match = element.id.match(/\d+$/);
                if (match) {
                    const digit = match[0];
                    if (!voiceIdsData[digit]) {
                        voiceIdsData[digit] = {};
                    }
                    if (element.id.startsWith("voice_type_")) {
                        voiceIdsData[digit].voiceId = element.id;
                    } else if (element.id.startsWith("audio_voice_")) {
                        voiceIdsData[digit].audioVoiceId = element.id;
                    }
                }
            });
            const generateVoiceStr = (audioVal, voiceVal) => {
                const formattedVoice = audioVoice[audioVal];
                const formattedType = voiceType[voiceVal];
                if (formattedVoice) {
                    if (voiceVal === 'dub') {
                        return `${formattedVoice.replaceAll('ая', 'ый')} ${formattedType}`;
                    } else if (voiceVal === 'over') {
                        return `${formattedVoice} ${formattedType}`;
                    } else {
                        return formattedVoice;
                    }
                } else if (formattedType) {
                    return formattedType;
                }
                return '';
            }

            const replacement = audios.map((info, index) => {
                const _index = index + 1;
                const voiceString = generateVoiceStr(
                    document.getElementById(voiceIdsData[_index]?.audioVoiceId)?.value,
                    document.getElementById(voiceIdsData[_index]?.voiceId)?.value
                )

                const flag = getFlagByLang(info.language);
                return audioTemplate.trim()
                    .replace(TAG.TEMPLATE.index, _index)
                    .replace(TAG.TEMPLATE.flag, flag ? flag : TAG.TEMPLATE.flag)
                    .replace(TAG.TEMPLATE.language, info.language ? info.language : TAG.TEMPLATE.language)
                    .replace(TAG.TEMPLATE.codec, info.codec ? info.codec : TAG.TEMPLATE.codec)
                    .replace(TAG.TEMPLATE.bitRate, info.bitRate ? info.bitRate : TAG.TEMPLATE.bitRate)
                    .replace(TAG.TEMPLATE.sampleRate, info.sampleRate ? info.sampleRate : TAG.TEMPLATE.sampleRate)
                    .replace(TAG.TEMPLATE.bitDepth, info.bitDepth ? info.bitDepth : TAG.TEMPLATE.bitDepth)
                    .replace(TAG.TEMPLATE.channels, info.channels ? info.channels : TAG.TEMPLATE.channels)
                    .replace(TAG.TEMPLATE.title, info.title ? info.title : TAG.TEMPLATE.title)
                    .replace(TAG.TEMPLATE.type, info.type ? info.type : TAG.TEMPLATE.type)
                    .replace(TAG.TEMPLATE.voice, voiceString ? voiceString.toLowerCase() : TAG.TEMPLATE.voice)
            }).join('\n');

            code = code.replace(new RegExp(`${TAG.AUDIO.start}(.*?)${TAG.AUDIO.end}`), replacement).trim();
        }
        if (matchSubs) {
            const subsTemplate = matchSubs[1];
            const replacement = miInfo.textInfo.map((info, index) => {
                const flag = getFlagByLang(info.language);
                return subsTemplate.trim()
                    .replace(TAG.TEMPLATE.index, index + 1)
                    .replace(TAG.TEMPLATE.flag, flag ? flag : TAG.TEMPLATE.flag)
                    .replace(TAG.TEMPLATE.language, info.language ? info.language : TAG.TEMPLATE.language)
                    .replace(TAG.TEMPLATE.format, info.format ? info.format : TAG.TEMPLATE.format)
                    .replace(TAG.TEMPLATE.title, info.title ? info.title : TAG.TEMPLATE.title)
            }).join('\n');

            code = code.replace(new RegExp(`${TAG.SUB.start}(.*?)${TAG.SUB.end}`), replacement).trim();
        }

        return code.replaceAll(TAG.FORM.quality, qualityValue)
            .replaceAll(TAG.FORM.reaper, FIELDS.REAPER.value)
            .replaceAll(TAG.FORM.poster, FIELDS.POSTER.value)
            .replaceAll(TAG.FORM.screenshots, FIELDS.SCREENSHOTS.value)
            .replaceAll(TAG.FORM.MI, FIELDS.MEDIA_INFO.value)
            .replaceAll(TAG.FORM.differences, FIELDS.DIFFERENCES.value);
    }
    const createAudioRow = () => {
        const lastAudioRow = findLastTitleRow('Аудио');
        if (lastAudioRow) {
            additionalVoiceRowCount++;
            const newRow = document.createElement('tr');
            newRow.id = `${newAudioRowSubstringId}${additionalVoiceRowCount}`;
            const inputId = `audio_tech_info_${additionalVoiceRowCount}`;
            const selectId = `lang_anime_${additionalVoiceRowCount}`;
            const titleId = `about_audio_${additionalVoiceRowCount}`;
            const titleCell = document.createElement('td');
            titleCell.className = 'rel-title';
            titleCell.textContent = `Аудио #${additionalVoiceRowCount}:`;
            titleCell.appendChild(createNewScriptSpan());
            newRow.appendChild(titleCell);

            const inputsCell = document.createElement('td');
            inputsCell.className = 'rel-inputs';

            const inputElement = document.createElement('input');
            inputElement.className = 'rel-el rel-input';
            inputElement.type = 'text';
            inputElement.id = inputId;
            inputElement.maxLength = 200;
            inputElement.size = 80;

            const descriptionSpan = document.createElement('span');
            descriptionSpan.className = 'rel-el rel-free-el';
            descriptionSpan.textContent = '- кодек, битрейт (kbps), частота (Hz), количество каналов (ch)';

            const langSelect = document.createElement('select');
            langSelect.className = 'rel-el rel-input rel-single-sel';
            langSelect.id = selectId;

            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '» Язык';
            langSelect.appendChild(emptyOption);

            [
                'Русский (внешним файлом)',
                'Русский (в составе контейнера)',
                'Японский',
                'Английский',
                'Корейский',
                'Китайский',
                'Испанский',
                'Итальянский',
                'Немецкий'
            ].forEach(lang => {
                const option = document.createElement('option');
                option.value = lang;
                option.textContent = lang;
                langSelect.appendChild(option);
            })

            const voiceSpan = document.createElement('span');
            voiceSpan.className = 'rel-el rel-free-el';
            voiceSpan.textContent = 'Озвучка:';

            const voiceInputElement = document.createElement('input');
            voiceInputElement.className = 'rel-el rel-input';
            voiceInputElement.type = 'text';
            voiceInputElement.id = titleId;
            voiceInputElement.maxLength = 200;
            voiceInputElement.size = 40;

            const voiceTypeDescriptionSpan = document.createElement('span');
            voiceTypeDescriptionSpan.className = 'rel-el rel-free-el';
            voiceTypeDescriptionSpan.textContent = '- тип (одноголосая/многоголосая/дубляж), авторы/студия';

            const result = createVoiceElements(additionalVoiceRowCount);

            inputsCell.appendChild(inputElement);
            inputsCell.appendChild(descriptionSpan);
            inputsCell.appendChild(document.createElement('br'));
            inputsCell.appendChild(langSelect);
            inputsCell.appendChild(voiceSpan);
            inputsCell.appendChild(voiceInputElement);
            inputsCell.appendChild(voiceTypeDescriptionSpan);
            inputsCell.appendChild(document.createElement('br'));
            inputsCell.appendChild(result.type);
            inputsCell.appendChild(result.voice);

            newRow.appendChild(inputsCell);

            lastAudioRow.parentNode.insertBefore(newRow, lastAudioRow.nextSibling);
            console.log(`Добавлена новая строка с Аудио #${additionalVoiceRowCount}`);
            return {
                INFO: document.getElementById(inputId),
                LANG: document.getElementById(selectId),
                TITLE: document.getElementById(titleId),
                voiceSelectId: result.json.voiceSelectId,
                voiceTypeSelectId: result.json.voiceTypeSelectId
            };
        }
    }
    const createExtRow = () => {
        const findTechRow = (title) => {
            let element = null;
            getTableTitles().forEach(function(titleElement) {
                if (titleElement.textContent.includes(title)) {
                    element = titleElement.parentElement;
                }
            });
            return element;
        }

        const newRow = document.createElement('tr');
        const titleCell = newRow.insertCell(0);
        titleCell.className = 'rel-title';
        titleCell.innerText = 'Подробные тех. данные внешнего аудио:';
        titleCell.appendChild(createNewScriptSpan());

        const inputsCell = newRow.insertCell(1);
        inputsCell.className = 'rel-inputs';

        const textField = document.createElement('textarea');
        textField.className = 'rel-el rel-input';
        textField.id = 'ext_audio_area';

        const freeEl = document.createElement('span');
        freeEl.className = 'rel-el rel-free-el';
        freeEl.innerText = 'Вставьте информацию из отчета программы MediaInfo';

        inputsCell.appendChild(textField);
        inputsCell.appendChild(freeEl);

        const techRow = findTechRow('Подробные тех. данные');
        if (!techRow) return;
        techRow.parentNode.insertBefore(newRow, techRow);
    }
    const createNewScriptSpan = () => {
        const scriptField = document.createElement('span');
        scriptField.style.display = 'block';
        scriptField.style.color = 'gray'
        scriptField.style.fontStyle = 'italic';
        scriptField.style.fontSize = 'smaller';
        scriptField.innerText = '(script row)';
        return scriptField;
    }
    const init = () => {
        addVoiceFields();
        addUrlRow();
        addActionRow();
        addTechButton();
        createModal();
        createExtRow();
    }

    init();

})();
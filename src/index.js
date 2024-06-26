/**
 * BS Multiselect
 * v1.0.5 2024/06/9
 * Author: Dario Vinci
 * https: //github.com/dariovinci/dario-bs5-multiselect
 * 
 * Released under the MIT License
 */

/**/
const BsMultiselect = (function () {
    'use strict';

    /**/
    const Constructor = function (options) {

        //Default settings
        const defaults = {
            inputId: '',
            dataArray: {},
            selectAll: '',
            showCompactSelection: '',
            maxHeight: '',
            adjustBadgePosition: '',
            showSearchBox: '',
            ajaxSourceUrl: '',
            ajaxCreateDataArray: null,
            ajaxErrorCallback: (e) => {
                console.log(e);
            }
        };

        //Settings
        const settings = Object.assign({}, defaults, options);


        let selectedItems = [];
        let initComplete = false;
        const publicAPIs = {};

        //Campo Input principale --> va messo a readonly e data-bs-toggle="dropdown"
        const input = document.querySelector(settings.inputId + ' input[type="text"]');
        input.readOnly = true;
        input.setAttribute('data-bs-toggle', 'dropdown');

        //Definizione di altre variabili
        let dropdownMenu = '';
        let searchBox = '';
        let selectedListItemsTextDisplay = '';
        let chBoxes = '';

        let optionsArray = {};
        let filteredOptionsArray = {};

        //CONTROLLI
        if (!input) {
            throw new Error('Invalid input element');
        }

        //INIT
        if ((typeof settings.dataArray == 'undefined') && (typeof settings.ajaxSourceUrl == 'undefined')) {
            throw new Error('No data source');
        } else if ((typeof settings.dataArray !== 'undefined') && (settings.dataArray.length > 0)) {
            optionsArray = settings.dataArray;
            initMultiselect();
        } else {

            ajaxFetch().then((res) => {

                if ((settings.ajaxCreateDataArray !== null && typeof settings.ajaxCreateDataArray !== 'function')) {
                    throw new Error('Invalid args');
                } else {
                    if ((typeof settings.ajaxCreateDataArray !== null)) {
                        //manipolazione res
                        optionsArray = settings.ajaxCreateDataArray(res);
                        initMultiselect();
                    } else {
                        optionsArray = res;
                        initMultiselect();
                    }
                }


            }).catch(e => {
                settings.ajaxErrorCallback(e);
            });
        }

        function initMultiselect() {
            //Creazione del dropdown menu
            dropdownMenu = document.createElement(`div`);
            dropdownMenu.classList.add('dropdown-menu', 'w-100');

            //Se definita setta altezza massima al dropdown
            if ((typeof settings.maxHeight !== 'undefined')) {
                dropdownMenu.style.maxHeight = settings.maxHeight;
                dropdownMenu.classList.add('overflow-y-scroll');
            }

            //Creazione lista di opzioni
            for (let i = 0; i < optionsArray.length; i++) {
                const d = optionsArray[i];
                let selectAll = false;
                if ((typeof settings.selectAll !== 'undefined') && (settings.selectAll === true)) selectAll = true;
                createOptionElement(d, i, selectAll);
            }

            //Inserimento lista dopo il campo input
            input.insertAdjacentElement('afterend', dropdownMenu);

            //Tutte le checkbox
            chBoxes = document.querySelectorAll(settings.inputId + ' input[type="checkbox"]');
            chBoxes.forEach((checkbox) => {
                if (checkbox.checked) {
                    selectedItems.push({
                        value: checkbox.value,
                        text: checkbox.nextElementSibling.textContent
                    });
                }
            });

            //Inserimento campo di ricerca se richiesto
            if ((typeof settings.showSearchBox !== 'undefined') && settings.showSearchBox === true) {
                let searchInputWraper = document.createElement(`div`);
                searchInputWraper.classList.add('dropdown-item')
                dropdownMenu.insertBefore(searchInputWraper, dropdownMenu.firstChild);

                searchBox = document.createElement(`input`);
                searchBox.setAttribute('type', 'text');
                searchBox.classList.add('form-control');

                searchInputWraper.appendChild(searchBox);

                //Listener ricerca
                searchBox.addEventListener('keyup', function (e) {
                    filteredOptionsArray = filterByValue(optionsArray, searchBox.value);

                    let filteredValuesArray = [];
                    for (let i = 0; i < filteredOptionsArray.length; i++) {
                        const e = filteredOptionsArray[i];
                        filteredValuesArray.push(e.value);
                    }

                    chBoxes.forEach((checkbox) => {
                        if (filteredValuesArray.includes(checkbox.value)) checkbox.parentNode.parentNode.classList.remove('d-none');
                        else checkbox.parentNode.parentNode.classList.add('d-none');
                    });

                }, false)
            }


            //Creazione di un div che si va a sovrapporre al campo di input
            selectedListItemsTextDisplay = document.createElement(`div`);
            selectedListItemsTextDisplay.setAttribute('data-bs-toggle', 'dropdown');
            selectedListItemsTextDisplay.classList.add('w-100', 'd-flex', 'flex-no-wrap', 'overflow-x-scroll');
            selectedListItemsTextDisplay.style.position = 'absolute';
            if (settings.adjustBadgePosition != undefined) {
                selectedListItemsTextDisplay.style.top = 'calc(1.8rem  ' + settings.adjustBadgePosition + ')';
            } else {
                selectedListItemsTextDisplay.style.top = '1.8rem';
            }
            selectedListItemsTextDisplay.style.zIndex = "3";
            selectedListItemsTextDisplay.style.padding = '0rem 0.7rem';
            input.insertAdjacentElement('afterend', selectedListItemsTextDisplay);
            printSelectedListItems();



            //Listener Selezione di una opzione
            for (let i = 0; i < chBoxes.length; i++) {
                chBoxes[i].addEventListener('change', function (e) {

                    updateOnChange();

                }, false)
            };

            initComplete = true;
            //END INIT
        }



        //Caricamento dei dati mediante chiamata ajax
        async function ajaxFetch() {
            const req = await fetch(
                settings.ajaxSourceUrl, {
                    method: 'GET',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

            if (!req.ok) {
                throw new Error(`HTTP error - status: ${req.status}`);
            } else {
                return await req.json();
            }
        }

        //Filtro per la ricerca
        function filterByValue(array, string) {
            return array.filter(o =>
                Object.keys(o).some(k => o[k].toLowerCase().includes(string.toLowerCase())));
        }


        //Chiamata per aggiornare la lista delle opzioni selezionate
        function updateOnChange() {
            selectedItems = [];

            chBoxes.forEach((checkbox) => {
                if (checkbox.checked) {
                    selectedItems.push({
                        value: checkbox.value,
                        text: checkbox.nextElementSibling.textContent
                    });
                }
            });

            printSelectedListItems();
        }


        //Stampa i badge con le varie opzioni selezionate
        function printSelectedListItems() {

            selectedListItemsTextDisplay.innerHTML = '';

            if (typeof settings.showCompactSelection !== 'undefined') {

                if (settings.showCompactSelection === true) {
                    if (selectedItems.length == 0) {
                        selectedListItemsTextDisplay.innerHTML = '';
                    } else if (selectedItems.length == 1) {
                        selectedListItemsTextDisplay.innerHTML = `<span class="me-1 badge text-bg-primary">${selectedItems[0].text}</span>`;
                    } else {
                        selectedListItemsTextDisplay.innerHTML = `<span class="me-1 badge text-bg-primary">${selectedItems[0].text} +${(selectedItems.length - 1)}</span>`;
                    }
                } else {
                    for (let i = 0; i < selectedItems.length; i++) {
                        selectedListItemsTextDisplay.innerHTML += `<span class="me-1 badge text-bg-primary">${selectedItems[i].text}</span>`;
                    }
                }
            } else {
                for (let i = 0; i < selectedItems.length; i++) {
                    selectedListItemsTextDisplay.innerHTML += `<span class="me-1 badge text-bg-primary">${selectedItems[i].text}</span>`;
                }
            }
        }

        //Creazione della singola opzione
        function createOptionElement(data, index, selectAll) {
            let checkbox = document.createElement(`div`);
            let checked = selectAll == true ? 'checked' : '';
            checkbox.classList.add('dropdown-item');
            checkbox.innerHTML = `<div class="form-check">
                                    <input class="form-check-input" type="checkbox" ${checked} value="${data.value}" id="multiselect-checkbox-${index}">
                                    <label class="form-check-label" for="multiselect-checkbox-${index}">
                                        ${data.text}
                                    </label>
                                </div>`;

            dropdownMenu.appendChild(checkbox);
        }


        //Prende i valori inviati tramite array e li seleziona
        function updateSelectedItemsList(values, checked) {

            for (let i = 0; i < values.length; i++) {
                chBoxes.forEach((checkbox) => {
                    if (checkbox.value == values[i]) {
                        checkbox.checked = checked;
                    }
                });
            }

        }

        //Modifica la lista delle opzioni
        function updateOptionsList(data) {
            selectedListItemsTextDisplay.innerHTML = '';
            selectedItems = [];
            dropdownMenu.innerHTML = '';
            for (let i = 0; i < data.length; i++) {
                createOptionElement(data[i], i, false);
            }

            chBoxes = document.querySelectorAll(settings.inputId + ' input[type="checkbox"]');

            //Listener Selezione di una opzione
            for (let i = 0; i < chBoxes.length; i++) {
                chBoxes[i].addEventListener('change', function (e) {
                    updateOnChange();
                }, false)
            };
        }

        //Fa il reset di tutte le checkbox
        function resetMultiselect() {
            selectedListItemsTextDisplay.innerHTML = '';
            selectedItems = [];
            chBoxes.forEach((checkbox) => {
                selectAll === true ? checkbox.checked = true : checkbox.checked = false;
            });

            if (selectAll === true) {
                chBoxes.forEach((checkbox) => {
                    checkbox.checked = true;
                    selectedItems.push({
                        value: checkbox.value,
                        text: checkbox.nextElementSibling.textContent
                    });
                });
                printSelectedListItems();
            } else {
                chBoxes.forEach((checkbox) => {
                    checkbox.checked = false;
                });
            }
        }


        //Public Interface

        /**/
        publicAPIs.initComplete = function () {
            return initComplete;
        }

        publicAPIs.getselectedItems = function () {
            return selectedItems;
        }

        publicAPIs.getselectedItemsValues = function () {
            let valuesArray = [];
            for (let i = 0; i < selectedItems.length; i++) {
                const v = selectedItems[i];
                valuesArray.push(v.value);
            }
            return valuesArray;
        }

        publicAPIs.setSelectedElements = function (values, checked) {
            updateSelectedItemsList(values, checked);
        };

        publicAPIs.updateOptionsList = function (values) {
            updateOptionsList(values);
        };

        publicAPIs.reset = function (values) {
            resetMultiselect();
        };


        return publicAPIs;
    };

    return Constructor;
})();

module.exports = BsMultiselect;
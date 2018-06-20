/*
		MIT License

		Copyright (c) 2018 Tamás Pleszkán

		Permission is hereby granted, free of charge, to any person obtaining a copy
		of this software and associated documentation files (the "Software"), to deal
		in the Software without restriction, including without limitation the rights
		to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		copies of the Software, and to permit persons to whom the Software is
		furnished to do so, subject to the following conditions:

		The above copyright notice and this permission notice shall be included in all
		copies or substantial portions of the Software.

		THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
		SOFTWARE.
*/
class Table {
    constructor(settings) {
        let canStart = true;
        let error = "";

        if (settings.hasOwnProperty("url")) {
            this.url = settings.url;
        } else {
            error += "You need to specify a URL for the backend!\n\r";
            canStart = false;
        }

        if (settings.hasOwnProperty("rowLimit")) {
            this.rowLimit = settings.rowLimit;
        } else {
            this.rowLimit = 10;
        }

        if (settings.hasOwnProperty("table")) {
            this.table = settings.table;
        } else {
            error += "You need to specify which table you want to use this class with!\n\r";
            canStart = false;
        }

        if (settings.hasOwnProperty("loader")) {
            this.loader = settings.loader;
        } else {
            this.loader = undefined;
        }

        if (settings.hasOwnProperty("muted")) {
            this.muted = settings.muted;
        } else {
            this.muted = false;
        }

        if (settings.hasOwnProperty("dataNames")) {
            this.dataNames = settings.dataNames;
        } else {
            error += "You did not specify the column types!\n\r";
            canStart = false;
        }

        if (settings.hasOwnProperty("errorBox")) {
            this.errorBox = settings.errorBox;
        } else {
            this.errorBox = undefined;
        }

        if (settings.hasOwnProperty("searchBox")) {
            this.searchBox = settings.searchBox;
        } else {
            this.searchBox = undefined;
        }

        if(settings.hasOwnProperty("paginatorCallback")) {
            this.paginatorCallback = settings.paginatorCallback;
        } else {
            this.paginatorCallback = undefined;
        }

        this.searchString = "";
        this.audio = new Audio('../res/unsure.mp3');
        this.rows = [];
        this.ajaxLoop;
        this.page = 1;

        if (canStart) {
            this.loopAjax();
            this.getInitial(this.paginatorCallback);
            if (this.searchBox !== undefined) {
                this.searchListener();
            }
        } else {
            alert(error);
        }
    }

    removeAllRowsFromTable() {
        this.limitRows(0);
    }

    searchListener() {
        let timeout;
        let that = this;
        $(this.searchBox).on("keyup", function () {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function () {
                that.setSearchString($(that.searchBox).val());
                that.getInitial();
            }, 700);
        });
    }

    setSearchString(s) {
        this.searchString = s;
    }

    getSearchString() {
        return this.searchString;
    }

    getInitial() {
        let that = this;
        this.displayLoader();
        clearTimeout(this.ajaxLoop);
        $.ajax({
            url: that.url + "?limit=" + that.rowLimit + "&search=" + that.searchString + "&page=" + that.page
        }).done(function (msg) {
            that.removeAllRowsFromTable();
            that.ajaxSuccessFul(msg);
        }).fail(function (errorObject, status) {
            that.displayError(status);
            that.removeLoader();
        });
        this.loopAjax();
    }


    add() {
        let that = this;
        this.displayLoader();
        $.ajax({
            url: this.url + "?newRow&limit=" + that.rowLimit + "&search=" + that.searchString
        }).done(function (msg) {
            that.ajaxSuccessFul(msg, true, true);
        }).fail(function (errorObject, status) {
            that.displayError(status);
            that.removeLoader();
        });
    }

    ajaxSuccessFul(msg, allowSound = false, newRow = false) {
        let data = $.parseJSON(msg);
        let that = this;
        if(!newRow) {
            this.handleMessage(data, allowSound);
        } else if (newRow && that.getSearchString() === "" && that.page === 1) {
            this.handleMessage(data);
        } else {
            that.removeLoader();
        }

        if (data.data.length > 0 && allowSound === true) {
            that.playSound();
        }
    }

    handleMessage(data) {
        let that = this;
        if (data.status === "OK") {
            this.pushToTable(data.data);
            if(this.paginatorCallback !== undefined) {
                this.paginatorCallback(data.currentPage, data.page);
            }
        } else {
            this.displayError(data.errorMsg);
        }
        this.removeLoader();
    }

    displayError(msg) {
        if (this.errorBox !== undefined) {
            let that = this;
            $(this.errorBox).html('<div class="alert alert-danger" role="alert" id="genearatedErrorMsg">' + msg + '</div>');
            $(this.errorBox).fadeIn("slow");
            setTimeout(function () {
                $(that.errorBox).fadeOut("slow", function () {
                    $(that.errorBox).html("");
                });
            }, 5000);
        } else {
            console.log(msg);
        }
    }

    pushToTable(data) {
        let that = this;
        for (let i = 0; i < data.length; i++) {
            let row = this.table.insertRow(1);
            this.rows.push(row);
            that.limitRows(that.rowLimit);
            let rowNum = 0;
            for (let j = 0; j < that.dataNames.length; j++) {
                if (that.dataNames[j].type === "data") {
                    let cell = row.insertCell(rowNum);
                    rowNum++;
                    cell.innerHTML = data[i][that.dataNames[j].name];
                }
                if (that.dataNames[j].type === "checkbox") {
                    let cell = row.insertCell(rowNum);
                    rowNum++;
                    let innerHTML = "<input type='checkbox' ";
                    if (that.dataNames[j].hasOwnProperty("addID") && that.dataNames[j].addID) {
                        innerHTML += "id='" + that.dataNames[j].id + data[i].id + "' ";
                    }
                    if (that.dataNames[j].hasOwnProperty("highlightRow") && that.dataNames[j].highlightRow && that.dataNames[j].hasOwnProperty("highlightClass")) {
                        innerHTML += "onclick='Table.highlightRow(this, \"" + that.dataNames[j].highlightClass + "\")'";
                    }
                    innerHTML += "/>";
                    cell.innerHTML = innerHTML;
                }
            }
        }
    }

    limitRows(rowNumber) {
        let that = this;
        while (that.rows.length > rowNumber) {
            let rowToDelete = that.rows.shift();
            $(rowToDelete).remove();
        }
    }

    displayLoader() {
        if (this.loader !== undefined) {
            $(this.loader).css("visibility", "visible");
        }
    }

    removeLoader() {
        if (this.loader !== undefined) {
            $(this.loader).css("visibility", "hidden");
        }
    }

    loopAjax() {
        let that = this;
        this.ajaxLoop = window.setInterval(function () {
            that.add();
        }, 10000);
    }

    playSound() {
        let that = this;
        if (this.muted !== true) {
            that.audio.play();
        }
    }

    toggleAudio() {
        if (this.muted === true) {
            this.muted = false;
        } else {
            this.muted = true;
        }
    }

    isMuted() {
        return this.muted;
    }

    reloadTable() {
        this.getInitial();
    }

    static highlightRow(checkbox, highlightClass) {
        if (checkbox.checked) {
            $(checkbox).parent().parent().addClass(highlightClass);
        } else {
            $(checkbox).parent().parent().removeClass(highlightClass);
        }
    }

    setPage(page) {
        console.log("Setting page to " + page);
        this.page = page;
        this.getInitial();
    }

}

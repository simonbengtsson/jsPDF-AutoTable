function auto() {
    var doc = new jsPDF('p', 'pt');
    doc.autoTable(columns, data, {});
    publish(doc.output('datauristring'));
}

function minimal() {
    var doc = new jsPDF('p', 'pt');
    doc.autoTable(columns, data, {extendWidth: false, padding: 2, lineHeight: 12, fontSize: 8});
    publish(doc.output('datauristring'));
}

function longData() {
    var doc = new jsPDF('l', 'pt');
    doc.text("All columns ellipsized", 40, 50);
    doc.autoTable(columnsLong, dataLong, {startY: 70});
    doc.text("Only text columns ellipsized", 40, doc.autoTableEndPosY() + 30);
    doc.autoTable(columnsLong, dataLong, {startY: 220, overflowColumns: ['text', 'text2']});
    doc.text("Overflow linebreak", 40, doc.autoTableEndPosY() + 30);
    doc.autoTable(columnsLong, dataLong, {startY: 370, overflow: 'linebreak', overflowColumns: ['text', 'text2']});
    publish(doc.output('datauristring'));
}

function content() {
    var doc = new jsPDF('p', 'pt');
    doc.setFontSize(20);
    doc.text('Title', 40, 48);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    var splitTitle = doc.splitTextToSize(longText, doc.internal.pageSize.width - 80);
    doc.text(splitTitle, 40, 65);
    doc.autoTable(columns, moreData, {startY: 200});
    doc.text(splitTitle, 40, doc.autoTableEndPosY() + 40);
    publish(doc.output('datauristring'));
}

function multiple() {
    var doc = new jsPDF('p', 'pt');
    doc.setFontSize(22);
    doc.text("Multiple tables", 40, 60);
    doc.setFontSize(12);
    doc.text("The tables avoid being split into multiple pages.", 40, 80);

    var firstStartY = 120;
    for (var j = 0; j < 4; j++) {
        var endPosY = doc.autoTableEndPosY();
        doc.autoTable(columns, data, {
            startY: endPosY ? endPosY + 50 : firstStartY,
            avoidPageSplit: true,
            margins: {horizontal: 40, top: 60, bottom: 40}
        });
    }

    publish(doc.output('datauristring'));
}

function html() {
    var doc = new jsPDF('p', 'pt');
    doc.text("From HTML", 40, 50);
    // Be sure to set the second parameter (indexBased option) to true
    // It will be the default behavior in v2.0, but are now behind an option for compatibility
    var res = doc.autoTableHtmlToJson(document.getElementById("basic-table"), true);
    doc.autoTable(res.columns, res.data, {startY: 60});
    publish(doc.output('datauristring'));
}

function headerAndFooter() {
    var totalPagesExp = "{total_pages_count_string}";
    var doc = new jsPDF('p', 'pt');
    var header = function (doc, pageCount, options) {
        doc.setFontSize(20);
        doc.text("Report for X", options.margins.horizontal, 60);
        doc.setFontSize(options.fontSize);
    };
    var footer = function (doc, lastCellPos, pageCount, options) {
        var str = "Page " + pageCount + " of " + totalPagesExp;
        doc.text(str, options.margins.horizontal, doc.internal.pageSize.height - 30);
    };
    var options = {renderHeader: header, renderFooter: footer, margins: {horizontal: 40, top: 80, bottom: 50}};
    doc.autoTable(columns, moreData, options);
    doc.putTotalPages(totalPagesExp);
    publish(doc.output('datauristring'));
}

function customStyle() {
    var doc = new jsPDF('p', 'pt');
    var header = function (rect, key, value, settings) {
        doc.setFillColor(26, 188, 156); // Turquoise
        doc.setTextColor(255, 255, 255);
        doc.setFontStyle('bold');
        doc.rect(rect.x, rect.y, rect.width, rect.height, 'F');
        rect.y += settings.lineHeight / 2 + doc.internal.getLineHeight() / 2;
        doc.text('' + value, rect.x + settings.padding, rect.y);
    };
    var cell = function (rect, key, value, row, settings) {
        // See path-painting operators in the PDF spec, examples are
        // 'S' for stroke, 'F' for fill, 'B' for both stroke and fill
        var style = 'S';

        if (key === 'id') {
            style = 'B';
            doc.setFillColor(240);
        }

        if (key === 'expenses') {
            if (parseInt(value.substring(1, value.length)) > 5) {
                doc.setTextColor(200, 0, 0);
            }
        }

        doc.setLineWidth(0.1);
        doc.setDrawColor(240);

        doc.rect(rect.x, rect.y, rect.width, rect.height, style);

        if (key === 'expenses') {
            var strWidth = doc.getStringUnitWidth('' + value) * doc.internal.getFontSize();
            rect.x += rect.width;
            rect.x -= 2 * settings.padding;
            rect.x -= strWidth;
        }

        if (key === 'id') {
            rect.x -= 2 * settings.padding;
            rect.x += rect.width / 2;
        }

        rect.y += settings.lineHeight / 2 + doc.internal.getLineHeight() / 2 - 2.5;
        doc.text('' + value, rect.x + settings.padding, rect.y);
        doc.setTextColor(50);
    };
    doc.autoTable(columns, data, {renderCell: cell, renderHeaderCell: header});

    doc.setDrawColor(200);

    // Row- and colspan
    var renderCell = function (rect, key, value, row, settings) {
        // Colspan
        if (row === 0) {
            if (key == 'id') {
                doc.rect(rect.x, rect.y, doc.internal.pageSize.width - settings.margins.horizontal * 2, rect.height, 'S');
                rect.y += settings.lineHeight / 2 + doc.internal.getLineHeight() / 2 - 2.5;
                doc.text("A rowspan that works as a sub header", rect.x + settings.padding, rect.y);
            }
        }
        // Rowspan
        else if (key === 'id') {
            if (row === 1 || row === 4 || row === 7) {
                doc.rect(rect.x, rect.y, rect.width, rect.height * 3, 'S');
                rect.y += settings.lineHeight * 3 / 2 + doc.internal.getLineHeight() / 2 - 2.5;
                var w = doc.getStringUnitWidth('' + value) * doc.internal.getFontSize();
                doc.text('' + value, rect.x + rect.width / 2 - w / 2, rect.y);
            }
        }
        // Others
        else {
            doc.rect(rect.x, rect.y, rect.width, rect.height, 'S');
            rect.y += settings.lineHeight / 2 + doc.internal.getLineHeight() / 2 - 2.5;
            doc.text('' + value, rect.x + settings.padding, rect.y);
        }
    };
    doc.autoTable(columns, data, {startY: 300, renderCell: renderCell});
    document.getElementById("output").src = doc.output('datauristring');
}

function publish(uri) {
    document.getElementById("output").src = uri;
}
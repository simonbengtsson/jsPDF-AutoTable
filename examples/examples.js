function auto() {
    var doc = new jsPDF('p', 'pt');
    doc.autoTable(columns, data);
    publish(doc.output('datauristring'));
}

function minimal() {
    var doc = new jsPDF('p', 'pt');
    doc.autoTable(columns, data, {extendWidth: false, padding: 2, lineHeight: 12, fontSize: 8});
    publish(doc.output('datauristring'));
}

function longData() {
    var doc = new jsPDF('l', 'pt');
    doc.text("All columns ellipsized", 10, 50);
    doc.autoTable(columnsLong, dataLong, {margins: {right: 10, left: 10, top: 40, bottom: 40}, startY: 70});
    doc.text("Only text columns ellipsized", 10, doc.autoTableEndPosY() + 30);
    doc.autoTable(columnsLong, dataLong, {margins: {horizontal: 10, top: 40, bottom: 40}, startY: 220, overflowColumns: ['text', 'text2']});
    doc.text("Overflow linebreak", 10, doc.autoTableEndPosY() + 30);
    doc.autoTable(columnsLong, dataLong, {margins: {horizontal: 10, top: 40, bottom: 40}, startY: 370, overflow: 'linebreak', overflowColumns: ['text', 'text2']});
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

    doc.autoTable(columns, data, {
        startY: 120,
        avoidPageSplit: true,
        margins: {left: 10, right: 300, top: 60, bottom: 40},
        fontSize: 8
    });

    doc.autoTable(columns, data, {
        startY: 120,
        avoidPageSplit: true,
        margins: {left: 300, right: 10, top: 60, bottom: 40},
        fontSize: 8
    });

    for (var j = 0; j < 4; j++) {
        doc.autoTable(columns, data, {
            startY: doc.autoTableEndPosY() + 50,
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
    var header = function (x, y, width, height, key, value, settings) {
        doc.setFillColor(26, 188, 156); // Turquoise
        doc.setTextColor(255, 255, 255);
        doc.setFontStyle('bold');
        doc.rect(x, y, width, height, 'F');
        y += settings.lineHeight / 2 + doc.internal.getLineHeight() / 2;
        doc.text('' + value, x + settings.padding, y);
    };
    var cell = function (x, y, width, height, key, value, row, settings) {
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

        doc.rect(x, y, width, height, style);

        if (key === 'expenses') {
            var strWidth = doc.getStringUnitWidth('' + value) * doc.internal.getFontSize();
            x += width;
            x -= 2 * settings.padding;
            x -= strWidth;
        }

        if (key === 'id') {
            x -= 2 * settings.padding;
            x += width / 2;
        }

        y += settings.lineHeight / 2 + doc.internal.getLineHeight() / 2 - 2.5;
        doc.text('' + value, x + settings.padding, y);
        doc.setTextColor(50);
    };
    doc.autoTable(columns, data, {renderCell: cell, renderHeaderCell: header});

    doc.setDrawColor(200);

    // Row- and colspan
    var renderCell = function (x, y, width, height, key, value, row, settings) {
        // Colspan
        if (row === 0) {
            if (key == 'id') {
                doc.rect(x, y, doc.internal.pageSize.width - settings.margins.horizontal * 2, height, 'S');
                y += settings.lineHeight / 2 + doc.internal.getLineHeight() / 2 - 2.5;
                doc.text("A rowspan that works as a sub header", x + settings.padding, y);
            }
        }
        // Rowspan
        else if (key === 'id') {
            if (row === 1 || row === 4 || row === 7) {
                doc.rect(x, y, width, height * 3, 'S');
                y += settings.lineHeight * 3 / 2 + doc.internal.getLineHeight() / 2 - 2.5;
                var w = doc.getStringUnitWidth('' + value) * doc.internal.getFontSize();
                doc.text('' + value, x + width / 2 - w / 2, y);
            }
        }
        // Others
        else {
            doc.rect(x, y, width, height, 'S');
            y += settings.lineHeight / 2 + doc.internal.getLineHeight() / 2 - 2.5;
            doc.text('' + value, x + settings.padding, y);
        }
    };
    doc.autoTable(columns, data, {startY: 300, renderCell: renderCell});
    publish(doc.output('datauristring'));
}

function publish(uri) {
    document.getElementById("output").src = uri;
}
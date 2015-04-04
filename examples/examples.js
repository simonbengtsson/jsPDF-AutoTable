function auto() {
    var doc = new jsPDF('p', 'pt');
    doc.autoTable(columns, data);
    document.getElementById("output").src = doc.output('datauristring');
}

function minimal() {
    var doc = new jsPDF('p', 'pt');
    doc.autoTable(columns, data, {extendWidth: false, padding: 2, lineHeight: 12, fontSize: 8});
    document.getElementById("output").src = doc.output('datauristring');
}

function longData() {
    var doc = new jsPDF('l', 'pt');
    doc.autoTable(columnsLong, dataLong, {padding: 2});
    document.getElementById("output").src = doc.output('datauristring');
}

function content() {
    var doc = new jsPDF('p', 'pt');
    doc.setFontSize(20);
    doc.text('Title', 40, 48);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    var splitTitle = doc.splitTextToSize(longText, doc.internal.pageSize.width - 80);
    doc.text(splitTitle, 40, 65);
    doc.autoTable(columns, moreData, {startY: 200, margins: {horizontal: 40, top: 40, bottom: 40}});
    doc.text(splitTitle, 40, doc.autoTableEndPosY() + 40);
    document.getElementById("output").src = doc.output('datauristring');
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

    document.getElementById("output").src = doc.output('datauristring');
}

function html() {
    var doc = new jsPDF('p', 'pt');
    doc.text("Form HTML", 40, 50);
    var json = doc.autoTableHtmlToJson(document.getElementById("basic-table"));
    doc.autoTable(false, json, {startY: 60});
    document.getElementById("output").src = doc.output('datauristring');
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
    document.getElementById("output").src = doc.output('datauristring');
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
    var cell = function(x, y, width, height, key, value, row, settings) {
        // See path-painting operators in the PDF spec, examples are
        // 'S' for stroke, 'F' for fill, 'B' for both stroke and fill
        var style = 'S';

        if(key === 'id') {
            style = 'B';
            doc.setFillColor(240);
        }

        if(key === 'expenses') {
            if(parseInt(value.substring(1, value.length)) > 5) {
                doc.setTextColor(200, 0, 0);
            }
        }

        doc.setLineWidth(0.1);
        doc.setDrawColor(240);

        doc.rect(x, y, width, height, style);

        if(key === 'id') {
            x -= 2 * settings.padding;
            x += width / 2;
        }

        y += settings.lineHeight / 2 + doc.internal.getLineHeight() / 2 - 2.5;
        doc.text('' + value, x + settings.padding, y);
        doc.setTextColor(50);
    };
    doc.autoTable(columns, data, {renderCell: cell, renderHeaderCell: header});
    document.getElementById("output").src = doc.output('datauristring');
}
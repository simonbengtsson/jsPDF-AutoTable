var examples = {};

+function () {
    var columns = [
        {title: "ID", key: "id"},
        {title: "Name", key: "first_name"},
        {title: "Email", key: "email"},
        {title: "Country", key: "country"},
        {title: "Expenses", key: "expenses"}
    ];

    function getData(rowCount) {
        rowCount = rowCount || 4;
        var sentence = faker.lorem.words(9);
        var data = [];
        for (var j = 1; j <= rowCount; j++) {
            data.push({
                id: j,
                first_name: faker.name.findName(),
                email: faker.internet.email(),
                country: faker.internet.email(),
                expenses: '$5',
                text: shuffleSentence(sentence),
                text2: shuffleSentence(sentence)
            });
        }
        return data;
    }

    // Default - shows what a default table looks like
    examples.auto = function () {
        var doc = new jsPDF('p', 'pt');
        doc.autoTable(columns, getData());
        return doc;
    };

    // Minimal - shows how compact tables can be drawn
    examples.minimal = function () {
        var doc = new jsPDF('p', 'pt');
        doc.autoTable(columns, getData(), {extendWidth: false, padding: 2, lineHeight: 12, fontSize: 8});
        return doc;
    };

    // Long data - shows how the overflow features looks and can be used
    examples.long = function () {
        var columnsLong = columns.concat([
            {title: "Text (" + shuffleSentence() + ')', key: "text"},
            {title: "Text2", key: "text2"}
        ]);

        var doc = new jsPDF('l', 'pt');
        doc.text("All columns ellipsized", 10, 40);
        doc.autoTable(columnsLong, getData(), {margins: {right: 10, left: 10, top: 40, bottom: 40}, startY: 55});
        doc.text("Only text columns ellipsized", 10, doc.autoTableEndPosY() + 30);
        doc.autoTable(columnsLong, getData(), {
            margins: {horizontal: 10, top: 40, bottom: 40},
            startY: 200,
            overflowColumns: ['text', 'text2']
        });
        doc.text("Overflow linebreak", 10, doc.autoTableEndPosY() + 30);
        doc.autoTable(columnsLong, getData(3), {
            margins: {horizontal: 10, top: 40, bottom: 40},
            startY: 350,
            overflow: 'linebreak',
            overflowColumns: ['text', 'text2']
        });
        return doc;
    };

    // Content - shows how tables can be integrated with any other pdf content
    examples.content = function () {
        var doc = new jsPDF({unit: 'pt', lineHeight: 1.5, orientation: 'p'});
        doc.setFontSize(18);
        doc.text('A story about Miusov', 40, 60);
        doc.setFontSize(11);
        doc.setTextColor(100);
        var splitTitle = doc.splitTextToSize(shuffleSentence(faker.lorem.words(55)) + '.', doc.internal.pageSize.width - 80, {});
        doc.text(splitTitle, 40, 80);
        doc.autoTable(columns, getData(40), {startY: 150});
        doc.text(splitTitle, 40, doc.autoTableEndPosY() + 30);
        return doc;
    };

    // Multiple - shows how multiple tables can be drawn both horizontally and vertically
    examples.multiple = function () {
        var doc = new jsPDF('p', 'pt');
        doc.setFontSize(22);
        doc.text("Multiple tables", 40, 60);
        doc.setFontSize(12);
        doc.text("The tables avoid being split into multiple pages.", 40, 80);

        doc.autoTable(columns.slice(0, 4), getData(), {
            startY: 120,
            avoidPageSplit: true,
            margins: {left: 40, right: 305, top: 60, bottom: 40},
            fontSize: 8
        });

        doc.autoTable(columns.slice(0, 4), getData(), {
            startY: 120,
            avoidPageSplit: true,
            margins: {left: 305, right: 40, top: 60, bottom: 40},
            fontSize: 8
        });

        for (var j = 0; j < 4; j++) {
            doc.autoTable(columns, getData(10), {
                startY: doc.autoTableEndPosY() + 50,
                avoidPageSplit: true,
                margins: {horizontal: 40, top: 60, bottom: 40}
            });
        }

        return doc;
    };

    // From html - shows how tables can be be drawn from html tables
    examples.html = function () {
        var doc = new jsPDF('p', 'pt');
        doc.text("From HTML", 40, 50);
        // Be sure to set the second parameter (indexBased option) to true
        // It will be the default behavior in v2.0, but are now behind an option for compatibility
        var res = doc.autoTableHtmlToJson(document.getElementById("basic-table"), true);
        doc.autoTable(res.columns, res.data, {startY: 60});
        return doc;
    };

    // Header and footers - shows how header and footers can be drawn
    examples['header-footer'] = function () {
        var totalPagesExp = "{total_pages_count_string}";
        var doc = new jsPDF('p', 'pt');
        var header = function (doc, pageCount, options) {
            doc.setFontSize(20);
            doc.text("Report for X", options.margins.horizontal, 60);
            doc.setFontSize(options.fontSize);
        };
        var footer = function (doc, lastCellPos, pageCount, options) {
            var str = "Page " + pageCount;
            // Total page number plugin only available in jspdf v1.0+
            if (typeof doc.putTotalPages === 'function') {
                str = str + " of " + totalPagesExp;
            }
            doc.text(str, options.margins.horizontal, doc.internal.pageSize.height - 30);
        };
        var options = {renderHeader: header, renderFooter: footer, margins: {horizontal: 40, top: 80, bottom: 50}};
        doc.autoTable(columns, getData(40), options);
        // Total page number plugin only available in jspdf v1.0+
        if (typeof doc.putTotalPages === 'function') {
            doc.putTotalPages(totalPagesExp);
        }
        return doc;
    };

    // Custom style - shows how custom styles can be applied to tables (also row- and colspans)
    examples.custom = function () {
        var doc = new jsPDF('p', 'pt');
        var header = function (x, y, width, height, key, value, settings) {
            doc.setFillColor(26, 188, 156); // Turquoise
            doc.setTextColor(255, 255, 255);
            doc.setFontStyle('bold');
            doc.rect(x, y, width, height, 'F');
            y += settings.lineHeight / 2 + doc.autoTableTextHeight() / 2;
            doc.text(value, x + settings.padding, y);
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

            y += settings.lineHeight / 2 + doc.autoTableTextHeight() / 2 - 2.5;
            doc.text(value, x + settings.padding, y);
            doc.setTextColor(50);
        };
        doc.autoTable(columns, getData(), {renderCell: cell, renderHeaderCell: header});

        doc.setDrawColor(200);

        // Row- and colspan
        var renderCell = function (x, y, width, height, key, value, row, settings) {
            // Colspan
            if (row === 0) {
                if (key == 'id') {
                    doc.rect(x, y, doc.internal.pageSize.width - settings.margins.horizontal * 2, height, 'S');
                    y += settings.lineHeight / 2 + doc.autoTableTextHeight() / 2 - 2.5;
                    doc.text("A rowspan that works as a sub header", x + settings.padding, y);
                }
            }
            // Rowspan
            else if (key === 'id') {
                if (row === 1 || row === 4 || row === 7) {
                    doc.rect(x, y, width, height * 3, 'S');
                    y += settings.lineHeight * 3 / 2 + doc.autoTableTextHeight() / 2 - 2.5;
                    var w = doc.getStringUnitWidth('' + value) * doc.internal.getFontSize();
                    doc.text(value, x + width / 2 - w / 2, y);
                }
            }
            // Others
            else {
                doc.rect(x, y, width, height, 'S');
                y += settings.lineHeight / 2 + doc.autoTableTextHeight() / 2 - 2.5;
                doc.text(value, x + settings.padding, y);
            }
        };
        doc.autoTable(columns, getData(), {startY: 300, renderCell: renderCell});
        return doc;
    };

    function shuffleSentence(words) {
        words = words || faker.lorem.words(8);
        var str = faker.helpers.shuffle(words).join(' ').trim();
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}();
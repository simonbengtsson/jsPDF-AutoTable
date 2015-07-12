var examples = {};

+function () {
    var getColumns = function() {
        return [
            {title: "ID", key: "id"},
            {title: "Name", key: "first_name"},
            {title: "Email", key: "email"},
            {title: "City", key: "city"},
            {title: "Country", key: "country"},
            {title: "Expenses", key: "expenses"}
        ];
    };

    function getData(rowCount) {
        rowCount = rowCount || 4;
        var sentence = faker.lorem.words(12);
        var data = [];
        for (var j = 1; j <= rowCount; j++) {
            data.push({
                id: j,
                first_name: faker.name.findName(),
                email: faker.internet.email(),
                country: faker.address.country(),
                city: faker.address.city(),
                expenses: '$' + faker.finance.amount(),
                text: shuffleSentence(sentence),
                text2: shuffleSentence(sentence)
            });
        }
        return data;
    }

    // Default - shows what a default table looks like
    examples.auto = function () {
        var doc = new jsPDF('p', 'pt');
        doc.autoTable(getColumns(), getData());
        return doc;
    };

    // Minimal - shows how compact tables can be drawn
    examples.minimal = function () {
        var doc = new jsPDF('p', 'pt');
        doc.autoTable(getColumns(), getData(), {tableWidth: 'wrap', styles: {padding: 2, rowHeight: 12, fontSize: 8}, headerStyles: {rowHeight: 15, fontSize: 8, padding: 2}});
        return doc;
    };

    // Long data - shows how the overflow features looks and can be used
    examples.long = function () {
        var columnsLong = getColumns().concat([
            {title: shuffleSentence(), key: "text"},
            {title: "More text", key: "text2"}
        ]);

        var doc = new jsPDF('l', 'pt');
        doc.text("Overflow 'ellipsize' (default)", 10, 40);
        doc.autoTable(columnsLong, getData(), {margins: {right: 10, left: 10, top: 40, bottom: 40}, startY: 55});
        doc.text("Overflow 'hidden'", 10, doc.autoTableEndPosY() + 30);
        doc.autoTable(columnsLong, getData(), {
            margins: {left: 10, right: 10, top: 40, bottom: 40},
            startY: 200,
            styles: {overflow: 'hidden'}
        });
        doc.text("Overflow 'linebreak'", 10, doc.autoTableEndPosY() + 30);
        doc.autoTable(columnsLong, getData(3), {
            margins: {left: 10, right: 10, top: 40, bottom: 40},
            startY: 350,
            styles: { overflow: 'linebreak' }
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
        var options = {
            startY: 150,
            createdCell: function(cell, data) {
                if (data.column.id === 'expenses') {
                    cell.styles.halign = 'right';
                    if(parseInt(cell.text[0].replace('$', '')) > 600) {
                        cell.styles.textColor = [255, 100, 100];
                    }
                }
                if (data.column.id === 'country') {
                    cell.styles.halign = 'center';
                }
            }
        };
        var cols = getColumns();
        cols.splice(0, 2);
        doc.autoTable(cols, getData(40), options);
        doc.text(splitTitle, 40, doc.autoTableEndPosY() + 30);
        return doc;
    };

    // Multiple - shows how multiple tables can be drawn both horizontally and vertically
    examples.multiple = function () {
        var doc = new jsPDF('p', 'pt');
        doc.setFontSize(22);
        doc.text("Multiple tables", 40, 60);
        doc.setFontSize(12);

        doc.autoTable(getColumns().slice(0, 3), getData(), {
            startY: 90,
            pageBreak: 'avoid',
            margins: {left: 40, right: 305, top: 60, bottom: 40}
        });

        doc.autoTable(getColumns().slice(0, 3), getData(), {
            startY: 90,
            pageBreak: 'avoid',
            margins: {left: 305, right: 40, top: 60, bottom: 40}
        });

        for (var j = 0; j < 6; j++) {
            doc.autoTable(getColumns(), getData(9), {
                startY: doc.autoTableEndPosY() + 30,
                pageBreak: 'avoid',
                margins: {left: 40, right: 40, top: 60, bottom: 40}
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
        var res = doc.autoTableHtmlToJson(document.getElementById("basic-table"));
        doc.autoTable(res.columns, res.data, {startY: 60});
        return doc;
    };

    // Header and footers - shows how header and footers can be drawn
    examples['header-footer'] = function () {
        var totalPagesExp = "{total_pages_count_string}";
        var doc = new jsPDF('p', 'pt');
        var header = function (doc, pageCount, settings) {
            doc.setFontSize(20);
            doc.setTextColor(40);
            doc.setFontStyle('normal');
            doc.text("Report for X", settings.margins.left, 60);
            doc.setFontSize(settings.fontSize);
        };
        var footer = function (doc, lastCellPos, pageCount, options) {
            var str = "Page " + pageCount;
            // Total page number plugin only available in jspdf v1.0+
            if (typeof doc.putTotalPages === 'function') {
                str = str + " of " + totalPagesExp;
            }
            doc.text(str, options.margins.left, doc.internal.pageSize.height - 30);
        };
        var options = {renderHeader: header, renderFooter: footer, margins: {left: 40, right: 40, top: 80, bottom: 50}};
        doc.autoTable(getColumns(), getData(40), options);
        // Total page number plugin only available in jspdf v1.0+
        if (typeof doc.putTotalPages === 'function') {
            doc.putTotalPages(totalPagesExp);
        }
        return doc;
    };

    // Custom style - shows how custom styles can be applied to tables (also row- and colspans)
    examples.custom = function () {
        var doc = new jsPDF('p', 'pt');
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFontStyle('bold');
        doc.text('Theme "striped"', 40, 50);
        doc.autoTable(getColumns(), getData(), {margins: {top: 60, bottom: 40, right: 40, left: 40}});
        doc.text('Theme "grid"', 40, doc.autoTableEndPosY() + 30);
        doc.autoTable(getColumns(), getData(), {margins: {top: 205, bottom: 40, right: 40, left: 40}, theme: 'grid'});
        doc.text('Theme "plain"', 40, doc.autoTableEndPosY() + 30);
        doc.autoTable(getColumns(), getData(), {margins: {top: 345, bottom: 40, right: 40, left: 40}, theme: 'plain'});
        doc.text('Table with custom styles', 40, doc.autoTableEndPosY() + 30);
        doc.autoTable(getColumns(), getData(), {
            margins: {top: 485, bottom: 40, right: 40, left: 40},
            headerStyles: {fillColor: [231, 76, 60]}
        });
        return doc;
    };

    function shuffleSentence(words) {
        words = words || faker.lorem.words(8);
        var str = faker.helpers.shuffle(words).join(' ').trim();
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}();
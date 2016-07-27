define(['jspdf', 'jspdf-autotable'], function(jsPDF) {
    return {
        generatePdf: function() {
            var columns = ["ID", "Country", "Rank", "Capital"];
            var data = [
                [1, "Denmark", 7.526, "Copenhagen"],
                [2, "Switzerland", 	7.509, "Bern"],
                [3, "Iceland", 7.501, "Reykjavík"],
                [4, "Norway", 7.498, "Oslo"],
                [5, "Finland", 7.413, "Helsinki"]
            ];

            var doc = new jsPDF('p', 'pt');
            doc.autoTable(columns, data);
            doc.save("table.pdf");
        }
    }
});
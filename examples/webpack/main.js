var jsPDF = require('jspdf');
require('jspdf-autotable');

document.getElementById("pdf-button").onclick = function() {
    generatePdf();
};

function generatePdf() {
    var columns = ["ID", "Country", "Rank", "Capital"];
    var data = [
        [1, "Denmark", 7.526, "Copenhagen"],
        [2, "Switzerland", 	7.509, "Bern"],
        [3, "Iceland", 7.501, "Reykjavík"],
        [4, "Norway", 7.498, "Oslo"],
        [5, "Finland", 7.413, "Helsinki"]
    ];

    var doc = new jsPDF();
    doc.autoTable(columns, data);
    doc.output("dataurlnewwindow");
}
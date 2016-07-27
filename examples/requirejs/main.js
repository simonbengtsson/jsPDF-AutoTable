define(['jspdf', 'jspdf-autotable'], function(jsPDF, autotable) {
    return {
        generatePdf: function() {
            var columns = ["ID", "Name", "Age", "City"];
            var data = [
                [1, "Jonatan", 25, "Gothenburg"],
                [2, "Simon", 23, "Gothenburg"],
                [3, "Hanna", 21, "Stockholm"]
            ];

            var doc = new jsPDF('p', 'pt');
            doc.autoTable(columns, data);
            doc.save("table.pdf");
        }
    }
});
---

name: Bug report
about: Create a report to help us improve
title: ''
labels: ''
assignees: ''
---If you have a question of how to use this plugin, please post on StackOverflow with the tags jspdf and jspdf-autotable.

If you have found a bug, try to describe it in a way that makes it possible to reproduce. Code is always helpful, and live code even more so. Here is a [codepen](http://codepen.io/someatoms/pen/EjwPEb) with `jspdf` and `jspdf-autotable` included that you can fork. When writing your codepen or posting code here, try to modify the below basic example until you see the issue. That way it gets is easier to troubleshoot.

    let doc = new jsPDF()
    doc.autoTable({
        body: [
            ['1', 'Donna', 'dmoore0@furl.net', 'China', '211.56.242.221'],
            ['2', 'Janice', 'jhenry1@theatlantic.com', 'Ukraine', '38.36.7.199'],
            ['3', 'Ruth', 'rwells2@constantcontact.com', 'Trinidad and Tobago', '19.162.133.184'],
            ['4', 'Jason', 'jray3@psu.edu', 'Brazil', '10.68.11.42'],
        ],
    });
    doc.save('table.pdf')

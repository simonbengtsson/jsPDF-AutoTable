# Design Decisions

## Two initialize formats (array and object)

Object initialize is to be preferred for everything but trivial tables. 
It makes it easier to reference a specific column in the options and
also connects headers with its data which prevents wrong headers to be
shown for wrong data.

You can also initialize the table from only an object with headers as 
keys. This can be done something like this doc.autoTable(Object.keys(data), data); 
Object.keys() is not supported in IE however so you might want to include a polyfill
if you want to use it.
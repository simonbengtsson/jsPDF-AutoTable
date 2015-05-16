Package.describe({
  name: 'jspdf:autotable',
  summary: 'Official PDF table generator in javascript (jspdf plugin)',
  version: '1.2.3',
  git: 'https://github.com/MeteorPackaging/jsPDF-AutoTable.git'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.1');
  api.addFiles([
    'meteor-pre.js',
    'upstream/jspdf.plugin.autotable.js',
    'meteor-post.js',
  ], 'client');
  api.export('jsPDF');
});

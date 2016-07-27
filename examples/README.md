## Examples for jspdf-autotable

### Default examples
Open `index.html` in your browser to familiar yourself with the examples or go to the hosted [examples page](https://simonbengtsson.github.io/jsPDF-AutoTable/). Then you can check the source code of all examples in `examples.js`.

Check `simple.html` for the most basic usage example of the plugin.

### Module bundlers (browserify, webpack and requirejs)
There are three module bundler examples. If you open each example's `index.html` it should work out of the box. You can inspect the code used for bundling each, but it is very simple.

### Important module bundler note
Use `jspdf.plugin.autotable.umd.js` with module bundlers. The other dist files do not  include requirejs support as a bundled version of requirejs in versions <= 1.2.61 complicates matters.
    
Also note that jspdf 1.2.61 does not work well with module bundlers. You have get the latest files from the jspdf repository or use `examples/libs/jspdf.min.js` in this repo. The examples depend `github:mrrio/jsPDF#76edb3387cda3d5292e212765134b06150030364` instead of a specific version for this reason.
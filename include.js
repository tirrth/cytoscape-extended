const scripts = [
  "./cytoscape.min.js",
  "./cy-dark-style.js",
  "./cy-light-style.js",
  "./cytoscape-node-html-label.min.js",
  "./graph-dummy-data.js",
  "./cy-extended.js",
  "./global-variables.js",
];

scripts.map((path) =>
  document.write(`<script type='text/javascript' src=${path}>"</"script>`)
);

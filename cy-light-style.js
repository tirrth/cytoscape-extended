const CY_LIGHT_STYLE = {
  node: {
    height: "data(height)",
    width: "data(weight)",
    shape: "data(faveShape)",
    color: (e) => change_color(e.data("faveTextColor"), 0),
    padding: "8px",
    "background-color": (e) => {
      if (e.data("id") === "@@startnode") return "#ffffff";
      if (e.data("id") === "@@endnode") return "#f58b00";
      return change_color(e.data("faveColor"), -0.1);
    },
    "border-style": "solid",
    "border-color": (e) => {
      if (e.data("id") === "@@startnode") return "#f58b00";
      if (e.data("id") === "@@endnode") return "#f58b00";
      return change_color(e.data("faveColor"), 0.3);
    },
    "border-width": (e) => {
      const node_id = e.data("id");
      if (node_id === "@@startnode" || node_id === "@@endnode") return "5px";
      return "1px";
    },
  },
  edge: {
    color: "#939393",
    "control-point-step-size": 60,
    "edge-text-rotation": 0,
    "font-size": 18,
    label: "data(label)",
    "loop-direction": -41,
    "loop-sweep": 181,
    "text-background-color": "#000",
    "text-background-opacity": 0,
    "text-background-padding": 5,
    "text-background-shape": "roundrectangle",
    "curve-style": "data(edgeStyle)",
    "text-margin-y": -10,
    "text-wrap": "wrap",
    opacity: 0,
    width: "mapData(strength, 0, 100, 2, 8)",
    "target-arrow-shape": "triangle",
    "line-color": "#939393",
    "source-arrow-color": "#939393",
    "target-arrow-color": "#939393",
    "edge-distances": "intersection",
    "text-outline-color": "#939393",
    "text-outline-width": 0,
    "control-point-distances": (e) => e.data("point-distances") || 40,
    "control-point-weights": (e) => e.data("point-weights") || 0.5,
  },

  // on scrollzoom
  "node.scrollzoom": { "border-width": "2px" },
  "edge.scrollzoom": {
    width: (e) => {
      if (!e.data("initialWidth")) e.data().initialWidth = e.style("width");
      const edge_width = parseFloat(e.data("initialWidth").replace("px", ""));
      return `${edge_width + edge_width / 1.5}px`;
    },
  },
  "edge.small-scrollzoom": { opacity: 0.3 },
  "edge.medium-scrollzoom": { opacity: 0.5 },
  "edge.large-scrollzoom": { opacity: 1 },

  // questionable - from server side
  "node.questionable": {},
  "edge.questionable": {
    "line-style": "dashed",
    "target-arrow-shape": "triangle",
  },

  // on mouseover
  ".mouseover": { "background-color": "#a0a0a0" },

  // on hightlight
  "node.highlight": { "border-width": "5px", "border-color": "#000" },
  "edge.highlight": {
    "source-arrow-color": "#000",
    "target-arrow-color": "#000",
    "line-color": "#000",
    width: "6px",
    opacity: 1,
  },

  // on click
  "node.click": { "border-width": "5px", "border-color": "#000" },
  "edge.click": {
    "source-arrow-color": "#000",
    "target-arrow-color": "#000",
    "line-color": "#000",
    width: "6px",
    opacity: 1,
  },

  // hide edge label
  "edge.hide-label": { "text-opacity": 0 },
};

const CY_DARK_STYLE = {
  node: {
    height: "data(height)",
    width: "data(weight)",
    shape: "data(faveShape)",
    color: (e) => change_color(e.data("faveTextColor"), -0.4),
    padding: "8px",
    "background-color": (e) => {
      if (e.data("id") === "@@startnode") return "#000";
      if (e.data("id") === "@@endnode") return "#f58b00";
      return change_color(e.data("faveColor"), -0.4);
    },
    "border-style": "solid",
    "border-color": (e) => {
      if (e.data("id") === "@@startnode") return "#f58b00";
      if (e.data("id") === "@@endnode") return "#f58b00";
      return "#000000";
    },
    "border-width": (e) => {
      const node_id = e.data("id");
      if (node_id === "@@startnode" || node_id === "@@endnode") return "5px";
      return "0px";
    },
  },
  edge: {
    color: "#ACACAC",
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
    opacity: 1,
    width: "mapData(strength, 0, 100, 2, 8)",
    "target-arrow-shape": "triangle",
    "line-color": "#ACACAC",
    "source-arrow-color": "#ACACAC",
    "target-arrow-color": "#ACACAC",
    "edge-distances": "intersection",
    "text-outline-color": "#ACACAC",
    "text-outline-width": 0,
    "control-point-distances": (e) => e.data("point-distances") || 40,
    "control-point-weights": (e) => e.data("point-weights") || 0.5,
  },

  // on scrollzoom
  "node.scrollzoom": { "border-width": "2px" },
  "edge.scrollzoom": {},

  // questionable - from server side
  "node.questionable": {},
  "edge.questionable": {
    "line-style": "dashed",
    "target-arrow-shape": "triangle",
  },

  // on mouseover
  ".mouseover": { "background-color": "#a0a0a0" },

  // on highlight
  "node.highlight": {
    "background-color": "data(highlightedColor)",
    "line-color": "data(highlightedColor)",
    "target-arrow-color": "data(highlightedColor)",
    "transition-property": "background-color, line-color, target-arrow-color",
    "transition-duration": "0.5s",
  },
  "edge.highlight": {},

  // on click
  "node.click": {
    "border-width": 5,
    "border-color": "#fff",
  },
  "edge.click": {
    "source-arrow-color": "#C3E2FF",
    "target-arrow-color": "#C3E2FF",
    "background-color": "#C3E2FF",
    "line-color": "#C3E2FF",
  },

  // hide edge label
  "edge.hide-label": { "text-opacity": 0 },
};

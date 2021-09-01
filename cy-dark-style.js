const CY_DARK_STYLE = {
  node: {
    shape: "data(faveShape)",
    width: "data(weight)",
    // 'content': function (element) {
    //     // if (element.data("id") === '@@startnode') return '▶';
    //     // if (element.data("id") === '@@endnode') return '■';
    //     // if (element.data("name")) {
    //     //     let name = element.data('name')
    //     //     if (element.data("xlabel")) {
    //     //         if (element.data("isNameHidden") && element.data("isLabelHidden")) return ''
    //     //         if (element.data("isNameHidden")) return (element.data("xlabel"))
    //     //         if (element.data("isLabelHidden")) return (name)
    //     //         return `${name}\n\n${element.data("xlabel")}`
    //     //     }
    //     //     return `${name}`
    //     // }
    //     return ``
    // },
    "text-valign": "center",
    // 'text-outline-width': 1,
    // 'text-outline-color': (e) => change_color(e.data('faveColor'), -0.4),
    "background-color": (e) => change_color(e.data("faveColor"), -0.4),
    // 'border-color': '#ffffff',
    // 'border-width': '1px',
    // 'border-style': 'solid',
    color: (e) => change_color(e.data("faveTextColor"), -0.4),
    "font-size": "data(font)",
    height: "data(height)",
    padding: "5px",
    "text-border-width": 0,
    "text-wrap": "wrap",
    padding: "5px",
  },
  ":selected": {
    "border-width": 3,
    "border-color": "#333",
  },
  edge: {
    // 'color': (e) => change_color(e.data('faveColor'), -0.4),
    color: "#ACACAC",
    "control-point-step-size": 60,
    "edge-text-rotation": 0,
    "font-size": 18,
    label: (e) => e.data("label"),
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
    // 'source-arrow-color': (e) => change_color(e.data('faveColor'), -0.4),
    // 'target-arrow-color': (e) => change_color(e.data('faveColor'), -0.4),
    "source-arrow-color": "#ACACAC",
    "target-arrow-color": "#ACACAC",
    "edge-distances": "intersection",
    "text-outline-color": "#ACACAC",
    "text-outline-width": 0,
    "control-point-distances": function (ele) {
      if (ele.data("point-distances")) {
        return ele.data("point-distances");
      }
      return 40;
    },
    "control-point-weights": function (ele) {
      if (ele.data("point-weights")) {
        return ele.data("point-weights");
      }
      return 0.5;
    },
  },
  "edge.questionable": {
    "line-style": "dashed",
    "target-arrow-shape": "triangle",
  },
  ".mouseOverColor": {
    "background-color": "#a0a0a0",
  },
  ".faded": {
    opacity: 0.25,
    "text-opacity": 0,
  },
  "node.highlight": {
    "background-color": "data(highlightedColor)",
    "transition-property": "background-color",
    "transition-duration": "0.5s",
  },
  "edge.highlight": {
    "line-color": "data(highlightedColor)",
    "target-arrow-color": "data(highlightedColor)",
    "transition-property": "line-color, target-arrow-color",
    "transition-duration": "0.5s",
  },
  "node.click": {
    "background-color": "#C3E2FF",
  },
  "edge.click": {
    "source-arrow-color": "#C3E2FF",
    "target-arrow-color": "#C3E2FF",
    "background-color": "#C3E2FF",
    "line-color": "#C3E2FF",
  },
  "edge.hide-label": {
    "text-opacity": 0,
  },
};

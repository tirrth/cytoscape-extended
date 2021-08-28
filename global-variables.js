let CY, PREV_DATA, ANIMATION_PROPERTIES, DEF_ZOOM_COORDINATES;
let CLEAR_SCROLL_TIMER, CLEAR_RESIZE_TIMER;
const DARK_MODE_SCHEME = "(prefers-color-scheme: dark)";
const SMALL_NODE_TAG = "small";
const MEDIUM_NODE_TAG = "medium";
const LARGE_NODE_TAG = "large";
const IS_GRAPH_LOADING = new Variable(false);

const NODE_GLOBAL_STYLE = {
  wrapper: {
    height: (d) => `${d.height}px`,
    "text-align": "center",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    "flex-direction": "column",
    "justify-content": "center",
    "align-items": "center",
    padding: "auto",
    width: (d) => `${d.weight}px`,
    color: (d) => d.faveTextColor,
    "pointer-events": "none",
  },
  name: {
    "font-size": (d) => d.font,
    "letter-spacing": "2px",
    "font-weight": "lighter",
    margin: 0,
    "-webkit-text-stroke": (d) => `1px ${d.faveTextColor}`,
    "white-space": "unset",
    "word-break": "break-all",
  },
  label: {
    padding: 0,
    margin: 0,
    "letter-spacing": "2px",
    "font-weight": "lighter",
    "font-size": (d) => d.font,
    "-webkit-text-stroke": (d) => `1px ${d.faveTextColor}`,
    "margin-top": "5px",
  },
};

let ZOOM_SETTINGS = {};
const ZOOM_CONFIG = [
  {
    global: true, // flag to indicate the global style that applies to every graph regardless of length of nodes
    condition_exp: (length) => length > 0,
    custom_zoom_levels: [
      {
        condition_exp: ({ eq, lt }) => eq(0) || lt(0),
        edge_style: {
          exec: () => CY.edges().addClass("hide-label"),
          connected_nodes: {
            small: { opacity: 0.3 },
            medium: { opacity: 0.5 },
            large: { opacity: 1 },
          },
        },
      },
      {
        condition_exp: ({ gt }) => gt(0),
        edge_style: {
          exec: () => CY.edges().removeClass("hide-label"),
          all: { opacity: 0.5 },
        },
      },
    ],
  },
  {
    condition_exp: (length) => length <= 10, // for graphs having less than or equal to 10 nodes
    max_zoom_pct: 50,
    min_zoom_pct: 30,
  },
  {
    condition_exp: (len) => len > 10 && len <= 20, // for graphs having more than 10 and less than 20 nodes
    max_zoom_pct: 230,
    min_zoom_pct: 30,
    custom_zoom_levels: [
      {
        condition_exp: ({ gt, eq }) => eq(0) || gt(0),
        node_style: {
          large: { wrapper: { opacity: 1 } },
          medium: { wrapper: { opacity: 0.5 } },
          small: { wrapper: { opacity: 0.4 } },
        },
      },
      {
        condition_exp: ({ gt }) => gt(30),
        node_style: { medium: { wrapper: { opacity: 1 } } },
      },
      {
        condition_exp: ({ gt }) => gt(60),
        node_style: { small: { wrapper: { opacity: 1 } } },
      },
    ],
  },
  {
    condition_exp: (length) => length > 20 && length < 35, // for graphs having more than 20 nodes
    max_zoom_pct: 250,
    min_zoom_pct: 20,
    custom_zoom_levels: [
      // initial style
      {
        condition_exp: ({ eq }) => eq(0),
        edge_style: {
          exec: () => {
            CY.edges().map((e) => {
              const edge_width = parseFloat(e.style("width").replace("px", ""));
              e.style({ width: `${edge_width + edge_width / 2}px` });
            });
          },
        },
      },
      {
        condition_exp: ({ eq, lt }) => eq(0) || lt(0),
        node_style: {
          small: { wrapper: { opacity: 0 } },
          medium: { wrapper: { opacity: 0 } },
          large: { wrapper: { opacity: 0 } },
        },
        edge_style: { exec: () => CY.nodes().style({ "border-width": "2px" }) },
      },
      {
        condition_exp: ({ gt }) => gt(0),
        edge_style: { exec: () => CY.nodes().style({ "border-width": "1px" }) },
      },
      // large nodes' style
      {
        condition_exp: ({ gt }) => gt(5),
        node_style: { large: { wrapper: { opacity: 0.5 } } },
      },
      {
        condition_exp: ({ gt }) => !gt(5),
        node_style: { large: { wrapper: { opacity: 0 } } },
      },
      {
        condition_exp: ({ gt }) => gt(10),
        node_style: {
          large: {
            wrapper: { opacity: 1 },
            name: { "font-size": (d) => d.font },
            label: { display: "none" },
          },
        },
      },
      {
        condition_exp: ({ gt }) => gt(15) || !gt(10),
        node_style: { large: { label: { display: "block" } } },
      },
      // medium nodes' style
      {
        condition_exp: ({ gt }) => gt(20),
        node_style: { medium: { wrapper: { opacity: 0.4 } } },
      },
      {
        condition_exp: ({ gt }) => !gt(20),
        node_style: { medium: { wrapper: { opacity: 0 } } },
      },
      {
        condition_exp: ({ gt }) => gt(30),
        node_style: {
          medium: {
            wrapper: { opacity: 1 },
            name: { "font-size": "16px" },
            label: { display: "none" },
          },
        },
      },
      {
        condition_exp: ({ gt }) => gt(60) || !gt(30),
        node_style: {
          medium: {
            name: { "font-size": (d) => d.font },
            label: { display: "block" },
          },
        },
      },
      // small nodes' style
      {
        condition_exp: ({ gt }) => gt(40),
        node_style: { small: { wrapper: { opacity: 0.3 } } },
      },
      {
        condition_exp: ({ gt }) => !gt(40),
        node_style: { small: { wrapper: { opacity: 0 } } },
      },
      {
        condition_exp: ({ gt }) => gt(50),
        node_style: {
          small: {
            wrapper: { opacity: 1 },
            name: { "font-size": "12px" },
            label: { display: "none" },
          },
        },
      },
      {
        condition_exp: ({ gt }) => gt(100) || !gt(50),
        node_style: {
          small: {
            name: { "font-size": (d) => d.font },
            label: { display: "block" },
          },
        },
      },
    ],
  },
  {
    condition_exp: (length) => length >= 35, // for graphs having more than 20 nodes
    max_zoom_pct: 500,
    min_zoom_pct: 20,
    custom_zoom_levels: [
      // initial style
      {
        condition_exp: ({ eq }) => eq(0),
        edge_style: {
          exec: () => {
            CY.edges().map((e) => {
              const edge_width = parseFloat(e.style("width").replace("px", ""));
              e.style({ width: `${edge_width + edge_width / 1.5}px` });
            });
          },
        },
      },
      {
        condition_exp: ({ eq, lt }) => eq(0) || lt(0),
        node_style: {
          small: { wrapper: { opacity: 0 } },
          medium: { wrapper: { opacity: 0 } },
          large: { wrapper: { opacity: 0 } },
        },
        edge_style: { exec: () => CY.nodes().style({ "border-width": "2px" }) },
      },
      {
        condition_exp: ({ gt }) => gt(0),
        edge_style: { exec: () => CY.nodes().style({ "border-width": "1px" }) },
      },
      // large nodes' style
      {
        condition_exp: ({ gt }) => gt(15),
        node_style: { large: { wrapper: { opacity: 0.5 } } },
      },
      {
        condition_exp: ({ gt }) => !gt(15),
        node_style: { large: { wrapper: { opacity: 0 } } },
      },
      {
        condition_exp: ({ gt }) => gt(25),
        node_style: {
          large: {
            wrapper: { opacity: 1 },
            name: { "font-size": (d) => d.font },
            label: { display: "none" },
          },
        },
      },
      {
        condition_exp: ({ gt }) => gt(30) || !gt(25),
        node_style: { large: { label: { display: "block" } } },
      },
      // medium nodes' style
      {
        condition_exp: ({ gt }) => gt(35),
        node_style: { medium: { wrapper: { opacity: 0.4 } } },
      },
      {
        condition_exp: ({ gt }) => !gt(35),
        node_style: { medium: { wrapper: { opacity: 0 } } },
      },
      {
        condition_exp: ({ gt }) => gt(45),
        node_style: {
          medium: {
            wrapper: { opacity: 1 },
            name: { "font-size": "16px" },
            label: { display: "none" },
          },
        },
      },
      {
        condition_exp: ({ gt }) => gt(70) || !gt(45),
        node_style: {
          medium: {
            name: { "font-size": (d) => d.font },
            label: { display: "block" },
          },
        },
      },
      // small nodes' style
      {
        condition_exp: ({ gt }) => gt(80),
        node_style: { small: { wrapper: { opacity: 0.3 } } },
      },
      {
        condition_exp: ({ gt }) => !gt(80),
        node_style: { small: { wrapper: { opacity: 0 } } },
      },
      {
        condition_exp: ({ gt }) => gt(90),
        node_style: {
          small: {
            wrapper: { opacity: 1 },
            name: { "font-size": "12px" },
            label: { display: "none" },
          },
        },
      },
      {
        condition_exp: ({ gt }) => gt(140) || !gt(90),
        node_style: {
          small: {
            name: { "font-size": (d) => d.font },
            label: { display: "block" },
          },
        },
      },
    ],
  },
];

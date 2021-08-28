document.addEventListener("DOMContentLoaded", initialize);

class Variable {
  constructor(initVal) {
    this.val = initVal; // Value to be stored in this object
  }

  listenForValue = (val, fn) => {
    this.valueToListenFor = val;
    this.onChange = fn;
  };

  listen = () => (this.shouldListen = true);

  unregister = () => (this.shouldListen = false);

  getValue = () => this.val;

  // This method changes the value and calls the given handler
  setValue = function (value) {
    this.val = value;
    if (this.shouldListen && this.valueToListenFor === value) this.onChange?.();
  };
}

function initialize() {
  ANIMATION_PROPERTIES = { duration: 60, easing: "ease-in-sine" };
  CY = cytoscape({
    container: document.querySelector("#cy"),
    layout: {
      randomize: false,
      name: "preset",
      rankDir: "LR",
    },
    maxZoom: 4,
    minZoom: 0.1,
    panningEnabled: true,
    userPanningEnabled: true,
    userZoomingEnabled: true,
    wheelSensitivity: 0.1,
    zoom: 1,
    zoomingEnabled: true,
  }).nodeHtmlLabel([{ query: "node", tpl: _nodeMarkup }]);

  _updateCyStyle();
  window.matchMedia(DARK_MODE_SCHEME).addEventListener("change", (e) => {
    _updateCyStyle(e.matches ? cyDarkStyle : cyLightStyle);
  });

  _applyCustomizedEvents();
  _cytoscapeListeners();

  loadGraph(get_random_data(true));

  document.zoomOut = _zoomOut;
  document.zoomIn = _zoomIn;
  document.resizeGraph = _resizeGraph;
  document.highlightPath = highlightPath;
  document.clearHighlightedPath = clearHighlightedPath;
  document.isZoomReachedMax = isZoomReachedMax;
  document.isZoomReachedMin = isZoomReachedMin;
  document.loadGraph = loadGraph;
  document.setBaseColor = (...args) => {
    IS_GRAPH_LOADING.listenForValue(false, () => set_base_color(...args));
  };
}

const styleJsonToString = (style = {}, data = {}) => {
  let str_style = "";
  Object.entries(style).map(([key, value]) => {
    if (typeof value !== "function") str_style += `${key}: ${value};`;
    else str_style += `${key}: ${value(data)};`;
  });
  return str_style;
};

const get_start_node_markup = () => {
  return `<div style="margin-left: 2px;">▶</div>`;
};
const get_end_node_markup = () => {
  return `<div style="margin-top: -4px; font-size: 20px;">■</div>`;
};
const get_name_markup = ({ name, name_css }) => {
  if (!name) return "";
  return `<p class="node-name" style='${name_css}'>${name}</p>`;
};
const get_label_markup = ({ label, label_css }) => {
  if (!label) return "";
  return `<p class="node-label" style='${label_css}'>${label}</p>`;
};

function _nodeMarkup(data) {
  if (data.id === "@@startnode") return get_start_node_markup();
  if (data.id === "@@endnode") return get_end_node_markup();
  const { node_size, id, name = "", xlabel: label = "" } = data;
  const { name: name_json, label: label_json } = NODE_GLOBAL_STYLE;
  const { wrapper: wrapper_json } = NODE_GLOBAL_STYLE;
  const wrapper_css = styleJsonToString(wrapper_json, data);
  const name_css = styleJsonToString(name_json, data);
  const label_css = styleJsonToString(label_json, data);
  const data_attr_json = btoa(JSON.stringify(data));
  return `
    <div class="node-wrapper ${node_size}-node" id="${id}" data-json='${data_attr_json}' style="${wrapper_css}">
      ${get_name_markup({ name, name_css })}
      ${get_label_markup({ label, label_css })}
    </div>
  `;
}

function _getCyStyle() {
  if (!window?.matchMedia?.(DARK_MODE_SCHEME).matches) return cyLightStyle;
  return cyDarkStyle;
}

function _updateCyStyle(style = _getCyStyle()) {
  style = Object.entries(style).map(([key, value]) => ({
    selector: key,
    style: value,
  }));
  CY.style().clear().fromJson(style).update();
}

function deepEqual(x, y) {
  const ok = Object.keys,
    tx = typeof x,
    ty = typeof y;
  return x && y && tx === "object" && tx === ty
    ? ok(x).length === ok(y).length &&
        ok(x).every((key) => deepEqual(x[key], y[key]))
    : x === y;
}

function _alterData(data = {}) {
  data.elements.nodes = data.elements.nodes.map((node) => {
    const { data } = node;
    if (data.id === "@@startnode" || data.id === "@@endnode") return node;
    const [r, g, b] = hexToRgb(data.faveColor);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luma < 150 && luma >= 135) {
      data.height = 40;
      data.weight = 130;
      data.font = "12px";
      data.node_size = MEDIUM_NODE_TAG;
    } else if (luma >= 150) {
      data.height = 30;
      data.weight = 120;
      data.font = "9px";
      data.node_size = SMALL_NODE_TAG;
    } else data.node_size = LARGE_NODE_TAG;
    return node;
  });
  return data;
}

function _setZoomConfig(config) {
  const { custom_zoom_levels: zoom_levels = [] } = ZOOM_SETTINGS;
  const { custom_zoom_levels: config_zoom_levels = [] } = config;
  const custom_zoom_levels = [...zoom_levels, ...config_zoom_levels];
  ZOOM_SETTINGS = { ...config, custom_zoom_levels };
}

function _setInitialStyle() {
  const eq = () => true;
  const lt = () => false;
  const gt = () => false;
  ZOOM_SETTINGS.custom_zoom_levels?.map((c = {}) => {
    if (!c.condition_exp({ eq, lt, gt })) return;
    _nodeStyleHandler(c.node_style);
    _edgeStyleHandler(c.edge_style);
  });
}

function _addElements(elements, options = { animate: true }) {
  CY.elements().remove();
  CY.add(elements);
  // _updateCyStyle();
  ZOOM_SETTINGS = {}; // reset zoom-config
  const nodes_len = CY.nodes().length;
  ZOOM_CONFIG.map((c) => c.condition_exp(nodes_len) && _setZoomConfig(c));
  setTimeout(_setInitialStyle, 0);
  if (options.animate) {
    CY.resize();
    CY.fit(20);
  }
  return true;
}

function _setDefZoomCoord() {
  CY.minZoom(1e-50), CY.maxZoom(1e50);
  const { h, w } = CY.elements().renderedBoundingBox();
  DEF_ZOOM_COORDINATES = { h, w };
}

function loadGraph(data) {
  return new Promise(function (resolve, _) {
    IS_GRAPH_LOADING.setValue(true);
    _alterData(data);
    const { elements: new_elements } = data;
    const { elements: prev_ele_data } = PREV_DATA || {};
    const _isDeepEqual = deepEqual(prev_ele_data, new_elements);
    if (_isDeepEqual || !new_elements) return resolve(false);
    PREV_DATA = { ...data };
    const { elements: prev_elements } = CY.json();
    const { nodes: new_nodes } = new_elements;
    const { nodes: previous_nodes } = prev_elements;
    const nearest_nodes = findNearestNodes(previous_nodes, new_nodes);
    const _hasTransitNodes = nearest_nodes.some((n) => n.prev_node_id);
    if (!_hasTransitNodes) {
      _addElements(data.elements);
      _setDefZoomCoord();
      return resolve(true);
    }
    ANIMATION_PROPERTIES.duration = 200;
    ANIMATION_PROPERTIES.style = { opacity: 0 };
    CY.edges().animate(ANIMATION_PROPERTIES);
    const transform_layout_options = {
      name: "preset",
      animate: true,
      fit: false,
      animationDuration: data.animationDuration || 800,
      animateFilter: (node) => {
        const _condition = (n) => n.prev_node_id === node.data().id;
        return nearest_nodes.some(_condition);
      },
      transform: (node) => {
        const _condition = (n) => n.prev_node_id === node.data().id;
        if (!nearest_nodes.some(_condition)) return node.remove();
        const nearest_node = nearest_nodes.find(_condition);
        node.json({ data: nearest_node?.data });
        return ({ x: toX, y: toY } = nearest_node?.position);
      },
      stop: () => {
        const layout_option = {
          name: "preset",
          animate: true,
          fit: true,
          stop: () => {
            _setDefZoomCoord();
            IS_GRAPH_LOADING.setValue(false);
            resolve(true);
          },
          // const layout_option = {
          //   name: "preset",
          //   animate: true,
          //   fit: true,
          //   stop: () => {

          //     // _onScrollZoom();

          //     // const { h, w } = CY.elements().renderedBoundingBox();
          //     // console.log(_isGraphSizeEqual(0, { h, w })),
          //     // setTimeout(
          //     // () => console.log(_isGraphSizeEqual(0, { h, w })),
          //     // 0
          //     // );
          //     resolve(true);
          //   },
          // };
          // CY.elements().layout(layout_option).run(); // To resize the graph, if it's not already resized properly from the previous layout animation
        };
        _addElements(data.elements, { animate: false });
        CY.elements().layout(layout_option).run();
      },
    };
    CY.elements().layout(transform_layout_options).run();
  });
}

function findNearestNodes(previous_nodes, new_nodes) {
  const ingnorable_ids = ["@@startnode", "@@endnode"];
  const allocated_prev_node_ids = [];
  new_nodes.map((new_node) => {
    let minX = Number.MAX_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let curr_node_id;
    previous_nodes?.map((prev_node) => {
      const { position: prev_position, data: prev_data } = prev_node;
      const { id: prev_id } = prev_data;
      if (allocated_prev_node_ids.includes(prev_id)) return;
      const { position: new_position, data: new_data } = new_node;
      const { id: new_id } = new_data;
      if ([new_id, prev_id].some((id) => ingnorable_ids.includes(id))) {
        if (new_id === prev_id) new_node.prev_node_id = prev_id;
        return;
      }
      const { x: prev_x, y: prev_y } = prev_position;
      const { x: new_x, y: new_y } = new_position;
      const x_diff = Math.abs(new_x - prev_x);
      const y_diff = Math.abs(new_y - prev_y);
      if (x_diff < minX && y_diff < minY) {
        minX = x_diff;
        minY = y_diff;
        curr_node_id = prev_node.data.id;
        new_node.prev_node_id = prev_node.data.id;
      }
    });
    curr_node_id && allocated_prev_node_ids.push(curr_node_id);
  });
  return new_nodes;
}

const _isGraphSizeLarger = (percentage, { h, w }) => {
  const { h: defHeight, w: defWidth } = DEF_ZOOM_COORDINATES;
  const defSize = defWidth > defHeight ? defWidth : defHeight;
  const currSize = w > h ? w : h;
  return currSize > defSize + (defSize * percentage) / 100;
};

const _isGraphSizeSmaller = (percentage, { h, w }) => {
  const { h: defHeight, w: defWidth } = DEF_ZOOM_COORDINATES;
  const defSize = defWidth > defHeight ? defWidth : defHeight;
  const currSize = w > h ? w : h;
  return currSize < defSize - (defSize * percentage) / 100;
};

const _isGraphSizeEqual = (percentage, { h, w }) => {
  const { h: defHeight, w: defWidth } = DEF_ZOOM_COORDINATES;
  const defSize = defWidth > defHeight ? defWidth : defHeight;
  const currSize = w > h ? w : h;
  return currSize == defSize + (defSize * percentage) / 100;
};

function isZoomReachedMax() {
  const { h, w } = CY.elements().renderedBoundingBox();
  return _isGraphSizeLarger(ZOOM_SETTINGS.max_zoom_pct, { h, w }); // when graph size reaches to (>=X%) of its default size
}

function isZoomReachedMin() {
  const { h, w } = CY.elements().renderedBoundingBox();
  return _isGraphSizeSmaller(ZOOM_SETTINGS.min_zoom_pct, { h, w }); // when graph size reaches to (<=Y%) of its default size
}

const _isSmallNode = (data) => data.node_size === SMALL_NODE_TAG;
const _isMediumNode = (data) => data.node_size === MEDIUM_NODE_TAG;
const _isLargeNode = (data) => data.node_size === LARGE_NODE_TAG;

function _updateNodeStyle(nodes, node_style, node_size) {
  if (!node_style?.[node_size]) return;
  for (let i = 0; i < nodes?.length; i++) {
    const data = JSON.parse(atob(nodes[i].getAttribute("data-json")));
    if (node_style?.[node_size]?.wrapper) {
      const style = styleJsonToString(node_style?.[node_size].wrapper, data);
      nodes[i].style.cssText += style;
    }
    if (node_style?.[node_size]?.name && nodes[i].children?.[0]) {
      const style = styleJsonToString(node_style?.[node_size].name, data);
      nodes[i].children[0].style.cssText += style;
    }
    if (node_style?.[node_size]?.label && nodes[i].children?.[1]) {
      const style = styleJsonToString(node_style?.[node_size].label, data);
      nodes[i].children[1].style.cssText += style;
    }
  }
}

function _nodeStyleHandler(node_style = {}) {
  if (!node_style) return;
  node_style.exec?.();
  // global style that applies to every graph regardless of the node-size
  const nodes = document.getElementsByClassName("node-wrapper");
  _updateNodeStyle(nodes, node_style, "all");
  [SMALL_NODE_TAG, MEDIUM_NODE_TAG, LARGE_NODE_TAG].map((tag) => {
    if (!node_style[tag]) return;
    const nodes = document.getElementsByClassName(`${tag}-node`);
    _updateNodeStyle(nodes, node_style, tag);
  });
}

function _edgeStyleHandler(edge_style = {}) {
  if (!edge_style) return;
  const { all = {}, connected_nodes = {}, exec } = edge_style;
  typeof exec === "function" && exec();
  CY.edges().style(all);
  Object.entries(connected_nodes).map(([key, value = {}]) => {
    const nodes = CY.nodes(key !== "all" && `[node_size = "${key}"]`);
    nodes.map((n) => n.connectedEdges().style(value));
  });
}

const _zoomHandler = (e = _getCustomScrollEvent()) => {
  const { h, w } = e.target.elements().renderedBoundingBox();
  const eq = (pct) => _isGraphSizeEqual(pct, { h, w });
  const gt = (pct) => _isGraphSizeLarger(pct, { h, w });
  const lt = (pct) => _isGraphSizeSmaller(pct, { h, w });
  ZOOM_SETTINGS?.custom_zoom_levels?.map((c) => {
    if (!c.condition_exp({ gt, lt, eq })) return;
    _nodeStyleHandler(c.node_style);
    _edgeStyleHandler(c.edge_style);
  });
};

function _getCustomScrollEvent() {
  return { target: { zoom: () => CY.zoom(), elements: () => CY.elements() } };
}

function _onScrollZoom(e = _getCustomScrollEvent()) {
  const isReachedMax = isZoomReachedMax();
  if (isReachedMax) CY.maxZoom(e.target.zoom());
  const isReachedMin = isZoomReachedMin();
  if (isReachedMin) CY.minZoom(e.target.zoom());
  if (isReachedMax || isReachedMin) return;
  _zoomHandler(e);
}

function _cytoscapeListeners() {
  const { canvas, node, edge } = cy;

  // canvas event-listeners
  canvas.on("click", (e) => {
    if (e.target !== cy) return;
    CY.elements().removeClass("highlighted");
    CY.elements().removeClass("highlight-element");
    CY.elements().removeClass("highlight-edge");
  });
  canvas.on("dblclick", (e) => {
    if (e.target !== cy) return;
    _zoomIn(e.originalEvent.x, e.originalEvent.y);
  });

  // node event-listeners
  node.on("click", nodeClickFn);
  node.on("dblclick", (e) => {
    loadGraph(get_random_data());
    const modal_data = e.target.attr();
    // window.webkit.messageHandlers.didDoubleClickNode.postMessage(modal_data);
  });

  // edge event-listeners
  edge.on("click", edgeClickFn);
  edge.on("dblclick", (e) => {
    const edgeData = e.target.attr();
    const [sourceData, targetData] = e.target.connectedNodes();
    edgeData.source = sourceData?.attr()?.name || sourceData?.attr()?.id;
    edgeData.target = targetData?.attr()?.name || targetData?.attr()?.id;
    const modal_data = { ...e.target.attr(), ...e.target.boundingBox() };
    window.webkit.messageHandlers.didDoubleClickEdge.postMessage(modal_data);
  });

  // scroll event-listener
  CY.on("scrollzoom", (e) => {
    if (CLEAR_SCROLL_TIMER) clearTimeout(CLEAR_SCROLL_TIMER);
    CLEAR_SCROLL_TIMER = setTimeout(() => _onScrollZoom(e), 150);
  });

  // mouseover event-listener
  CY.elements().unbind("tap");
  CY.elements().unbind("mouseover");
  CY.elements().bind("mouseover", (event) => {
    const target = event.target;
    target.addClass("mouseOverColor");
    if (!target.attr().name) return;
    window.webkit.messageHandlers.didMouseOver.postMessage(target);
  });

  // mouseout event-listener
  CY.elements().unbind("mouseOut");
  CY.elements().bind("mouseOut", (event) => {
    const target = event.target;
    target.removeClass("mouseOverColor");
    window.webkit.messageHandlers.didMouseOut.postMessage(target);
  });
}

function _applyCustomizedEvents() {
  const prefixes = [, "node", "edge"];
  CY.addListener = CY.on;
  for (let i = 0; i < prefixes.length; i++) {
    let timeout, previousTimeStamp, isDoubleClicked;
    let singleClickCallback, doubleClickCallback;
    const eventPrefix = prefixes[i];
    if (!prefixes[i]) prefixes[i] = "canvas";
    const event = (cy[prefixes[i]] = {});
    event.on = (method, cb, options = {}) => {
      let { timeout: clickTimeout = 300 } = options;
      CY.removeListener("tap", eventPrefix);
      if (method === "dblclick") doubleClickCallback = cb;
      if (method === "click") singleClickCallback = cb;
      CY.addListener("tap", eventPrefix, (e) => {
        isDoubleClicked = false;
        if (e.timeStamp - previousTimeStamp <= clickTimeout) {
          timeout && clearTimeout(timeout);
          isDoubleClicked = true;
          doubleClickCallback?.(e);
        }
        timeout = setTimeout(() => {
          if (isDoubleClicked) return;
          singleClickCallback?.(e);
        }, clickTimeout);
        previousTimeStamp = e.timeStamp;
      });
    };
    event.unbind = (method) => {
      if (method.includes("zoom")) _onUnregisterZoom(method);
      else if (method === "click" || method === "dblclick") {
        CY.removeListener("tap", eventPrefix);
      } else throw new Error(`no ${method} listener registered`);
      CY.removeListener("tap", eventPrefix);
    };
  }
}

function nodeClickFn(e) {
  const node = e.target;
  node.addClass("highlight-element");
  const nodeData = node.attr();
  const nodePosition = node.renderedPosition();
  const nodeBox = node.renderedBoundingBox();
  const modal_data = {
    ...node.boundingBox(),
    xlabel: nodeData.xlabel,
    name: nodeData.name,
    size: { height: nodeBox.h, width: nodeBox.w },
    position: { x: nodePosition.x, y: nodePosition.y },
  };
  window.webkit.messageHandlers.didClickNode.postMessage(modal_data);
}

function edgeClickFn(e) {
  const edge = e.target;
  edge.addClass("highlight-edge");
  edge.connectedNodes().addClass("highlight-element");
  const edgeData = edge.attr();
  edgeData.source = edge.connectedNodes()[0].attr().name;
  edgeData.target = edge.connectedNodes()[1].attr().name;
  const modal_data = {
    ...edge.attr(),
    ...edge.boundingBox(),
    position: { x: e.originalEvent.clientX, y: e.originalEvent.clientY },
  };
  window.webkit.messageHandlers.didClickEdge.postMessage(modal_data);
}

function _resizeGraph() {
  CLEAR_RESIZE_TIMER && clearTimeout(CLEAR_RESIZE_TIMER);
  CLEAR_RESIZE_TIMER = setTimeout(() => {
    CY.resize();
    CY.fit(CY.elements(), 20);
  }, 1000);
}

function _zoomIn(x, y) {
  CY.zoom({ level: CY.zoom() + 0.25, renderedPosition: { x, y } });
}

function _zoomOut(x, y) {
  CY.zoom({ level: CY.zoom() - 0.25, renderedPosition: { x, y } });
}

function highlightPath(xLabels, highlightedColor = "#ffd480") {
  const nodes = [];
  for (let i = 0; i < CY.nodes().length; i++) {
    const { name } = CY.nodes()[i].attr();
    if (xLabels.includes(name)) nodes.push(CY.nodes()[i]);
  }
  nodes.map((node, idx) => {
    node.data().highlightedColor = highlightedColor;
    node.addClass("highlighted");
    if (!nodes?.[idx + 1]) return;
    const nextNodeTarget = nodes[idx + 1].attr().id;
    for (let i = 0; i < node.connectedEdges().length; i++) {
      const { target } = node.connectedEdges()[i].attr();
      if (target == nextNodeTarget) {
        node.connectedEdges()[i].data().highlightedColor = highlightedColor;
        node.connectedEdges()[i].addClass("highlighted");
      }
    }
  });
}

function clearHighlightedPath() {
  CY.elements().removeClass("highlighted");
  CY.elements().removeClass("highlight-element");
  CY.elements().removeClass("highlight-edge");
}

function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split("");
    if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    c = "0x" + c.join("");
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  } else return [0, 0, 0];
}

function clamp(v, min = 0, max = 255) {
  if (v < min) return min;
  if (v > max) return max;
  return parseInt(v);
}

function change_color(hex_color, scale) {
  let [r, g, b] = hexToRgb(hex_color);
  r = clamp(r * (1 - scale));
  g = clamp(g * (1 - scale));
  b = clamp(b * (1 - scale));
  return rgbToHex(r, g, b);
}

function map_numbers(x, old_min, old_max, new_min, new_max) {
  if (old_max != old_min) {
    const dividend = parseFloat(new_min + (x - old_min) * (new_max - new_min));
    const divisor = old_max - old_min;
    return dividend / divisor;
  }
  return new_min;
}

function set_base_color(hex_color) {
  const frequency_list = {};
  CY.nodes().map((node) => {
    const { id, xlabel } = node.data();
    xlabel && (frequency_list[id] = parseInt(xlabel));
  });
  const max_frequency = Math.max(...Object.values(frequency_list));
  const min_frequency = Math.min(...Object.values(frequency_list));
  CY.nodes().map((node) => {
    const data = node.data();
    if (frequency_list.hasOwnProperty(data.id)) {
      const scale = map_numbers(
        frequency_list[data.id],
        min_frequency,
        max_frequency,
        0.1,
        0.5
      );
      data.faveColor = change_color(hex_color, scale);
      const [r, g, b] = hexToRgb(data.faveColor);
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (luma < 135) data.faveTextColor = "#FFFFFF";
      else data.faveTextColor = "#000000";
    } else if (data.id === "@@startnode") data.faveColor = "#145A32";
    else if (data.id === "@@endnode") data.faveColor = "#CB4335";
    else {
      data.faveColor = hex_color;
      data.faveTextColor = "#000000";
    }
  });
  _updateCyStyle();
}

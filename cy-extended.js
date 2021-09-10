document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
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
    multiClickDebounceTime: 250,
    zoom: 1,
    zoomingEnabled: true,
  }).nodeHtmlLabel([{ query: "node", tpl: _nodeMarkup }]);
  ANIMATION_PROPERTIES = { duration: 60, easing: "ease-in-sine" };

  _updateCyStyle();
  window.matchMedia(DARK_MODE_SCHEME).addEventListener("change", (e) => {
    _updateCyStyle(e.matches ? CY_DARK_STYLE : CY_LIGHT_STYLE);
  });

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
  document.setBaseColor = (...args) => set_base_color(...args);
}

function _cytoscapeListeners() {
  // single-click event-listeners
  CY.on("oneclick", _onCanvasClick);
  CY.on("oneclick", "node", _onNodeClick);
  CY.on("oneclick", "edge", _onEdgeClick);

  // double-click event-listeners
  CY.on("dblclick", _onCanvasDoubleClick);
  CY.on("dblclick", "node", _onNodeDoubleClick);
  CY.on("dblclick", "edge", _onEdgeDoubleClick);

  // mouse-over event-listeners
  CY.on("mouseover", "node", _onMouseOver);
  CY.bind("mouseover", "edge", _onMouseOver);

  // mouse-out event-listeners
  CY.bind("mouseout", "node", _onMouseOut);
  CY.on("mouseout", "edge", _onMouseOut);

  // scrollzoom event-listener
  CY.on("scrollzoom", _onScrollZoom);
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
  return `<div></div>`;
};
const get_end_node_markup = () => {
  return `<div></div>`;
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
  if (!window?.matchMedia?.(DARK_MODE_SCHEME).matches) return CY_LIGHT_STYLE;
  return CY_DARK_STYLE;
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
  const base_color = BASE_COLOR.getValue();
  if (!base_color) return data;
  data.elements.nodes = set_node_shades(data.elements.nodes, base_color);
  return data;
}

function _setZoomConfig(config) {
  const { custom_zoom_levels: zoom_levels = [] } = ZOOM_SETTINGS;
  const { custom_zoom_levels: config_zoom_levels = [] } = config;
  const custom_zoom_levels = [...zoom_levels, ...config_zoom_levels];
  ZOOM_SETTINGS = { ...config, custom_zoom_levels };
}

function _setInitialStyle() {
  const eq = (_) => true;
  const lt = (_) => false;
  const gt = (_) => false;
  ZOOM_SETTINGS.custom_zoom_levels?.map((c = {}) => {
    if (!c.condition_exp({ eq, lt, gt })) return;
    _nodeMarkupStyleHandler(c.node_markup_style);
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
      highlightPath(["grainne keating", "john freyne", "siobhan cahill"]);
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
        const layout_options = {
          name: "preset",
          animate: true,
          fit: true,
          stop: () => {
            const layout_options = {
              name: "preset",
              animate: true,
              fit: true,
              stop: () => {
                _setDefZoomCoord();
                resolve(true);
              },
            };
            CY.elements().layout(layout_options).run(); // To resize the graph, if it's not already resized properly from the previous layout animation
          },
        };
        _addElements(data.elements, { animate: false });
        CY.elements().layout(layout_options).run();
      },
    };
    CY.elements().layout(transform_layout_options).run();
  });
}

function findNearestNodes(previous_nodes, new_nodes = []) {
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

function _updateNodeMarkupStyle(nodes, markup_style, node_size) {
  if (!markup_style?.[node_size]) return;
  for (let i = 0; i < nodes?.length; i++) {
    const data = JSON.parse(atob(nodes[i].getAttribute("data-json")));
    if (markup_style?.[node_size]?.wrapper) {
      const style = styleJsonToString(markup_style?.[node_size].wrapper, data);
      nodes[i].style.cssText += style;
    }
    if (markup_style?.[node_size]?.name && nodes[i].children?.[0]) {
      const style = styleJsonToString(markup_style?.[node_size].name, data);
      nodes[i].children[0].style.cssText += style;
    }
    if (markup_style?.[node_size]?.label && nodes[i].children?.[1]) {
      const style = styleJsonToString(markup_style?.[node_size].label, data);
      nodes[i].children[1].style.cssText += style;
    }
  }
}

function _nodeMarkupStyleHandler(markup_style = {}) {
  if (!markup_style) return;
  markup_style.exec?.();
  // global style that applies to every graph regardless of the node-size
  const nodes = document.getElementsByClassName("node-wrapper");
  _updateNodeMarkupStyle(nodes, markup_style, "all");
  [SMALL_NODE_TAG, MEDIUM_NODE_TAG, LARGE_NODE_TAG].map((tag) => {
    if (!markup_style[tag]) return;
    const nodes = document.getElementsByClassName(`${tag}-node`);
    _updateNodeMarkupStyle(nodes, markup_style, tag);
  });
}

function _nodeStyleHandler(node_style = {}) {
  const { all = {}, connected_edges = {}, exec } = node_style;
  typeof exec === "function" && exec();
  CY.nodes().style(all);
  Object.entries(connected_edges).map(([key, value = {}]) => {
    const nodes = CY.nodes(key !== "all" && `[node_size = "${key}"]`);
    nodes.map((n) => {
      const style = Object.assign({}, value); // creates a clone of the given object
      style.fn?.(n.connectedEdges());
      delete style.fn;
      n.connectedEdges().style(style);
    });
  });
}

function _edgeStyleHandler(edge_style = {}) {
  const { all = {}, connected_nodes = {}, exec } = edge_style;
  typeof exec === "function" && exec();
  CY.edges().style(all);
  CY.edges().map((e) => e.connectedNodes().style(connected_nodes));
}

const _zoomHandler = (e = _getCustomScrollEvent()) => {
  const { h, w } = e.target.elements().renderedBoundingBox();
  const eq = (pct) => _isGraphSizeEqual(pct, { h, w });
  const gt = (pct) => _isGraphSizeLarger(pct, { h, w });
  const lt = (pct) => _isGraphSizeSmaller(pct, { h, w });
  ZOOM_SETTINGS?.custom_zoom_levels?.map((c) => {
    if (!c.condition_exp({ gt, lt, eq })) return;
    _nodeMarkupStyleHandler(c.node_markup_style);
    _nodeStyleHandler(c.node_style);
    _edgeStyleHandler(c.edge_style);
  });
};

function _getCustomScrollEvent() {
  return { target: { zoom: () => CY.zoom(), elements: () => CY.elements() } };
}

function _postMessage(method, data) {
  return;
  window.webkit.messageHandlers[method].postMessage(data);
}

function _onCanvasClick(e) {
  if (e.target !== CY) return;
  CY.elements().removeClass("highlight");
  CY.elements().removeClass("click");
}

function _onCanvasDoubleClick(e) {
  if (e.target !== CY) return;
  _zoomIn(e.originalEvent.x, e.originalEvent.y);
}

function _onNodeClick(e) {
  CY.elements().removeClass("click highlight");
  const node = e.target;
  node.addClass("click");
  console.log(node.classes());
  const nodeData = node.attr();
  const nodePosition = node.renderedPosition();
  const nodeBox = node.renderedBoundingBox();
  const modal_data = {
    ...node.boundingBox(),
    xlabel: nodeData.xlabel || nodeData.id,
    name: nodeData.name || nodeData.id,
    size: { height: nodeBox.h, width: nodeBox.w },
    position: { x: nodePosition.x, y: nodePosition.y },
  };
  _postMessage("didClickNode", modal_data);
}

function _onNodeDoubleClick(e) {
  const modal_data = e.target.attr();
  loadGraph(get_random_data());
  _postMessage("didDoubleClickNode", modal_data);
}

function _onEdgeClick(e) {
  const edge = e.target;
  if (edge.connectedNodes().length < 2) return;
  CY.elements().removeClass(["click", "highlight"]);
  edge.addClass("click");
  edge.connectedNodes().addClass("click");
  const edgeData = edge.attr();
  edgeData.source = edge.connectedNodes()[0].attr().name;
  edgeData.target = edge.connectedNodes()[1].attr().name;
  if (!edgeData.source) edgeData.source = edge.connectedNodes()[0].attr().id;
  if (!edgeData.target) edgeData.target = edge.connectedNodes()[1].attr().id;
  edgeData.source = edgeData.source.toUpperCase();
  edgeData.target = edgeData.target.toUpperCase();
  const modal_data = {
    ...edge.attr(),
    ...edge.boundingBox(),
    position: { x: e.originalEvent.clientX, y: e.originalEvent.clientY },
  };
  _postMessage("didClickEdge", modal_data);
}

function _onEdgeDoubleClick(e) {
  const edgeData = e.target.attr();
  const [sourceData, targetData] = e.target.connectedNodes();
  edgeData.source = sourceData?.attr()?.name || sourceData?.attr()?.id;
  edgeData.target = targetData?.attr()?.name || targetData?.attr()?.id;
  const modal_data = { ...e.target.attr(), ...e.target.boundingBox() };
  _postMessage("didDoubleClickEdge", modal_data);
}

function _onScrollZoom(e) {
  if (CLEAR_SCROLL_TIMER) clearTimeout(CLEAR_SCROLL_TIMER);
  CLEAR_SCROLL_TIMER = setTimeout(() => {
    const isReachedMax = isZoomReachedMax();
    if (isReachedMax) CY.maxZoom(e.target.zoom());
    const isReachedMin = isZoomReachedMin();
    if (isReachedMin) CY.minZoom(e.target.zoom());
    if (isReachedMax || isReachedMin) return;
    _zoomHandler(e);
  }, 150);
}

function _onMouseOver({ target }) {
  // target.addClass("mouseover");
  _postMessage("didMouseOver", target);
}

function _onMouseOut({ target }) {
  // target.removeClass("mouseover");
  _postMessage("didMouseOut", target);
}

function _resizeGraph() {
  CLEAR_RESIZE_TIMER && clearTimeout(CLEAR_RESIZE_TIMER);
  CLEAR_RESIZE_TIMER = setTimeout(() => {
    const prev_viewport = { zoom: CY.zoom(), pan: CY.pan() };
    const layout_options = {
      name: "preset",
      animate: false,
      fit: true,
      stop: () => {
        prev_viewport.pan.x = CY.pan("x"); // To keep the horizontal axis up to date
        CY.viewport(prev_viewport);
      },
    };
    CY.elements().layout(layout_options).run();
  }, 1000);
}

function _zoomIn(x, y) {
  if (x && y) {
    CY.zoom({ level: CY.zoom() + 0.25, renderedPosition: { x, y } });
  } else {
    const renderedPosition = CY.elements().renderedPosition();
    const position = CY.elements().position();
    CY.zoom({ level: CY.zoom() + 0.25, renderedPosition, position });
  }
  CY.emit(["scrollzoom"]);
}

function _zoomOut(x, y) {
  if (x && y) {
    CY.zoom({ level: CY.zoom() - 0.25, renderedPosition: { x, y } });
  } else {
    const renderedPosition = CY.elements().renderedPosition();
    const position = CY.elements().position();
    CY.zoom({ level: CY.zoom() - 0.25, renderedPosition, position });
  }
  CY.emit("scrollzoom");
}

function highlightPath(xLabels = []) {
  xLabels = xLabels.map((l) => l.toUpperCase());
  const nodes = [];
  for (let i = 0; i < CY.nodes().length; i++) {
    const { name } = CY.nodes()[i].attr();
    if (xLabels.includes(name?.toUpperCase?.())) nodes.push(CY.nodes()[i]);
  }
  nodes.map((node, idx) => {
    node.addClass("highlight");
    if (!nodes?.[idx + 1]) return;
    for (let i = 0; i < node.connectedEdges().length; i++) {
      const es1 = node.connectedEdges()[i];
      nodes?.[idx + 1].connectedEdges().map((es2) => {
        if (es1.attr("source") !== es2.attr("source")) return;
        if (es1.attr("target") !== es2.attr("target")) return;
        if (es1.attr("source") === node.attr("id")) return;
        es1.addClass("highlight");
      });
    }
  });
}

function clearHighlightedPath() {
  CY.elements().removeClass("highlight");
}

function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return [0, 0, 0];
  let c = hex.substring(1).split("");
  if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  c = "0x" + c.join("");
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
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

function set_node_shades(nodes, hex_color) {
  if (!nodes.length) return nodes;
  const frequency_list = {};
  nodes.map(({ data }) => {
    data = typeof data === "function" ? data() : data;
    const { id, xlabel } = data;
    xlabel && (frequency_list[id] = parseInt(xlabel));
  });
  const max_frequency = Math.max(...Object.values(frequency_list));
  const min_frequency = Math.min(...Object.values(frequency_list));
  nodes.map((node) => {
    node.data = typeof node.data === "function" ? node.data() : node.data;
    const { data } = node;
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
  return nodes;
}

function set_base_color(hex_color) {
  BASE_COLOR.setValue(hex_color);
  set_node_shades(CY.nodes(), hex_color);
}

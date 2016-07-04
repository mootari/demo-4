'use strict';

/**
 * Maps DOM tree to data structure.
 */
const map = function(element) {
  var
    children = [],
    child, childNode,
    i = 0,
    size;

  if(!filter(element)) {
    return null;
  }

  while (child = element.children[i++]) {
    if(childNode = map(child)) {
      children.push( childNode );
    }
  }

  return {
    name: element.tagName,
    children: children,
    node: element
  };
};

const filter = function(element) {
  switch(element.tagName) {
    case 'HEAD':
    case 'SCRIPT':
    case 'SPAN':
    case 'LINK':
    // return false;
  }
  return true;
};

const getSize = function(element) {
  switch (element.tagName) {

    case 'IMG':
      return element.alt.length;

    case 'HEAD':
    case 'STYLE':
    case 'SCRIPT':
    // return 0;

    default:
      return getImmediateText(element).length;
  }

};

/**
 * Returns text directly contained in the element.
 */
const getImmediateText = function(element) {
  var str = '', node, i = 0;
  while(node = element.childNodes[i++]) {
    if(node.nodeType === Node.TEXT_NODE && node.textContent !== null) {
      str += node.textContent.replace(/^[\s]+$/g, '');
    }
  }
  return str;
};



'use strict';

var fn = {};
var defaults = {
  length: {
    factor: 1,
    base: 20,
    children: 0,
    siblings: 0,
    contains: 0,
    angle: 0,
    spread: 0,
    spreadDelta: 0,
    depth: 0
  },
  angle: {
    factor: .5,
    parent: 0,
    children: 1,
    equal: .5,
    offset: 0,
    depth: 0
  }
};
var bounds = {
  minX: 0,
  maxX: 0,
  minY: 0,
  maxY: 0,
  spread: 0
};

fn.nodes = function(node) {
  var nodes = [], i = 0, child, tmpNode;
  nodes.push(node);
  node.depth = node.parent ? node.parent.depth + 1 : 0;
  node.maxDepth = node.depth;
  node.contains = 1;
  node.index = 0;
  if(node.children) {
    while(child = node.children[i++]) {
      child.parent = node;
      nodes = nodes.concat(fn.nodes(child));
      child.index = i - 1;
      node.maxDepth = Math.max(node.maxDepth, child.maxDepth);
      node.contains += child.contains;
    }
  }

  if(!node.depth) {
    fn.setSpread(node);
    fn.setPosition(node);
  }

  return nodes;
};

fn.links = function(nodes) {
  var links = [], i = 0, node;
  while(node = nodes[i++]) {
    if(node.parent) {
      links.push({
        source: node.parent,
        target: node
      });
    }
  }
  return links;
};

fn.bounds = function() {
  return bounds;
};

fn.mergeDefaults = function(defaults, config) {
  var name;
  for (name in defaults) {
    if (!defaults.hasOwnProperty(name) || !config.hasOwnProperty(name)) {
      continue;
    }
    if(typeof defaults[name] === 'object') {
      fn.mergeDefaults(defaults[name], config[name]);
      continue;
    }
    defaults[name] = config[name];
  }
};

/**
 * Adds spread (max children at single level) to each node.
 */
fn.setSpread = function(node) {
  var i = 0, child, spreadOffset = 0;
  //node.depth = node.depth || 0;
  node.spread = 0;
  node.spreadRatio = 1;
  node.spreadOffset = 0;
  while(child = node.children[i++]) {
    fn.setSpread(child);
    node.spread += child.spread;
  }
  node.spread = Math.max(1, node.spread);

  // Calculate spread ratio for children.
  i = 0;
  while(child = node.children[i++]) {
    child.spreadOffset = spreadOffset;
    child.spreadRatio = 1 / node.spread * child.spread;
    spreadOffset += child.spreadRatio;
  }
};

fn.setPosition = function(node) {
  var i = 0, child, angle, length;

  node.angle = fn.calculateAngle(node);
  length = fn.calculateLength(node);

  if(node.parent) {
    angle = node.angle - Math.PI / 2;
    node.x = Math.cos(angle) * length;
    node.y = Math.sin(angle) * length;
    node.x += node.parent.x;
    node.y += node.parent.y;
  }
  else {
    node.x = 0;
    node.y = 0;
  }
  fn.updateBounds(node);

  while(child = node.children[i++]) {
    fn.setPosition(child);
  }
};

fn.updateBounds = function(node) {
  bounds.minX = Math.min(bounds.minX, node.x);
  bounds.maxX = Math.max(bounds.maxX, node.x);
  bounds.minY = Math.min(bounds.minY, node.y);
  bounds.maxY = Math.max(bounds.maxY, node.y);
};

fn.calculateAngle = function(node) {
  var angle = 0;
  var parentAngle = node.parent ? node.parent.angle : 0;
  var offset = node.spreadRatio / 2 + node.spreadOffset;
  var part = node.parent ? 1 / node.parent.children.length : 1;
  part = part * node.index + part / 2;

  // ratios: -1 = S; -.5 = W; 0 = N; .5 = E; 1 = S
  angle += config.angle.offset * (offset * 2 - 1) * Math.PI;
  angle += config.angle.equal  * (part * 2 - 1) * Math.PI;
  // angle += config.angle.depth  * angle * node.depth;
  angle *= config.angle.factor;
  angle += config.angle.parent * parentAngle;

  return angle;
};

fn.calculateLength = function(node) {
  var length = 0;
  var siblings = node.parent ? node.parent.children.length : 1;
  var parentSpread = node.parent ? node.parent.spread : node.spread;

  length += config.length.children    * node.children.length;
  length += config.length.spread      * node.spread;
  length += config.length.spreadDelta * (parentSpread - node.spread);
  length += config.length.siblings    * siblings;
  length += config.length.contains    * node.contains;
  length += config.length.angle       * Math.pow(Math.sin((node.angle - Math.PI) / 2), 4);
  length += config.length.depth       / node.depth;
  length += config.length.base;
  length *= config.length.factor;
  return length;
};

fn.mergeDefaults(defaults, config);
config = defaults;

// return {
//   nodes: fn.nodes,
//   links: fn.links,
//   bounds: fn.bounds
// };




export default map;

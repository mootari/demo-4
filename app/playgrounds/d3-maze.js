'use strict';

import * as d3 from 'd3';
import grid from '../modules/grid';
import * as d3Chromatic from 'd3-scale-chromatic';
import {GUI as DatGui} from 'dat-gui';
import zoomHelper from '../modules/zoom';



function applyMetrics(root) {
  // Set child indices.
  root.index = 0;
  root.eachBefore((d) => {
    d.childCount = d.children ? d.children.length : 0;
    d.childCount && d.children.forEach((d, i) => {
      d.index = i;
    });
  });

  // Calculate max depth and spread per path (max number of children at same depth).
  // todo: Wrong, wrong, wong. Doesn't add up / combine spreads of multiple children
  root.eachAfter((d) => {
    d.maxDepth = d.maxDepth || d.depth;
    d.spread = Math.max(d.spread || 1, d.childCount);
    if(d.parent) {
      d.parent.maxDepth = d.parent.maxDepth ? Math.max(d.parent.maxDepth, d.maxDepth) : d.maxDepth;
      d.parent.spread = d.parent.spread ? Math.max(d.parent.spread, d.spread) : d.spread;
    }
  });
}


function applyLayout(root, options) {

  const childAngle = Math.PI / 2;
  const offset = options.forkOffset;
  const spacing = options.forkSpacing;
  const direction = {
    left: d => (-1),
    right: d => (1),
    altDepth: d => (d.depth % 2 * 2 - 1)
  }[options.forkStart];

  const indexOffset = {
    alt: d => (0),
    across: d => (-d.index % 2),
    single: d => (d.index)
  }[options.forkLayout];

  const length = {
    alt: d => (d.childCount),
    across: d => (d.childCount),
    single: d => (d.childCount)
  }[options.forkLayout];

  const layout = (d) => {

    d.length = d.childCount > 1 ? offset + length(d) * spacing : 1;
    d.length += Math.floor(d.value / root.value * 5);
    // d.length += Math.floor((d.spread - 1) / (root.spread - 1) * 20);
    d.length += d.maxDepth - d.depth;
    if(d.parent) {
      const dir = direction(d);
      const single = d.parent.children.length < 2 || d.parent.children.length == d.index + 1;
      // Oscillate between left and right side of the parent.
      const a = single ? 0 : (d.index % 2 ? -1 : 1) * childAngle * dir;
      const x = single ? 0 : (d.index % 2 * 2 - 1) * dir;
      const y = single ? d.parent.length + 1 : offset + (d.index + 1 + indexOffset(d)) * (d.parent.length - offset) / d.parent.children.length;

      const cos = Math.cos(d.parent.a);
      const sin = Math.sin(d.parent.a);
      // Rotation matrix.
      const m = [cos, -sin, sin, cos];
      // Rotate by parent angle.
      d.x = d.parent.x + (m[0] * x + m[1] * y);
      d.y = d.parent.y + (m[2] * x + m[3] * y);

      d.a = d.parent.a + a;
    }
  };

  root.x = 0;
  root.y = 0;
  root.a = Math.PI;

  root.eachBefore(layout);
}


function uiHelper(gui, options = {}) {
  const addSection = (name, fields, open = true) => {
    const folder = gui.addFolder(name);
    for(let [prop, value, args, init] of fields) {
      options.hasOwnProperty(prop) || (options[prop] = value);
      const controller = folder.add.apply(folder, [options, prop].concat(args));
      typeof init === 'function' && init(controller);
    }
    open && folder.open();
  };

  const onChange = (gui, func) => {
    gui.__controllers.forEach(c => {
      c.onChange(func);
    });
  };

  return {
    addSection: addSection,
    gui: gui,
    options: options,
    onChange: (func) => {
      onChange(gui, func);
      for(let i in gui.__folders) {
        if(gui.__folders.hasOwnProperty(i)) {
          onChange(gui.__folders[i], func);
        }
      }
    }
  }
}

function colorHelper(root, options) {
  const sources = {
    'depth':       { value: (d) => (d.depth),              domain: (r) => [0, r.maxDepth] },
    'depthMax':    { value: (d) => (d.maxDepth),           domain: (r) => [0, r.maxDepth] },
    'depthMaxRel': { value: (d) => (d.maxDepth - d.depth), domain: (r) => [0, r.maxDepth] },
    'spread':      { value: (d) => (d.spread),             domain: (r) => [0, r.spread] },
    'nodes':      { value: (d) => (d.value),              domain: (r) => [0, r.value]  }
    // 'children':    { value: (d) => (d.children),           domain: (r) => [0, ]  }
  };

  const interpolators = {
    'viridis':   d3.interpolateViridis,
    'inferno':   d3.interpolateInferno,
    'magma':     d3.interpolateMagma,
    'plasma':    d3.interpolatePlasma,
    'warm':      d3.interpolateWarm,
    'cool':      d3.interpolateCool,
    'rainbow':   d3.interpolateRainbow,
    'cubehelix': d3.interpolateCubehelixDefault,
    'brbg':      d3Chromatic.interpolateBrBG,
    'prgn':      d3Chromatic.interpolatePRGn,
    'piyg':      d3Chromatic.interpolatePiYG,
    'puor':      d3Chromatic.interpolatePuOr,
    'rdbu':      d3Chromatic.interpolateRdBu,
    'rdgy':      d3Chromatic.interpolateRdGy,
    'rdylbu':    d3Chromatic.interpolateRdYlBu,
    'rdylgn':    d3Chromatic.interpolateRdYlGn,
    'spectral':  d3Chromatic.interpolateSpectral
  };

  const source = sources[options.colorSource];
  let domain = source.domain(root);
  if(options.colorInvert) {
    domain = domain.reverse();
  }

  const scale = d3.scaleSequential(interpolators[options.colorScale]).domain(domain);
  const color = d => { return scale(source.value(d)); };
  const colorDark = d => d3.color(color(d)).darker(1);

  return {
    color: color,
    colorDark: colorDark
  }
}


function init(parentNode, data) {

  const $svg = d3.select(parentNode).append('svg');
  const $drawBox = $svg.append('g').attr('class', 'pg-d3-maze');
  const zoom = zoomHelper($svg, $drawBox);
  zoom.center();
  $svg.call(grid, zoom);

  const ui = uiHelper(new DatGui);
  ui.addSection('Layout', [
    // ['forkLastExtend', true ],
    ['forkStart',      'right', [['left', 'right', 'altDepth']] ],
    ['forkLayout',     'alt',   [['alt', 'across']] ],
    ['forkOffset',     3.5,     [0, 10], (g) => g.step(.5) ],
    ['forkSpacing',    1,       [0, 10], (g) => g.step(.5) ]
    //['forkAngle',      '', []]
  ]);
  ui.addSection('Color', [
    ['colorSource', 'depth', [['depth', 'depthMax', 'depthMaxRel', 'spread', 'nodes']] ],
    ['colorScale', 'rdylbu', [['viridis','inferno','magma','plasma','warm','cool','rainbow','cubehelix','brbg','prgn','piyg','puor','rdbu','rdgy','rdylbu','rdylgn','spectral']] ],
      ['colorInvert', false]
  ]);
  ui.addSection('Zoom', [
    ['zoomAuto', true ]
  ]);

  const root = d3.hierarchy(data.node, (d) => d.childNodes);
  root.sum((d) => d.children ? d.children.length + 1 : 1);
  applyMetrics(root);

  const scale = 10;
  const transform = d => 'translate(' + (d.x * scale) + 'px,' + (d.y * scale) + 'px) rotate(' + (180 / Math.PI * d.a) + 'deg)';

  // Triangular path direction markers.
  const basePathFactory = ({ width = .5, height = .5 } = {}) => {
    width = width / 2;
    const offset = -.5;
    return [
      'M' + (-width * scale) + ',' + (offset * scale),
      'L' + ( width * scale) + ',' + (offset * scale),
      'L' + 0 + ',' + ((offset + height) * scale),
      'Z'
    ].join(' ');
  };


  const colorScale = colorHelper(root, ui.options);
  applyLayout(root, ui.options);

  const $groupsContainer = $drawBox.append('g');
  let $groups = $groupsContainer
    .selectAll('.node')
    .data(root.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .style('transform', transform)
    .each((d, i, selection) => {
      d.element = selection[i];
    });

  $groups.append('rect')
    .attr('class', 'area')
    .attr('x', -.5 * scale)
    .attr('y', -.5 * scale)
    .attr('fill', colorScale.color)
    .attr('width', 1 * scale)
    .attr('height', d => (d.length + 1) * scale);

  $groups.append('path')
    .attr('class', 'direction')
    .attr('d', basePathFactory())
    .attr('fill', colorScale.colorDark);

  $groups.on('mouseover', (d) => {
    if(d3.event.shiftKey) {
      $drawBox.classed('hover', true);
      $groups.filter('.active-path').classed('active-path', false);
      const elements = d.ancestors().map((d) => d.element);
      d3.selectAll(elements).classed('active-path', true);
    }
  });
  $groups.on('mouseout', () => {
    if(d3.event.shiftKey) {
      $groups.filter('.active-path').classed('active-path', false);
      $drawBox.classed('hover', false);
    }
  });

  zoom.fit($groupsContainer);


  // todo: Get rid of duplicate code.
  const update = () => {
    applyLayout(root, ui.options);
    const colorScale = colorHelper(root, ui.options);

    $groups = $groups.data(root.descendants())
      .style('transform', transform)
      .each((d, i, selection) => {
        d.element = selection[i];
      });

    $groups.selectAll('.area')
      .attr('x', -.5 * scale)
      .attr('y', -.5 * scale)
      .attr('fill', colorScale.color)
      .attr('width', 1 * scale)
      .attr('height', d => (d.length + 1) * scale);

    $groups.selectAll('.path')
      .attr('d', basePathFactory())
      .attr('fill', colorScale.colorDark);

    ui.options.zoomAuto && zoom.fit($groupsContainer);
  };

  // todo: Make auto updates optional.
  ui.onChange(update);

}

export default init;

'use strict';

import * as d3 from 'd3';

function grid(selection, zoom, tickSpacing = 100) {

  function axis(alignment) {
    const map = {
      axis: {
        left:   'axisLeft',
        right:  'axisRight',
        top:    'axisTop',
        bottom: 'axisBottom'
      },
      rescale: {
        left:   'rescaleY',
        right:  'rescaleY',
        top:    'rescaleX',
        bottom: 'rescaleX'
      },
      range: {
        left:   ['top', 'bottom'],
        right:  ['top', 'bottom'],
        top:    ['left', 'right'],
        bottom: ['left', 'right']
      },
      tickPadding: {
        left:   -35,
        right:  35,
        top:    -20,
        bottom: 20
      },
      ticks: {
        left:    (bbox) => bbox.height / tickSpacing,
        right:   (bbox) => bbox.height / tickSpacing,
        top:     (bbox) => bbox.width / tickSpacing,
        bottom:  (bbox) => bbox.width / tickSpacing
      },
      tickSize: {
        left:   (bbox) => -bbox.width,
        right:  (bbox) => bbox.width,
        top:    (bbox) => -bbox.height,
        bottom: (bbox) => bbox.height
      }
    };

    const scale = d3.scaleLinear();
    const axis  = d3[map.axis[alignment]](scale).tickPadding(map.tickPadding[alignment]);
    const group = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
    let lastTransform;

    const resize = (bbox) => {
      axis.tickSize(map.tickSize[alignment](bbox));
      axis.ticks(map.ticks[alignment](bbox));
      const range = [ bbox[map.range[alignment][0]], bbox[map.range[alignment][1]] ];
      scale.range(range).domain(range);
      if(lastTransform) {
        applyZoom(lastTransform);
      }
      group.call(axis);
    };

    const applyZoom = (transform = null) => {
      lastTransform = transform || d3.event.transform;
      let callback = map.rescale[alignment];
      group.call(axis.scale(lastTransform[callback](scale)));
    };

    return {
      group:  group,
      resize: resize,
      zoom:   applyZoom
    }
  }


  function findNodeWithLayout(node) {
    if(!node || !node.getBoundingClientRect) {
      return null;
    }
    let rect = node.getBoundingClientRect();
    return (rect.width || rect.height) ? node : findNodeWithLayout(node.parentNode);
  }

  const bboxNode = findNodeWithLayout(selection.node());
  const x = axis('top');
  const y = axis('left');

  const resize = () => {
    const bbox = bboxNode.getBoundingClientRect();
    x.resize(bbox);
    y.resize(bbox);
  };

  const $grid = selection.append('g').attr('class', 'grid');
  $grid.node().appendChild(x.group.node());
  $grid.node().appendChild(y.group.node());
  resize();

  zoom.on('zoom.grid', () => {
    x.zoom();
    y.zoom();
  });

  d3.select(window).on('resize.grid', resize);
}

export default grid;

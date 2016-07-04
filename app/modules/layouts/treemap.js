'use strict';

import * as d3 from 'd3';

function treemap(selection, data) {
  console.log(selection, data);
  const root = d3.hierarchy(data, (d) => d.childNodes)
    .sum((d) => d.childNodes.length + 1);
  const treemap = d3.treemap()
    .size([1000, 1000])
    .round(true)
    .padding(0);

  treemap(root);

  // selection.append('g')
  //   .attr('class', 'treemap')
  //   .selectAll('.node')
  //   .data(root.descendants())
  //   .enter()
  //   .append('rect')
  //   .attr('class', 'node')
  //   .attr('x', (d) => d.x0)
  //   .attr('y', (d) => d.y0)
  //   .attr('width', (d) => d.x1 - d.x0)
  //   .attr('height', (d) => d.y1 - d.y0);

  const $node = selection.append('g')
    .attr('class', 'treemap')

    .selectAll('.node')
    .data(root.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .style('transform', (d) => {
      return 'translateZ(' + (d.depth * 10) + 'px)';
    });

  $node.append('rect')
    .attr('x',      (d) => d.x0)
    .attr('y',      (d) => d.y0)
    .attr('width',  (d) => d.x1 - d.x0)
    .attr('height', (d) => d.y1 - d.y0);
  $node.append('text')
    .attr('x', (d) => d.x0)
    .attr('y', (d) => d.y0)
    .attr('width',  (d) => d.x1 - d.x0)
    .text((d) => {
      // console.log(d.data);
      return d.data.tagName || d.data.nodeValue;
    });

}

export default treemap;

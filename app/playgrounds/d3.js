'use strict';

import * as d3 from 'd3';
import grid from '../modules/grid';

export default (parentNode, data) => {
  const $svg = d3.select(parentNode).append('svg');
  const $drawBox = $svg.append('g').attr('class', 'playground-d3');
  const zoom = d3.zoom();

  zoom.on('zoom.drawBox', () => {
    $drawBox.attr('transform', d3.event.transform);
  });
  
  $svg.call(zoom).call(grid, zoom);
  zoom.translateBy($svg, window.innerWidth / 2, window.innerHeight / 2);

  const root = d3.hierarchy(data.node, (d) => d.childNodes);
  root.sum((d) => d.children ? d.children.length + 1 : 1);

  const pie = d3.pie().value((d) => d.value).padAngle(1);
  const calcChildren = (d) => {
    const limit = Math.PI;
    pie.startAngle(d.center - limit).endAngle(d.center + limit);
    const arcs = pie(d.children || []);
    arcs.forEach((arc) => {
      const node = arc.data;

      node.start  = arc.startAngle;
      node.end    = arc.endAngle;
      node.center = node.end - (node.end - node.start) / 2;
      const angle = node.end - node.start;
      if(angle <= Math.PI) {
        const b = node.parent.r;
        const a = b * Math.tan(angle / 2);
        const c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
        const cf = a * 2 + c * 2;
        const area = a * b;
        node.r = area * 2 / cf;
        // debugger;
      }
      else {
        const ratio = 1 / (Math.PI * 2) * (node.end - node.start);
        node.r = node.parent.r / 2 * ratio;
      }

      // const rOffset = node.parent.r - node.r * 2;
      const rOffset = node.parent.r + node.r / 2;
      node.x = node.parent.x + Math.cos(node.center - Math.PI / 2) * (node.r + rOffset);
      node.y = node.parent.y + Math.sin(node.center - Math.PI / 2) * (node.r + rOffset);
    });
    // let valueFactor = 1 / d.children.reduce((sum, d) => (sum + d.value), 0);
    // let offset = 0;
    // d.children.forEach((d) => {
    //   const value = valueFactor * (d.value);
    //   const rad = (offset + value / 2) * Math.PI * 2 + d.parent.rad;
    //   offset += value;
    //   const r = d.parent.r / 2 * value;
    //   const rOffset = (d.parent.r - r * 2);
    //
    //   d.x = d.parent.x + Math.cos(rad) * (r + rOffset);
    //   d.y = d.parent.y + Math.sin(rad) * (r + rOffset);
    //   d.r = r;
    //   d.rad = rad;
    // });
  };

  root.x = 0;
  root.y = 0;
  root.r = 20000;
  root.start = 0;
  root.center = Math.PI;
  root.end = Math.PI * 2;
  root.descendants().forEach(calcChildren);
  const maxDepth = 100;
  const nodes = root.descendants().filter((d) => (d.depth <= maxDepth));
  const links = root.links().filter((d) => (d.target.depth <= maxDepth));

  $drawBox.append('g').selectAll('.node')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('class', 'node')
    // .attr('fill', (d) => d.depth % 2 ? 'white' : 'black')
    .attr('cx', (d) => d.x)
    .attr('cy', (d) => d.y)
    .attr('r', (d) => d.r);
  // $drawBox.append('g').selectAll('.pie')
  //   .data(nodes.slice(1))
  //   .enter()
  //   .append('path')
  //   .attr('class', 'pie')
  //   .attr('d', (d) => {
  //     const data = [];
  //     return d3.line
  //   });

  // $drawBox.append('g').selectAll('.label')
  //   .data(nodes)
  //   .enter()
  //   .append('text')
  //   .attr('class', 'label')
  //   .text((d) => d.data.tagName)
  //   .attr('x', (d) => d.x)
  //   .attr('y', (d) => d.y);

  $drawBox.append('g').selectAll('.link')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('vector-effect', 'non-scaling-stroke')
    .attr('d', (d) => {
      return 'M' + d.source.x + ',' + d.source.y + ' ' + 'L' + d.target.x + ',' + d.target.y;
    });
    // .attr('x1', (d) => d.source.x)
    // .attr('y1', (d) => d.source.y)
    // .attr('x2', (d) => d.target.x)
    // .attr('y2', (d) => d.target.y);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius((d) => d.parent.r)
    .startAngle((d) => d.start)
    .endAngle((d) => d.end);

  $drawBox.append('g').selectAll('.arc')
    .data(nodes.slice(1))
    .enter()
    .append('path')
    .attr('class', 'arc')
    .attr('d', arc)
    .attr('transform', (d) => 'translate(' + d.parent.x + ',' + d.parent.y + ')');


}

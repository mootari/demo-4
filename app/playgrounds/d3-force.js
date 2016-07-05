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
  d3.tree().size([Math.PI * 2, 500])(root);
  root.descendants().forEach((d) => {
    const a = d.x;
    const r = d.y;
    d.x = Math.cos(a) * r;
    d.y = Math.sin(a) * r;
    d.f = d.parent
      ? (d.children ? d.children.length / d.parent.children.length : 0)
      : 1;
  });

  const nodes = root.descendants();
  const links = root.links();

  const sim = d3.forceSimulation(nodes)
    .stop()
    .velocityDecay(.1)
    .alphaMin(.03)
    // .stop()
    .force('link', d3.forceLink(root.links(links))
      .distance(10)
      .iterations(3)
    )
    .force('charge', d3.forceManyBody()
      .theta(.2)
        .strength((d) => d.children ? d.children.length * -.1 : -10)
        // .strength((d) => d.children ? d.f * -.1 + d.value * -.01 : -10)
        // .strength((d) => (d.children ? -1 : -10) * .1)
      // .strength(-.1)
      // .strength(-1)
    )
    .force('center', d3.forceCenter())
    ;
  // let steps = 100;
  // while(steps--) {
  //   sim.tick(10000);
  //   if(!(steps % 10)) {
  //     console.log(steps);
  //   }
  // }

  const $nodes = $drawBox.append('g').selectAll('.node')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .attr('cx', (d) => d.x)
    .attr('cy', (d) => d.y)
    .attr('r', .6);
  $nodes.filter((d) => !d.depth).attr('r', 50).classed('root', true);

  const $links = $drawBox.append('g').selectAll('.link')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('vector-effect', 'non-scaling-stroke')
    .attr('d', (d) => {
      return 'M' + d.source.x + ',' + d.source.y + ' ' + 'L' + d.target.x + ',' + d.target.y;
    });

  let ticks = 0;
  const update = () => {
    ticks++;
    $nodes
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y);
    $links
      .attr('d', (d) => {
        return 'M' + d.source.x + ',' + d.source.y + ' ' + 'L' + d.target.x + ',' + d.target.y;
      });
    if(!(ticks % 10)) {
      console.log('Ticks: %d | Alpha: %f | Min alpha: ', ticks, sim.alpha(), sim.alphaMin());
    }
  };
  sim.on('tick', update);
  sim.restart();
  // update();
}

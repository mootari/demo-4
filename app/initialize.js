'use strict';

import * as domJSON from 'domjson';
import loadDOM from './modules/remote-dom';

import pg_d3_pie from './playgrounds/d3-pie';
import pg_d3_force from './playgrounds/d3-force';
import pg_d3_maze from './playgrounds/d3-maze';
import pg_3js from './playgrounds/three';

document.addEventListener('DOMContentLoaded', () => {

  const urls = {
    'gallery': 'https://github.com/d3/d3/wiki/Gallery',
    'issues': 'https://github.com/d3/d3/issues',
    'source-xxl': 'https://github.com/d3/d3/blob/v3.5.17/d3.js', // Warning: HUGE.
    'source-s': 'https://github.com/d3/d3-selection/blob/master/src/selection/attr.js',
    'google': 'https://google.com',
    'amazon': 'https://www.amazon.com',
    'bbc': 'http://www.bbc.com/',
    'so': 'http://www.stackoverflow.com/',
    'gh': 'http://www.github.com/'
  };
  const url = urls['gh'];

  const proxy = u => ('https://crossorigin.me/' + u);
  loadDOM(proxy(url)).then((doc) => {
    const data = domJSON.toJSON(doc.documentElement, {
      domProperties: false
    });
    const container = document.getElementById('app');
    pg_d3_maze(container, data);
    // pg_3js(container, data);

  });

  console.log('Initialized app');
});

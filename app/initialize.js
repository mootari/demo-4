'use strict';

import * as domJSON from 'domjson';
import loadDOM from './modules/remote-dom';

import pg_d3_pie from './playgrounds/d3-pie';
import pg_d3_force from './playgrounds/d3-force';
import pg_3s from './playgrounds/three';

document.addEventListener('DOMContentLoaded', () => {

  const urls = {
    'ys': 'https://crossorigin.me/http://amazon.com',
    'bild': 'https://crossorigin.me/http://www.bild.de'
  };
  const url = urls['bild'];

  loadDOM(url).then((doc) => {
    const data = domJSON.toJSON(doc.documentElement, {
      domProperties: false
    });
    const container = document.getElementById('app');
    pg_d3_force(container, data);

  });

  console.log('Initialized app');
});

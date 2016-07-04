'use strict';

import * as domJSON from 'domjson';
import loadDOM from './modules/remote-dom';

import playgroundD3 from './playgrounds/d3';
import playground3s from './playgrounds/three';

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
    playgroundD3(container, data);
    // playground3s(container, data);

  });

  console.log('Initialized app');
});

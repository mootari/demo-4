'use strict';

/**
 * Returns the Document for a remote URL.
 *
 * @param url
 * @returns {Promise}
 */
const load = function(url) {
  return new Promise(function(resolve, reject) {
    var dom;

    // Load HTML from remote source.
    fetch(url)
      .then(function(html) {
        dom = parse(html);
        return resolve(dom);
      });
  });
};

/**
 * Retrieves HTML from a remote source.
 *
 * @param url
 * @returns {Promise}
 */
const fetch = function(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function() {
      resolve(this.responseText);
    });
    xhr.open('GET', url);
    xhr.send();
  });
};

/**
 * Parses HTML to Document.
 *
 * @param html
 * @returns {Document}
 */
const parse = function(html) {
  var parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
};

/**
 * Converts relative path references to absolute.
 *
 * @param {Document} doc
 * @param url
 */
const fixPaths = function(doc, url) {
  var tags = ['a', 'img'];
  var attributes = ['href', 'src'];
  var pattern = /^((https?:)?\/\/)|[a-z]+:]/;
  tags.forEach(function(tagName) {
    var tags = doc.getElementsByTagName(tagName), tag;
    for(var t = 0; t < tags.length; t++) {
      tag = tags[t];
      attributes.forEach(function(attrName) {
        if(tag[attrName] && !pattern.test(tag[attrName])) {
          tag[attrName] = url + tag[attrName];
        }
      });
    }
  });
};

export default load;

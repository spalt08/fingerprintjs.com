/*!
  * fingerprintjs.com index.js
  * Copyright 2019 https://fingerprintjs.com
  */
import * as $ from "jquery";
import "popper.js";
import "bootstrap";


$('[data-link]').on('click', (e) => {
  var selector = $(e.target).data('link');
  var el = $(selector).get(0);
  if (el && el.scrollIntoView) {
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth' });
  }
});
/*!
  * fingerprintjs.com index.js
  * Copyright 2019 https://fingerprintjs.com
  */
import * as $ from "jquery";
import "bootstrap";
import './lead-form';


$('[data-toggle=modal]').on('click', (e) => {
  var source = $(e.currentTarget).data("source");
  gtag("event", "contact-click", { event_category: "contact", event_label: source, branch: 'master' });
});

$('[data-link]').on('click', (e) => {
  var selector = $(e.target).data('link');
  var el = $(selector).get(0);
  if (el && el.scrollIntoView) {
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth' });
  }
});
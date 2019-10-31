/*!
  * fingerprintjs.com index.js
  * Copyright 2019 https://fingerprintjs.com
  */
import * as $ from "jquery";
import Vue from "vue";

$('[data-link]').on('click', (e) => {
  var selector = $(e.target).data('link');
  var el = $(selector).get(0);
  if (el && el.scrollIntoView) {
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth' });
  }
});

let app = new Vue({
  el: "#vue-wrapper",
  data: {
    leadMode: false,
    leadSubmitting: false,
    lead: {}
  },
  methods: {
    emailFormSubmit: function () {
      this.leadMode = true;
      gtag("event", "lead-submit", { event_category: "lead", event_label: "attempt" });
    },
    fullFormSubmit: function () {
      var payload = {
        email: this.lead.email,
        website: this.lead.website,
        name: this.lead.email
      };
      this.leadSubmitting = true;
      $.ajax({
        url: process.env.FPJS_LEAD_URL,
        type: 'post',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(payload)
      }).then((response: any) => {
        this.leadSubmitting = false;
        this.leadMode = false;
        if (response.errors && response.errors.length > 0) {
          gtag("event", "lead-submit", { event_category: "lead", event_label: "validation-fail" });
        } else {
          alert("Thanks, we received your request,\nwe'll get back to you soon.\n🚀");
          this.lead = {};
          gtag("event", "lead-submit", { event_category: "lead", event_label: "success" });
        }
      }).catch((e) => {
        this.leadSubmitting = false;
        this.leadMode = false;
        gtag("event", "lead-submit", { event_category: "lead", event_label: "error" });
        alert("🛑\nError occurred, contact us at: support@fingerprintjs.com");
      });
    }
  }
});

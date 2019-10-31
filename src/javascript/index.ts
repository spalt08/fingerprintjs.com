/*!
  * fingerprintjs.com index.js
  * Copyright 2019 https://fingerprintjs.com
  */
import * as $ from "jquery";
// this import is only necesssary to expand the navbar on mobile
// need to get rid of jQuery and bootstrap JS completely
import "bootstrap";
import Vue from "vue";

new Vue({
  el: "#vue-wrapper",
  data: {
    leadMode: false,
    leadSubmitting: false,
    lead: {}
  },
  methods: {
    scrollTo: (id: string, e: Event) => {
      let el = document.getElementById(id);
      if (el && el.scrollIntoView) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    startTrial: function () {
      this.leadMode = true;
      gtag("event", "lead-submit", {
        event_category: "lead",
        event_label: "attempt",
        branch: process.env.BRANCH
      });
    },
    emailFormSubmit: function () {
      this.leadMode = true;
      gtag("event", "lead-submit", {
        event_category: "lead",
        event_label: "attempt",
        branch: process.env.BRANCH
      });
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
          gtag("event", "lead-submit", { 
            event_category: "lead", 
            event_label: "validation-fail",
            branch: process.env.BRANCH
          });
        } else {
          alert("Thanks, we received your request,\nwe'll get back to you soon.\n🚀");
          this.lead = {};
          gtag("event", "lead-submit", { 
            event_category: "lead", 
            event_label: "success",
            branch: process.env.BRANCH
          });
        }
      }).catch((e) => {
        this.leadSubmitting = false;
        this.leadMode = false;
        gtag("event", "lead-submit", { 
          event_category: "lead", 
          event_label: "error",
          branch: process.env.BRANCH
        });
        alert("🛑\nError occurred, contact us at: support@fingerprintjs.com");
      });
    }
  }
});

import * as $ from "jquery";
import Vue from "vue";

const tiers = [
  [0, Number.MAX_SAFE_INTEGER, 1.0],
]
const numberFormatter = new Intl.NumberFormat();

const abbrSymbols = ["", "K", "M", "B", " trillion", " 😱"];

function abbreviateNumber(number: number): string | number {
  // what tier? (determines SI symbol)
  var tier = Math.log10(number) / 3 | 0;
  // if zero, we don't need a suffix
  if (tier == 0) return number;
  // get suffix and determine scale
  var suffix = abbrSymbols[tier];
  var scale = Math.pow(10, tier * 3);
  // scale the number
  var scaled = number / scale;
  // format number and add suffix
  return scaled + suffix;
}

let humanNumberInput = Vue.component("HumanNumberInput", {
  props: ["value"],
  template: `<input type="text" maxlength="20"
  id="calc-input"
  class="form-control form-control-lg"
  v-model="displayValue"
  />`,
  computed: {
    displayValue: {
      get: function () {
        return numberFormatter.format(this.value);
      },
      set: function (modifiedValue: any) {
        let newValue = parseInt(modifiedValue.replace(/[^\d\.]/g, ""))
        // Ensure that it is not NaN
        if (isNaN(newValue)) {
          newValue = 0
        }
        // Note: we cannot set this.value as it is a "prop". It needs to be passed to parent component
        // $emit the event so that parent component gets it
        this.$emit('input', newValue)
      }
    }
  }
});

let urlValueOrDefault = (defaultValue: number): number => {
  let urlParams = new URLSearchParams(window.location.search);
  let urlValueRaw = urlParams.get("v");
  if (urlValueRaw) {
    let urlValue = parseInt(urlValueRaw);
    if (isNaN(urlValue)) {
      return defaultValue;
    }
    return urlValue;
  }
  return defaultValue;
}

let urlDiscountOrDefault = (defaultValue = 0): number => {
  let urlParams = new URLSearchParams(window.location.search);
  let urlValueRaw = urlParams.get("d");
  if (urlValueRaw) {
    let urlValue = defaultValue;
    try {
      urlValue = parseInt(atob(urlValueRaw));
    } catch (e) {
      urlValue = defaultValue;
    }
    if (isNaN(urlValue)) {
      return defaultValue;
    }
    return urlValue;
  }
  return defaultValue;
}

let app = new Vue({
  el: "#calculator",
  data: {
    value: urlValueOrDefault(200_000),
    discount: urlDiscountOrDefault(0),
    leadMode: false,
    leadSubmitting: false,
    lead: {}
  },
  components: { humanNumberInput },
  methods: {
    valueAbbr: function () {
      return abbreviateNumber(this.value);
    },
    onDemand: function () {
      if (this.value <= 100_000) {
        return this.applyDiscount(100, this.discount);
      }
      let price = 0;
      let currentValue = this.value;
      for (let i = 0; i < tiers.length && currentValue > 0; i++) {
        let [_, tierMax, tierPrice] = tiers[i];
        price += Math.min(currentValue, tierMax) * tierPrice / 1000;
        currentValue -= tierMax;
      }
      return this.applyDiscount(price, this.discount);
    },
    onDemandFormatted: function () {
      return numberFormatter.format(Math.ceil(this.onDemand()));
    },
    reserved: function () {
      if (this.value <= 100_000) {
        return this.applyDiscount(100, this.discount + 20);
      }
      // reserved offers 20% discount
      return this.applyDiscount(this.onDemand(), this.discount + 20);
    },
    reservedFormatted: function () {
      return numberFormatter.format(Math.ceil(this.reserved()));
    },
    applyDiscount: function (amount: number, discount: number): number {
      if (discount > 0 && discount < 100) {
        return amount * (100 - discount) / 100;
      }
      return amount;
    },
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
          gtag("event", "lead-submit", {
            event_category: "lead",
            event_label: "validation-fail",
            branch: process.env.BRANCH
          });
        } else {
          alert("Thanks, we received your request,\nwe'll get back to you soon regarding your trial.\n🚀");
          this.lead = {};
          gtag("event", "lead-submit", {
            event_category: "lead",
            event_label: "success",
            branch: process.env.BRANCH
          });
        }
      }).catch(() => {
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
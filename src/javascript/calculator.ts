import Vue from "vue";

const SI_SYMBOL = ["", "K", "M", "B", " trillion", " 😱"];

const tiers = [
  [0, 1_000_000, 1.0],
  [1_000_000, 10_000_000, 0.7],
  [10_000_000, 50_000_000, 0.5],
  [50_000_000, 100_000_000, 0.4],
  [100_000_000, Number.MAX_SAFE_INTEGER, 0.35],
]
const numberFormatter = new Intl.NumberFormat();


function abbreviateNumber(number: number) {
  // what tier? (determines SI symbol)
  var tier = Math.log10(number) / 3 | 0;
  // if zero, we don't need a suffix
  if (tier == 0) return number;
  // get suffix and determine scale
  var suffix = SI_SYMBOL[tier];
  var scale = Math.pow(10, tier * 3);
  // scale the number
  var scaled = number / scale;
  // format number and add suffix
  return scaled + suffix;
}

let humanNumberInput = Vue.component("HumanNumberInput", {
  props: ["value"],
  template: `<input type="text" maxlength="20"
  class="form-control form-control-lg"
  style="color:black; font-weight: 700"
  v-model="displayValue"
  />`,
  computed: {
    displayValue: {
      get: function () {
        // User is not modifying now. Format display value for user interface
        return numberFormatter.format(this.value);
      },
      set: function (modifiedValue: any) {
        // Recalculate value after ignoring "$" and "," in user input
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

let app = new Vue({
  el: "#calculator",
  data: {
    value: 200_000
  },
  components: { humanNumberInput },
  methods: {
    valueAbbr: function () {
      return abbreviateNumber(this.value);
    },
    onDemand: function () {
      if (this.value <= 100_000) {
        return 100;
      }
      let price = 0;
      let currentValue = this.value;
      for (let i = 0; i < tiers.length && currentValue > 0; i++) {
        let [_, tierMax, tierPrice] = tiers[i];
        price += Math.min(currentValue, tierMax) * tierPrice / 1000;
        currentValue -= tierMax;
      }
      return price;
    },
    onDemandFormatted: function () {
      return numberFormatter.format(Math.ceil(this.onDemand()));
    },
    reserved: function () {
      if (this.value <= 100_000) {
        return 80;
      }
      let price = 0;
      for (let i = tiers.length - 1; i >= 0; i--) {
        let [tierMin, _, tierPrice] = tiers[i];
        if (this.value >= tierMin) {
          price = this.value * tierPrice / 1000;
          break;
        }
      }
      price *= 0.8; // reserved discount of 20%
      return price;
    },
    reservedFormatted: function () {
      return numberFormatter.format(Math.ceil(this.reserved()));
    }
  }
})
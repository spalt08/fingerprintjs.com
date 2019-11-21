import Vue from "vue";

const tiers = [
  [0, 1_000_000, 1.0],
  [1_000_000, 10_000_000, 0.7],
  [10_000_000, 50_000_000, 0.5],
  [50_000_000, 100_000_000, 0.4],
  [100_000_000, 1_000_000_000, 0.35],
  [1_000_000_000, 100_000_000_000, 0.3],
]
const numberFormatter = new Intl.NumberFormat();

Vue.component("HumanNumberInput", {
  props: ["value"],
  template: `<input type="text" 
  class="form-control form-control-lg"
  style="color:black; font-weight: 700"
  v-model="displayValue"
  @blur="isInputActive = false" @focus="isInputActive = true"
  />`,
  data: function () {
    return {
      isInputActive: false
    }
  },
  computed: {
    displayValue: {
      get: function () {
        if (this.isInputActive) {
          // Cursor is inside the input field. unformat display value for user
          return this.value.toString();
        } else {
          // User is not modifying now. Format display value for user interface
          return numberFormatter.format(this.value);
        }
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
  methods: {
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
      return numberFormatter.format(Math.ceil(price));
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
      return numberFormatter.format(Math.ceil(price));
    }
  }
})
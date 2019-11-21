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

// Vue.component('HumanNumberInput', {
//   props: {
//   	value: null,
//   },
//   template: `<input type="text" class="form-control form-control-lg"
//    style="color:black; font-weight: 700"
//    placeholder="Use K for thousands and M for millions" 
//    v-model="displayValue" 
//    @blur="handleInputState" 
//    @focus="handleInputState">`,
//   data: function() {
//     return {
//       inputFocused: false
//     }
//   },
//   methods: {
//   	handleInputState (event: any) {
//     	this.inputFocused = event.type === 'focus';
//     },
//     unmask (value) {
//       return 999;
//     },
//     mask (value) {
//     	return "$" + value;
//     },
//   },
//   computed: {
//     displayValue: {
//       get: function() {
//         if (this.inputFocused) {
//           return this.value.toString()
//         } else {
//           return this.mask(this.value)
//         }
//       },
//       set: function(modifiedValue) {        
//         this.$emit('input', this.unmask(modifiedValue))
//       }
//     }
//   }
// });

let app = new Vue({
  el: "#calculator",
  data: {
    value: 200000
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
      if(this.value <= 100_000) {
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
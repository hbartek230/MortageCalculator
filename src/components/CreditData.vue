<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2">
        Kwota kredytu (PLN)
      </label>
      <input
        :value="loanAmount"
        @input="$emit('update:loanAmount', Number($event.target.value))"
        type="number"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        step="1000"
      />
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2">
        Okres kredytowania
      </label>
      <select
        :value="years"
        @change="$emit('update:years', Number($event.target.value))"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }} lat</option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2">
        Marża banku (%)
      </label>
      <input
        :value="margin"
        @input="$emit('update:margin', Number($event.target.value))"
        type="number"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        step="0.1"
      />
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2">
        WIBOR 3M (%)
      </label>
      <input
        :value="wibor"
        @input="$emit('update:wibor', Number($event.target.value))"
        type="number"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        step="0.01"
      />
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2">
        Rodzaj rat
      </label>
      <select
        :value="rateType"
        @change="$emit('update:rateType', $event.target.value)"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="malejace">Malejące</option>
        <option value="stale">Stałe (annuitetowe)</option>
      </select>
    </div>

    <div class="flex items-end">
      <button
        @click="$emit('export')"
        class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
      >
        <slot name="export-icon">
          Eksportuj do CSV
        </slot>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loanAmount: Number,
  years: Number,
  margin: Number,
  wibor: Number,
  rateType: String
});

const yearOptions = [5,10,15,20,25,30,35];

defineEmits(["update:loanAmount", "update:years", "update:margin", "update:wibor", "update:rateType", "export"]);
</script>

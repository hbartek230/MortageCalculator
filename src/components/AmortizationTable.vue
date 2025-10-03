<template>
  <div class="bg-white rounded-lg shadow-lg overflow-hidden">
  <div class="overflow-x-auto table-scroll">
      <table class="w-full text-sm">
        <thead class="bg-gray-800 text-white sticky top-0">
          <tr>
            <th class="px-4 py-3 text-left">Lp.</th>
            <th class="px-4 py-3 text-left">Nr raty</th>
            <th class="px-4 py-3 text-right">Rata miesięczna</th>
            <th class="px-4 py-3 text-right">Rata kapitałowa</th>
            <th class="px-4 py-3 text-right">Rata odsetkowa</th>
            <th class="px-4 py-3 text-right">Kapitał pozostały</th>
            <th v-if="overpaymentEnabled" class="px-4 py-3 text-right bg-green-700">Nadpłata</th>
          </tr>
        </thead>
        <tbody>
          <AmortizationRow
            v-for="row in schedule"
            :key="row.lp"
            :row="row"
            :overpaymentEnabled="overpaymentEnabled"
            :formatCurrency="formatCurrency"
          />

          <tr class="bg-blue-100 font-bold">
            <td class="px-4 py-3 border-t-2 border-gray-800" colspan="2">SUMA</td>
            <td class="px-4 py-3 border-t-2 border-gray-800 text-right">{{ formatCurrency(totals.totalMonthlyPayments) }}</td>
            <td class="px-4 py-3 border-t-2 border-gray-800 text-right">{{ formatCurrency(totals.totalPrincipalPayments) }}</td>
            <td class="px-4 py-3 border-t-2 border-gray-800 text-right">{{ formatCurrency(totals.totalInterestPayments) }}</td>
            <td class="px-4 py-3 border-t-2 border-gray-800"></td>
            <td v-if="overpaymentEnabled" class="px-4 py-3 border-t-2 border-gray-800 text-right bg-green-100">{{ formatCurrency(totals.totalOverpayments) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import AmortizationRow from './AmortizationRow.vue';

defineProps({
  schedule: Array,
  totals: Object,
  overpaymentEnabled: Boolean,
  formatCurrency: Function
});
</script>

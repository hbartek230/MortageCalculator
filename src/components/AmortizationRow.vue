<template>
  <tr :class="index % 2 === 0 ? 'bg-gray-50' : 'bg-white'">
    <td class="px-4 py-2 border-b">{{ row.lp }}</td>
    <td class="px-4 py-2 border-b">{{ row.month }}</td>
    <td class="px-4 py-2 border-b text-right font-semibold">{{ formatCurrency(row.monthlyPayment) }}</td>
    <td class="px-4 py-2 border-b text-right">{{ formatCurrency(row.principalPayment) }}</td>
    <td class="px-4 py-2 border-b text-right">{{ formatCurrency(row.interestPayment) }}</td>
    <td class="px-4 py-2 border-b text-right text-gray-600">{{ formatCurrency(row.remainingPrincipal) }}</td>
    <td v-if="overpaymentEnabled" class="px-4 py-2 border-b text-right font-semibold text-green-700">{{ row.overpayment > 0 ? formatCurrency(row.overpayment) : '-' }}</td>
  </tr>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
  row: Object,
  index: Number,
  overpaymentEnabled: Boolean,
  formatCurrency: Function
});
</script>

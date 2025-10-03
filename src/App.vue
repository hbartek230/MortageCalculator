<template>
  <div class="w-full max-w-7xl mx-auto p-6 bg-gray-50">
    <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Kalkulator Kredytu Hipotecznego</h1>
      
      <CreditData
        v-model:loanAmount="loanAmount"
        v-model:years="loanYears"
        v-model:margin="margin"
        v-model:wibor="wibor"
        v-model:rateType="rateType"
        @export="exportToCSV"
      >
        <template #export-icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Eksportuj do CSV
        </template>
      </CreditData>

      <Overpayments
        :overpaymentEnabled="overpaymentEnabled"
        :overpaymentEffect="overpaymentEffect"
        :overpaymentType="overpaymentType"
        :overpaymentAmount="overpaymentAmount"
        @update:overpaymentEnabled="val => overpaymentEnabled = val"
        @update:overpaymentEffect="val => overpaymentEffect = val"
        @update:overpaymentType="val => overpaymentType = val"
        @update:overpaymentAmount="val => overpaymentAmount = val"
      />

      <div class="bg-blue-50 p-4 rounded-lg mb-6 mt-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <p class="text-sm text-gray-600">Oprocentowanie roczne</p>
            <p class="text-2xl font-bold text-blue-700">
              {{ (margin + wibor).toFixed(2) }}%
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Całkowity koszt kredytu</p>
            <p class="text-2xl font-bold text-blue-700">
              {{ formatCurrency(calculatedData.totals.totalMonthlyPayments) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Suma odsetek</p>
            <p class="text-2xl font-bold text-blue-700">
              {{ formatCurrency(calculatedData.totals.totalInterestPayments) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Liczba rat</p>
            <p class="text-2xl font-bold text-blue-700">
              {{ calculatedData.schedule.length }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="overpaymentEnabled && calculatedData.savings > 0" class="bg-green-100 border-2 border-green-500 p-4 rounded-lg mb-6">
        <div class="flex items-center gap-3 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-700">
            <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
            <polyline points="16 17 22 17 22 11"></polyline>
          </svg>
          <h3 class="text-xl font-bold text-green-800">Korzyści z nadpłat</h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p class="text-sm text-gray-700 font-semibold">Oszczędność na odsetkach</p>
            <p class="text-3xl font-bold text-green-700">
              {{ formatCurrency(calculatedData.savings) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-700 font-semibold">Odsetki bez nadpłat</p>
            <p class="text-2xl font-bold text-gray-600">
              {{ formatCurrency(calculatedData.baseTotals.totalInterestPayments) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-700 font-semibold">
              {{ overpaymentEffect === 'skrocenie' ? 'Skrócenie o' : 'Nowa liczba rat' }}
            </p>
            <p class="text-2xl font-bold text-green-700">
              {{ overpaymentEffect === 'skrocenie' 
                ? `${calculatedData.monthsSaved} ${getMonthsLabel(calculatedData.monthsSaved)}`
                : `${calculatedData.schedule.length} rat`
              }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <AmortizationTable
      :schedule="calculatedData.schedule"
      :totals="calculatedData.totals"
      :overpaymentEnabled="overpaymentEnabled"
      :formatCurrency="formatCurrency"
    />

    <div class="mt-4 text-sm text-gray-600 text-center">
      <p>Kalkulator ma charakter orientacyjny. Rzeczywiste warunki kredytu mogą się różnić.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import CreditData from './components/CreditData.vue';
import Overpayments from './components/Overpayments.vue';
import AmortizationTable from './components/AmortizationTable.vue';
import { useLoanCalculator } from './composables/useLoanCalculator';

const loanAmount = ref(300000);
const loanYears = ref(25); // default 25 years
const loanPeriodMonths = computed(() => loanYears.value * 12);
const margin = ref(2.5);
const wibor = ref(5.85);
const rateType = ref('malejace');

const overpaymentEnabled = ref(false);
const overpaymentEffect = ref('skrocenie');
const overpaymentType = ref('kwota_nadplaty');
const overpaymentAmount = ref(500);

// use composable for calculations
const { calculatedData } = useLoanCalculator({
  loanAmount,
  loanPeriodMonths,
  margin,
  wibor,
  rateType,
  overpaymentEnabled,
  overpaymentEffect,
  overpaymentType,
  overpaymentAmount
});

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2
  }).format(value);
};

const getMonthsLabel = (months) => {
  const rules = new Intl.PluralRules('pl-PL');
  switch (rules.select(months)) {
    case 'one':
      return 'miesiąc';
    case 'few':
      return 'miesiące';
    default:
      return 'miesięcy';
  }
};

const exportToCSV = () => {
  const { schedule, totals } = calculatedData.value;
  let csv = 'Lp.;Nr raty;Rata miesięczna;Rata kapitałowa;Rata odsetkowa;Kapitał pozostały;Nadpłata\n';
  
  schedule.forEach(row => {
    csv += `${row.lp};${row.month};${row.monthlyPayment.toFixed(2)};${row.principalPayment.toFixed(2)};${row.interestPayment.toFixed(2)};${row.remainingPrincipal.toFixed(2)};${row.overpayment.toFixed(2)}\n`;
  });
  
  csv += `\nSUMA;;${totals.totalMonthlyPayments.toFixed(2)};${totals.totalPrincipalPayments.toFixed(2)};${totals.totalInterestPayments.toFixed(2)};;${totals.totalOverpayments.toFixed(2)}\n`;
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = 'harmonogram_kredytu.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
</script>
<template>
  <div>
    <div class="border-t-2 border-gray-200 pt-6 mt-6">
      <div class="flex items-center mb-4">
        <input
          :checked="overpaymentEnabled"
          @change="$emit('update:overpaymentEnabled', $event.target.checked)"
          type="checkbox"
          id="overpayment-enabled"
          class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label for="overpayment-enabled" class="ml-3 text-lg font-semibold text-gray-800 flex items-center gap-2">
          <slot name="label">Uwzględnij nadpłaty</slot>
        </label>
      </div>

      <div v-if="overpaymentEnabled" class="grid grid-cols-1 md:grid-cols-3 gap-6 bg-green-50 p-4 rounded-lg">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Efekt nadpłaty
          </label>
          <select
            :value="overpaymentEffect"
            @change="$emit('update:overpaymentEffect', $event.target.value)"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="skrocenie">Skrócenie okresu kredytowania</option>
            <option value="zmniejszenie">Zmniejszenie raty</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Typ nadpłaty
          </label>
          <select
            :value="overpaymentType"
            @change="$emit('update:overpaymentType', $event.target.value)"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="kwota_nadplaty">Stała kwota nadpłaty miesięcznej</option>
            <option value="calkowita_rata">Stała kwota całkowitej raty</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            {{ overpaymentType === 'kwota_nadplaty' ? 'Kwota nadpłaty (PLN)' : 'Kwota raty całkowitej (PLN)' }}
          </label>
          <input
            :value="overpaymentAmount"
            @input="$emit('update:overpaymentAmount', Number($event.target.value))"
            type="number"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            step="100"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  overpaymentEnabled: Boolean,
  overpaymentEffect: String,
  overpaymentType: String,
  overpaymentAmount: Number
});

defineEmits([
  'update:overpaymentEnabled',
  'update:overpaymentEffect',
  'update:overpaymentType',
  'update:overpaymentAmount'
]);
</script>

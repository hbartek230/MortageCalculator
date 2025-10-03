import Decimal from 'decimal.js';

export const toDecimal = (v) => new Decimal(v || 0);

export const toNumberFixed = (dec, places = 2) => Number(new Decimal(dec).toFixed(places));

export const maxZero = (dec) => Decimal.max(new Decimal(0), new Decimal(dec));

export const calcAnnuityPayment = (principalDecimal, monthlyRate, months) => {
  if (months <= 0) return new Decimal(0);
  const onePlus = monthlyRate.plus(1);
  const pow = onePlus.pow(months);
  return principalDecimal.times(monthlyRate.times(pow)).dividedBy(pow.minus(1));
};

export const recalcAnnuity = (remainingPrincipal, monthlyRate, remainingMonths) => {
  return calcAnnuityPayment(remainingPrincipal, monthlyRate, Math.max(1, remainingMonths));
};

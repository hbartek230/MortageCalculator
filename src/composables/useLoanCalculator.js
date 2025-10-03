import { computed } from 'vue';
import Decimal from 'decimal.js';
import {
  toDecimal,
  toNumberFixed,
  maxZero,
  calcAnnuityPayment,
  recalcAnnuity
} from './loanCalculatorHelpers';

export function useLoanCalculator({
  loanAmount,
  loanPeriodMonths,
  margin,
  wibor,
  rateType,
  overpaymentEnabled,
  overpaymentEffect,
  overpaymentType,
  overpaymentAmount
}) {
  const calculatedData = computed(() => {
  const principal = new Decimal(loanAmount.value);
  const months = Number(loanPeriodMonths.value);
  const annualRate = new Decimal(margin.value).plus(new Decimal(wibor.value)).dividedBy(100);
  const monthlyRate = annualRate.dividedBy(12);

  if (!months || months === 0) {
      return {
        schedule: [],
        totals: {
          totalMonthlyPayments: 0,
          totalPrincipalPayments: 0,
          totalInterestPayments: 0,
          totalOverpayments: 0
        },
        baseTotals: {
          totalMonthlyPayments: 0,
          totalPrincipalPayments: 0,
          totalInterestPayments: 0
        },
        savings: 0,
        monthsSaved: 0
      };
    }

      const calculateBaseSchedule = () => {
        const schedule = [];
        let remainingPrincipal = toDecimal(principal);

        if (rateType.value === 'stale') {
          const monthlyPayment = calcAnnuityPayment(remainingPrincipal, monthlyRate, months);

          for (let i = 1; i <= months; i++) {
            const interestPayment = remainingPrincipal.times(monthlyRate);
            const principalPayment = monthlyPayment.minus(interestPayment);
            remainingPrincipal = remainingPrincipal.minus(principalPayment);

            schedule.push({
              lp: i,
              month: i,
              monthlyPayment: toNumberFixed(monthlyPayment),
              principalPayment: toNumberFixed(principalPayment),
              interestPayment: toNumberFixed(interestPayment),
              remainingPrincipal: toNumberFixed(maxZero(remainingPrincipal)),
              overpayment: 0
            });
          }
        } else {
          const principalPayment = toDecimal(principal).dividedBy(months);

          for (let i = 1; i <= months; i++) {
            const interestPayment = remainingPrincipal.times(monthlyRate);
            const monthlyPayment = principalPayment.plus(interestPayment);
            remainingPrincipal = remainingPrincipal.minus(principalPayment);

            schedule.push({
              lp: i,
              month: i,
              monthlyPayment: toNumberFixed(monthlyPayment),
              principalPayment: toNumberFixed(principalPayment),
              interestPayment: toNumberFixed(interestPayment),
              remainingPrincipal: toNumberFixed(maxZero(remainingPrincipal)),
              overpayment: 0
            });
          }
        }

        return schedule;
      };

    const calculateScheduleWithOverpayment = (baseSchedule) => {
  const schedule = [];
  let remainingPrincipal = toDecimal(principal);
  let currentMonth = 1;
  const overpayment = toDecimal(overpaymentAmount.value || 0);

  let currentAnnuityPayment = rateType.value === 'stale' ? (baseSchedule[0] && baseSchedule[0].monthlyPayment) : null;
  let currentDecliningPrincipal = rateType.value !== 'stale' ? Number(principal.dividedBy(months)) : null;

  // compute one month's payment and state updates in a single place
  const computeMonthPayment = ({
    remainingPrincipal,
    monthlyRate,
    currentAnnuityPayment,
    currentDecliningPrincipal,
    currentMonth,
    months,
    rateType,
    overpaymentEffect,
    overpaymentType,
    overpayment
  }) => {
    const interestPayment = remainingPrincipal.times(monthlyRate);
    let principalPayment = new Decimal(0);
    let monthlyPayment = new Decimal(0);
    let actualOverpayment = new Decimal(0);
    let nextAnnuity = currentAnnuityPayment;
    let nextDeclining = currentDecliningPrincipal;
    let preSubtractedOverpayment = false; 

    const baseMonthlyPayment = new Decimal(currentAnnuityPayment || (baseSchedule[0] && baseSchedule[0].monthlyPayment) || 0);
    const basePrincipalPayment = baseMonthlyPayment.minus(interestPayment);

    if (rateType === 'stale') {
      if (overpaymentEffect === 'skrocenie') {
        if (overpaymentType === 'kwota_nadplaty') {
          actualOverpayment = Decimal.min(overpayment, Decimal.max(new Decimal(0), remainingPrincipal.minus(basePrincipalPayment)));
          principalPayment = basePrincipalPayment.plus(actualOverpayment);
          monthlyPayment = baseMonthlyPayment.plus(actualOverpayment);
        } else {
          monthlyPayment = Decimal.min(overpayment, remainingPrincipal.plus(interestPayment));
          principalPayment = monthlyPayment.minus(interestPayment);
          actualOverpayment = principalPayment.minus(basePrincipalPayment);
        }
      } else {
        // zmniejszenie
        if (overpaymentType === 'kwota_nadplaty') {
          actualOverpayment = Decimal.min(overpayment, remainingPrincipal);
          principalPayment = basePrincipalPayment.plus(actualOverpayment);
          monthlyPayment = baseMonthlyPayment.plus(actualOverpayment);
          // we will treat this as pre-subtracted: caller should reduce remainingPrincipal by actualOverpayment before scheduled part
          preSubtractedOverpayment = true;

          const remainingMonths = Math.max(1, months - currentMonth + 1);
          if (remainingPrincipal.minus(actualOverpayment).greaterThan(0)) {
            const newMonthly = recalcAnnuity(remainingPrincipal.minus(actualOverpayment), monthlyRate, remainingMonths);
            nextAnnuity = Number(newMonthly.toFixed(2));
          } else {
            nextAnnuity = 0;
          }
        } else {
          monthlyPayment = Decimal.min(overpayment, remainingPrincipal.plus(interestPayment));
          principalPayment = monthlyPayment.minus(interestPayment);
          actualOverpayment = Decimal.max(new Decimal(0), principalPayment.minus(basePrincipalPayment));
        }
      }
    } else {
      // malejace
      const basePrincipalPayment = new Decimal(currentDecliningPrincipal !== null ? currentDecliningPrincipal : principal.dividedBy(months));
      if (overpaymentEffect === 'skrocenie') {
        if (overpaymentType === 'kwota_nadplaty') {
          actualOverpayment = Decimal.min(overpayment, Decimal.max(new Decimal(0), remainingPrincipal.minus(basePrincipalPayment)));
          principalPayment = basePrincipalPayment.plus(actualOverpayment);
          monthlyPayment = principalPayment.plus(interestPayment);
        } else {
          monthlyPayment = Decimal.min(overpayment, remainingPrincipal.plus(interestPayment));
          principalPayment = monthlyPayment.minus(interestPayment);
          actualOverpayment = principalPayment.minus(basePrincipalPayment);
        }
      } else {
        if (overpaymentType === 'kwota_nadplaty') {
          actualOverpayment = Decimal.min(overpayment, remainingPrincipal);
          principalPayment = basePrincipalPayment.plus(actualOverpayment);
          monthlyPayment = principalPayment.plus(interestPayment);
          preSubtractedOverpayment = true;
          const remainingMonths = Math.max(1, months - currentMonth + 1);
          nextDeclining = Number(remainingPrincipal.minus(actualOverpayment).dividedBy(remainingMonths));
        } else {
          monthlyPayment = Decimal.min(overpayment, remainingPrincipal.plus(interestPayment));
          principalPayment = monthlyPayment.minus(interestPayment);
          actualOverpayment = Decimal.max(new Decimal(0), principalPayment.minus(basePrincipalPayment));
        }
      }
    }

    return {
      monthlyPayment,
      principalPayment,
      interestPayment,
      actualOverpayment,
      preSubtractedOverpayment,
      nextAnnuity,
      nextDeclining
    };
  };

  while (remainingPrincipal.greaterThan(0.01) && currentMonth <= months * 2) {
    const {
      monthlyPayment,
      principalPayment,
      interestPayment,
      actualOverpayment,
      preSubtractedOverpayment,
      nextAnnuity,
      nextDeclining
    } = computeMonthPayment({
      remainingPrincipal,
      monthlyRate,
      currentAnnuityPayment,
      currentDecliningPrincipal,
      currentMonth,
      months,
      rateType: rateType.value,
      overpaymentEffect: overpaymentEffect.value,
      overpaymentType: overpaymentType.value,
      overpayment
    });

    // update state
    if (nextAnnuity !== undefined) currentAnnuityPayment = nextAnnuity;
    if (nextDeclining !== undefined) currentDecliningPrincipal = nextDeclining;

    if (preSubtractedOverpayment) {
      // actualOverpayment already meant to be subtracted from remainingPrincipal
      remainingPrincipal = remainingPrincipal.minus(actualOverpayment);
      const scheduledPart = Decimal.max(new Decimal(0), principalPayment.minus(actualOverpayment));
      remainingPrincipal = remainingPrincipal.minus(scheduledPart);
    } else {
      remainingPrincipal = remainingPrincipal.minus(principalPayment);
    }

    schedule.push({
      lp: currentMonth,
      month: currentMonth,
      monthlyPayment: toNumberFixed(monthlyPayment),
      principalPayment: toNumberFixed(principalPayment),
      interestPayment: toNumberFixed(interestPayment),
      remainingPrincipal: toNumberFixed(maxZero(remainingPrincipal)),
      overpayment: toNumberFixed(actualOverpayment)
    });

    currentMonth++;
    if (remainingPrincipal.lessThanOrEqualTo(0.01)) break;
  }

  return schedule;
};

    const baseSchedule = calculateBaseSchedule();
    const finalSchedule = overpaymentEnabled.value ? calculateScheduleWithOverpayment(baseSchedule) : baseSchedule;

    const baseTotals = {
      totalMonthlyPayments: baseSchedule.reduce((sum, row) => sum + row.monthlyPayment, 0),
      totalPrincipalPayments: baseSchedule.reduce((sum, row) => sum + row.principalPayment, 0),
      totalInterestPayments: baseSchedule.reduce((sum, row) => sum + row.interestPayment, 0)
    };

    const finalTotals = {
      totalMonthlyPayments: finalSchedule.reduce((sum, row) => sum + row.monthlyPayment, 0),
      totalPrincipalPayments: finalSchedule.reduce((sum, row) => sum + row.principalPayment, 0),
      totalInterestPayments: finalSchedule.reduce((sum, row) => sum + row.interestPayment, 0),
      totalOverpayments: finalSchedule.reduce((sum, row) => sum + row.overpayment, 0)
    };

    const savings = baseTotals.totalInterestPayments - finalTotals.totalInterestPayments;

    return {
      schedule: finalSchedule,
      totals: finalTotals,
      baseTotals,
      savings,
      monthsSaved: baseSchedule.length - finalSchedule.length
    };
  });

  return { calculatedData };
}

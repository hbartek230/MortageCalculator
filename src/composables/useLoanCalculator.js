import { computed } from 'vue';

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
    const principal = loanAmount.value;
    const months = loanPeriodMonths.value;
    const annualRate = (margin.value + wibor.value) / 100;
    const monthlyRate = annualRate / 12;

    const calculateBaseSchedule = () => {
      const schedule = [];
      let remainingPrincipal = principal;

      if (rateType.value === 'stale') {
        const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                              (Math.pow(1 + monthlyRate, months) - 1);

        for (let i = 1; i <= months; i++) {
          const interestPayment = remainingPrincipal * monthlyRate;
          const principalPayment = monthlyPayment - interestPayment;
          remainingPrincipal -= principalPayment;

          schedule.push({
            lp: i,
            month: i,
            monthlyPayment: monthlyPayment,
            principalPayment: principalPayment,
            interestPayment: interestPayment,
            remainingPrincipal: Math.max(0, remainingPrincipal),
            overpayment: 0
          });
        }
      } else {
        const principalPayment = principal / months;

        for (let i = 1; i <= months; i++) {
          const interestPayment = remainingPrincipal * monthlyRate;
          const monthlyPayment = principalPayment + interestPayment;
          remainingPrincipal -= principalPayment;

          schedule.push({
            lp: i,
            month: i,
            monthlyPayment: monthlyPayment,
            principalPayment: principalPayment,
            interestPayment: interestPayment,
            remainingPrincipal: Math.max(0, remainingPrincipal),
            overpayment: 0
          });
        }
      }

      return schedule;
    };

    const calculateScheduleWithOverpayment = (baseSchedule) => {
      const schedule = [];
      let remainingPrincipal = principal;
      let currentMonth = 1;
      const overpayment = overpaymentAmount.value;

      while (remainingPrincipal > 0.01 && currentMonth <= months * 2) {
        const interestPayment = remainingPrincipal * monthlyRate;
        let principalPayment;
        let monthlyPayment;
        let actualOverpayment = 0;

        if (rateType.value === 'stale') {
          if (overpaymentEffect.value === 'skrocenie') {
            const baseMonthlyPayment = baseSchedule[0].monthlyPayment;
            principalPayment = baseMonthlyPayment - interestPayment;
            
            if (overpaymentType.value === 'kwota_nadplaty') {
              actualOverpayment = Math.min(overpayment, remainingPrincipal - principalPayment);
              principalPayment += actualOverpayment;
              monthlyPayment = baseMonthlyPayment + actualOverpayment;
            } else {
              const targetTotalPayment = overpayment;
              monthlyPayment = Math.min(targetTotalPayment, remainingPrincipal + interestPayment);
              principalPayment = monthlyPayment - interestPayment;
              actualOverpayment = principalPayment - (baseMonthlyPayment - interestPayment);
            }
          } else {
            if (overpaymentType.value === 'kwota_nadplaty') {
              actualOverpayment = Math.min(overpayment, remainingPrincipal);
              remainingPrincipal -= actualOverpayment;
              
              const remainingMonths = months - currentMonth + 1;
              const newMonthlyPayment = remainingPrincipal * (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / 
                                       (Math.pow(1 + monthlyRate, remainingMonths) - 1);
              
              const newInterestPayment = remainingPrincipal * monthlyRate;
              principalPayment = newMonthlyPayment - newInterestPayment;
              monthlyPayment = newMonthlyPayment;
              
              schedule.push({
                lp: currentMonth,
                month: currentMonth,
                monthlyPayment: actualOverpayment,
                principalPayment: actualOverpayment,
                interestPayment: 0,
                remainingPrincipal: remainingPrincipal,
                overpayment: actualOverpayment
              });
              
              currentMonth++;
              continue;
            } else {
              monthlyPayment = Math.min(overpayment, remainingPrincipal + interestPayment);
              principalPayment = monthlyPayment - interestPayment;
              actualOverpayment = 0;
            }
          }
        } else {
          const basePrincipalPayment = principal / months;
          
          if (overpaymentEffect.value === 'skrocenie') {
            principalPayment = basePrincipalPayment;
            
            if (overpaymentType.value === 'kwota_nadplaty') {
              actualOverpayment = Math.min(overpayment, remainingPrincipal - principalPayment);
              principalPayment += actualOverpayment;
              monthlyPayment = principalPayment + interestPayment;
            } else {
              const targetTotalPayment = overpayment;
              monthlyPayment = Math.min(targetTotalPayment, remainingPrincipal + interestPayment);
              principalPayment = monthlyPayment - interestPayment;
              actualOverpayment = principalPayment - basePrincipalPayment;
            }
          } else {
            if (overpaymentType.value === 'kwota_nadplaty') {
              actualOverpayment = Math.min(overpayment, remainingPrincipal);
              remainingPrincipal -= actualOverpayment;
              
              const remainingMonths = months - currentMonth + 1;
              principalPayment = remainingPrincipal / remainingMonths;
              monthlyPayment = principalPayment + (remainingPrincipal * monthlyRate);
              
              schedule.push({
                lp: currentMonth,
                month: currentMonth,
                monthlyPayment: actualOverpayment,
                principalPayment: actualOverpayment,
                interestPayment: 0,
                remainingPrincipal: remainingPrincipal,
                overpayment: actualOverpayment
              });
              
              currentMonth++;
              continue;
            } else {
              monthlyPayment = Math.min(overpayment, remainingPrincipal + interestPayment);
              principalPayment = monthlyPayment - interestPayment;
              actualOverpayment = 0;
            }
          }
        }

        remainingPrincipal -= principalPayment;

        schedule.push({
          lp: currentMonth,
          month: currentMonth,
          monthlyPayment: monthlyPayment,
          principalPayment: principalPayment,
          interestPayment: interestPayment,
          remainingPrincipal: Math.max(0, remainingPrincipal),
          overpayment: actualOverpayment
        });

        currentMonth++;

        if (remainingPrincipal < 0.01) break;
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

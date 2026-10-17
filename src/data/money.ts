import type { Job, PaymentStage } from "./types";

export const PAYMENT_STAGES: PaymentStage[] = ["Not quoted", "Quoted", "Deposit paid", "Paid"];

export const CURRENCIES = ["USD", "CAD", "GBP", "EUR", "AUD", "NGN"];

export function formatMoney(amount: number, currency: string) {
  const digits = Number.isInteger(amount) ? 0 : 2;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(digits)}`;
  }
}

export function paymentStage(job: Job): PaymentStage {
  if (job.paidAt) return "Paid";
  if (job.deposit.receivedAt) return "Deposit paid";
  if (job.quote.sentAt) return "Quoted";
  return "Not quoted";
}

function depositCollected(job: Job) {
  return job.deposit.receivedAt ? job.deposit.amount : 0;
}

export function amountCollected(job: Job) {
  return job.paidAt ? Math.max(job.quote.amount, depositCollected(job)) : depositCollected(job);
}

/** What the client still owes. Jobs that haven't been quoted owe nothing yet. */
export function jobBalance(job: Job) {
  if (job.paidAt || paymentStage(job) === "Not quoted") return 0;
  return Math.max(0, job.quote.amount - depositCollected(job));
}

export function clientTotals(jobs: Job[]) {
  return jobs.reduce(
    (totals, job) => ({
      quoted: totals.quoted + (paymentStage(job) === "Not quoted" ? 0 : job.quote.amount),
      collected: totals.collected + amountCollected(job),
      outstanding: totals.outstanding + jobBalance(job),
      jobCount: totals.jobCount + 1,
    }),
    { quoted: 0, collected: 0, outstanding: 0, jobCount: 0 },
  );
}


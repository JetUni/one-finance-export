import { writeFileSync } from 'fs';
import { BalanceHistory } from '../../models/balance-history.interface';
import { Pocket } from '../../models/pockets.interface';
import { Transaction } from '../../models/transactions.interface';

export function saveTransactionsCsv(pockets: Pocket[], transactions: Transaction[]) {
  const headers =
    'Date,Description,Category,Amount,Account,Account #,Institution,Transaction ID,Account ID,Metadata,Note';
  const pocketIdMap = pockets.reduce<Record<string, Pocket>>((acc, pocket) => {
    acc[pocket.pocket_id] = pocket;
    return acc;
  }, {});
  const rows = transactions.map((transaction) => {
    const pocket = pocketIdMap[transaction.pocket_id];
    const { account_number, name } = pocket;
    const { amount, comment, date, description, is_debit, trn_id, user_transaction_date } = transaction;
    const localDate = new Date(user_transaction_date || date).toLocaleDateString('sv-SE');
    return `${localDate},"${description}",,${is_debit ? amount * -1 : amount},${name},xxxx${account_number.slice(
      -4
    )},One Finance,${trn_id},${account_number.slice(-4)},"{'one_finance': 'https://github.com/JetUni/one-finance'}",${
      comment || ''
    }`;
  });

  writeFileSync('./output/transactions.csv', [headers, ...rows].join('\n'), { encoding: 'utf-8' });
}

export function saveBalanceHistoryCsv(balanceHistory: BalanceHistory[]) {
  const headers = 'Date,Time,Account,Account #,Account ID,Balance ID,Institution,Balance,Type,Class,Account Status';
  const rows = balanceHistory.map((history) => {
    const { date, time, accountName, accountNumber, accountId, balanceId, balance, type, status } = history;
    return `${date},${time},${accountName},${accountNumber},${accountId},${balanceId},One Finance,${balance},${type},Asset,${status}`;
  });

  writeFileSync('./output/balance-history.csv', [headers, ...rows].join('\n'), { encoding: 'utf-8' });
}

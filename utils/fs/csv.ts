import { writeFileSync } from 'fs';
import { BalanceHistory } from '../../models/balance-history.interface';
import { Pocket } from '../../models/pockets.interface';
import { Transaction } from '../../models/transactions.interface';

export function saveTransactionsCsv(pockets: Pocket[], transactions: Transaction[]) {
  const headers =
    'Date,Description,Category,Amount,Account,Account #,Institution,Month,Week,Transaction ID,Account ID,Check Number,Full Description,Date Added,Metadata,Categorized Date,Note';
  const now = new Date().toLocaleDateString();

  const pocketIdMap = pockets.reduce<Record<string, Pocket>>((acc, pocket) => {
    acc[pocket.pocket_id] = pocket;
    return acc;
  }, {});
  const rows = transactions.map((transaction) => {
    const pocket = pocketIdMap[transaction.pocket_id];
    const { account_number, name, pocket_id } = pocket;
    const { amount, category, comment, date, description, is_debit, trn_id, user_transaction_date } = transaction;
    const localDate = new Date(user_transaction_date || date).toLocaleDateString('sv-SE');
    const weekDateTime = new Date(`${localDate} 00:00:00 AM`);
    weekDateTime.setDate(weekDateTime.getDate() - weekDateTime.getDay());
    const monthDateTime = new Date(`${localDate} 00:00:00 AM`);
    monthDateTime.setDate(1);

    return `${localDate},"${description}",${category},${
      is_debit ? amount * -1 : amount
    },${name},xxxx${account_number.slice(
      -4
    )},One Finance,${monthDateTime.toLocaleDateString()},${weekDateTime.toLocaleDateString()},${trn_id},${
      pocket_id.split('.')[1]
    },,"${description}",${now},"{""one-finance-export"":{""type"":""transaction"",""website"":""https://github.com/JetUni/one-finance-export""}}",,"${
      comment || ''
    }"`;
  });

  writeFileSync('./output/transactions.csv', [headers, ...rows].join('\n'), { encoding: 'utf-8' });
}

export function saveBalanceHistoryCsv(balanceHistory: BalanceHistory[]) {
  const headers =
    'Date,Time,Account,Account #,Account ID,Balance ID,Institution,Balance,Month,Week,Type,Class,Account Status,Date Added';
  const now = new Date().toLocaleDateString();

  const rows = balanceHistory.map((history) => {
    const { date, time, accountName, accountNumber, accountId, balanceId, balance, type, status } = history;
    const weekDateTime = new Date(`${date} 00:00:00 AM`);
    weekDateTime.setDate(weekDateTime.getDate() - weekDateTime.getDay());
    const monthDateTime = new Date(`${date} 00:00:00 AM`);
    monthDateTime.setDate(1);

    return `${date},${time},${accountName},${accountNumber},${accountId},${balanceId},One Finance,${
      balance / 100
    },${monthDateTime.toLocaleDateString()},${weekDateTime.toLocaleDateString()},${type},Asset,${status},${now}`;
  });

  writeFileSync('./output/balance-history.csv', [headers, ...rows].join('\n'), { encoding: 'utf-8' });
}

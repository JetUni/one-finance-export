import { loadUserSession, token, userId } from './api/auth';
import { fetchPockets } from './api/pockets';
import { fetchAllTransactions, transactionsCompareFn } from './api/transactions';
import { BalanceHistory } from './models/balance-history.interface';
import { Transaction } from './models/transactions.interface';
import { balanceHistoryCompareFn, generatePocketBalanceHistory } from './utils/balance-history';
import { saveBalanceHistoryCsv, saveTransactionsCsv } from './utils/fs/csv';

async function main() {
  // Try to restore the session saved to the file
  await loadUserSession();

  if (userId && token) {
    const pockets = await fetchPockets(userId, token);
    const now = new Date();
    const transactions: Transaction[] = [];
    const balanceHistory: BalanceHistory[] = [];

    for (const pocket of pockets) {
      console.log('fetching transactions for pocket', pocket.name);
      const transactionsForPocket = await fetchAllTransactions(pocket.pocket_id, userId, token, true);
      transactions.push(...transactionsForPocket);

      const pocketBalanceHistory = generatePocketBalanceHistory(
        pocket.creation_date,
        now.toISOString(),
        pocket,
        transactionsForPocket,
        true
      );
      balanceHistory.push(...pocketBalanceHistory);
    }
    console.log('total transactions', transactions.length);
    transactions.sort(transactionsCompareFn);

    const uniqueObjMap: { [key: string]: Transaction } = {};
    for (const transaction of transactions) {
      if (!uniqueObjMap[transaction.pocket_id + '+' + transaction.trn_id]) {
        uniqueObjMap[transaction.pocket_id + '+' + transaction.trn_id] = transaction;
      }
    }
    const uniqueTransactions = Object.values(uniqueObjMap);
    console.log('unique transactions', uniqueTransactions.length);

    // Map transactions to csv
    saveTransactionsCsv(pockets, transactions);
    saveBalanceHistoryCsv(balanceHistory.sort(balanceHistoryCompareFn));
  }
}

main()
  .catch((error) => console.error(error))
  .finally(async () => {
    process.exit();
  });

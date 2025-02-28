import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { Transaction, TransactionsResponse, TransactionsState } from '../models/transactions.interface';

const transactionsStateFileName = './db/transactions.json';
let directoryExists: boolean;
let state: TransactionsState;
let limit = 40;

async function fetchTransactions(
  pocketId: string,
  userId: string,
  token: string,
  next: string | undefined
): Promise<TransactionsResponse> {
  let transactionsUrl = `https://api.one.app/banking/pockets/${pocketId}/transaction/all?limit=${limit}&pocketId=${pocketId}&userId=${userId}`;
  if (next) {
    transactionsUrl += `&next=${next}`;
  }

  const options = {
    headers: new Headers([
      ['Authorization', `Bearer ${token}`],
      ['X-Safe-Request-ID', randomUUID()],
    ]),
  };
  const response = await fetch(transactionsUrl, options);
  // console.log(response.ok, response.status, response.statusText);

  if (response.ok) {
    const transactions: TransactionsResponse = await response.json();
    // console.log('transactions', transactions.transactions.length);
    // console.log('next?', transactions.next);
    return transactions;
  } else {
    const error = await response.text();
    console.error(error);
    throw new Error(error);
  }
}

function loadState() {
  try {
    if (directoryExists === undefined || !directoryExists) {
      directoryExists = existsSync('./db');
      if (!directoryExists) {
        mkdirSync('./db');
        writeFileSync(transactionsStateFileName, '{}');
      }
    }

    const stateString = readFileSync(transactionsStateFileName).toString();
    state = JSON.parse(stateString);
  } catch (error) {
    // console.error(error);
    if ((error as Error).message.includes('no such file or directory')) {
      state = {};
      writeFileSync(transactionsStateFileName, '{}');
    } else if ((error as Error).message.includes('Unexpected end of JSON input')) {
      state = {};
      writeFileSync(transactionsStateFileName, '{}');
    } else {
      state = {};
    }
  }
}

function saveState() {
  writeFileSync(transactionsStateFileName, JSON.stringify(state));
}

export async function fetchAllTransactions(
  pocketId: string,
  userId: string,
  token: string,
  endDate: string,
  recentOnly?: boolean
): Promise<Transaction[]> {
  const transactions: Transaction[] = [];
  let response: TransactionsResponse | undefined;
  let next: string | undefined;

  loadState();

  do {
    response = await fetchTransactions(pocketId, userId, token, next);
    const filteredTransactions = response.transactions.filter((transaction) => transaction.date < endDate);

    const lastUpdate = state[pocketId]?.lastUpdate;
    if (lastUpdate) {
      if (recentOnly) {
        filteredTransactions.sort(transactionsCompareFn);
        const olderTransaction = filteredTransactions.findIndex((transaction) => transaction.date <= lastUpdate.date);
        if (olderTransaction === 0) {
          console.log('no new transactions found');
          return [];
        }
        if (olderTransaction > 0) {
          console.log(`found ${filteredTransactions.length} transactions, but only ${olderTransaction} are new`);
          filteredTransactions.splice(olderTransaction, filteredTransactions.length - olderTransaction);
          transactions.push(...filteredTransactions);
          break;
        }
      }
    }

    console.log('fetched', filteredTransactions.length, 'new transactions');
    transactions.push(...filteredTransactions);
    next = response.next;
  } while (next);
  console.log('total transactions for pocket', transactions.length);

  // sort transactions
  transactions.sort(transactionsCompareFn);

  const lastTransaction = transactions[0];
  state[pocketId] = {
    lastUpdate: {
      date: lastTransaction.date,
      trn_id: lastTransaction.trn_id,
    },
  };
  saveState();

  return transactions;
}

export function transactionsCompareFn(a: Transaction, b: Transaction) {
  if ((a.user_transaction_date || a.date) > (b.user_transaction_date || b.date)) {
    // sort a before b, e.g. [a, b]
    return -1;
  } else if ((a.user_transaction_date || a.date) < (b.user_transaction_date || b.date)) {
    // sort a after b, e.g. [b, a]
    return 1;
  }
  // a must be equal to b
  return 0;
}

import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { BalanceHistory, BalanceHistoryState } from '../models/balance-history.interface';
import { Pocket } from '../models/pockets.interface';
import { Transaction } from '../models/transactions.interface';

const balanceHistoryStateFileName = './db/balance-history.json';
let directoryExists: boolean;
let state: BalanceHistoryState;

function addDays(date: Date | string, days: number): Date {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  date.setDate(date.getDate() + days);
  return date;
}

function loadState() {
  try {
    if (directoryExists === undefined || !directoryExists) {
      directoryExists = existsSync('./db');
      if (!directoryExists) {
        mkdirSync('./db');
        writeFileSync(balanceHistoryStateFileName, '{}');
      }
    }

    const stateString = readFileSync(balanceHistoryStateFileName).toString();
    state = JSON.parse(stateString);
  } catch (error) {
    // console.error(error);
    if ((error as Error).message.includes('no such file or directory')) {
      state = {};
      writeFileSync(balanceHistoryStateFileName, '{}');
    } else if ((error as Error).message.includes('Unexpected end of JSON input')) {
      state = {};
      writeFileSync(balanceHistoryStateFileName, '{}');
    } else {
      state = {};
    }
  }
}

function saveState() {
  writeFileSync(balanceHistoryStateFileName, JSON.stringify(state));
}

export function generatePocketBalanceHistory(
  start: string,
  end: string,
  pocket: Pocket,
  transactions: Transaction[],
  recentOnly?: boolean
): BalanceHistory[] {
  const { account_number, pocket_id, status, type } = pocket;
  const balanceHistory: BalanceHistory[] = [];
  const endDateString = new Date(end).toLocaleDateString('sv-SE');

  loadState();

  const transactionBalanceMap = transactions
    .reverse()
    .reduce<{ [date: string]: BalanceHistory[] }>((map, transaction) => {
      const { balance, date, pocket_id, pocket_name, user_transaction_date } = transaction;

      const transactionDate = new Date(user_transaction_date || date);
      const localDate = transactionDate.toLocaleDateString('sv-SE');
      const localTime = transactionDate.toLocaleTimeString();

      const history: BalanceHistory = {
        accountId: pocket_id.split('.')[1],
        accountName: pocket_name,
        accountNumber: `xxxx${account_number.slice(-4)}`,
        balance,
        balanceId: randomUUID().replace(/-/g, ''),
        date: localDate,
        dateTime: user_transaction_date || date,
        status,
        time: localTime,
        type,
      };
      if (!map[localDate]) {
        map[localDate] = [];
      }
      map[localDate].push(history);
      return map;
    }, {});

  let currentHistory = transactionBalanceMap[Object.keys(transactionBalanceMap)?.[0]]?.[0];
  if (
    (recentOnly && state[pocket_id]?.dateTime < currentHistory?.dateTime) ||
    (!currentHistory && state[pocket_id]?.dateTime)
  ) {
    currentHistory = state[pocket_id];
    start = currentHistory.dateTime;
    currentHistory.dateTime = currentHistory.date + end.slice(10);
    currentHistory.time = new Date(end).toLocaleTimeString();
  }

  // const transactionDates = Object.keys(transactionBalanceMap).sort();
  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setDate(endDate.getDate() + 1);
  for (const balanceDate = startDate; balanceDate < endDate; addDays(balanceDate, 1)) {
    const dateString = balanceDate.toLocaleDateString('sv-SE');

    if (transactionBalanceMap[dateString]) {
      balanceHistory.push(...transactionBalanceMap[dateString]);
      currentHistory = structuredClone(transactionBalanceMap[dateString][transactionBalanceMap[dateString].length - 1]);
      state[pocket_id] = currentHistory;
    } else {
      const historyClone = structuredClone(currentHistory);

      if (dateString > endDateString) {
        break;
      } else if (dateString === endDateString || addDays(historyClone.dateTime, 1) > new Date(end)) {
        historyClone.dateTime = end;
      } else {
        historyClone.dateTime = addDays(historyClone.dateTime, 1).toISOString();
      }

      historyClone.balanceId = randomUUID().replace(/-/g, '');
      historyClone.date = dateString;
      historyClone.time = new Date(historyClone.dateTime).toLocaleTimeString();
      balanceHistory.push(historyClone);
      currentHistory = historyClone;
      state[pocket_id] = historyClone;
      // const closestDate = transactionDates.find((tDate) => tDate < dateString);
      // let historyClone: BalanceHistory;
      // if (closestDate) {
      //   historyClone = structuredClone(transactionBalanceMap[closestDate][0]);
      // } else {
      //   historyClone = structuredClone(balanceHistory[balanceHistory.length - 1]);
      //   historyClone.balance = 0;
      // }
      // historyClone.date = dateString;
      // balanceHistory.push(historyClone);
    }
  }

  saveState();

  return balanceHistory;
}

export function balanceHistoryCompareFn(a: BalanceHistory, b: BalanceHistory) {
  if (a.date > b.date) {
    // sort a before b, e.g. [a, b]
    return -1;
  } else if (a.date < b.date) {
    // sort a after b, e.g. [b, a]
    return 1;
  }
  // a must be equal to b
  return 0;
}

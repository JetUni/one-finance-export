import { Pocket } from './pockets.interface';

export interface BalanceHistory {
  accountId: string;
  accountName: string;
  accountNumber: string;
  balance: number;
  balanceId: string;
  date: string;
  dateTime: string;
  status: Pocket['status'];
  time: string;
  type: Pocket['type'];
}

export interface BalanceHistoryState {
  [pocketId: string]: BalanceHistory;
}

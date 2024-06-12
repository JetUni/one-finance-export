export interface Transaction {
  trn_id: string;
  pocket_id: string;
  pocket_name: string;
  pocket_type: string;
  balance: number;
  amount: number;
  comment: string;
  sequence_number: number;
  entry_name: string;
  ccy_code: string;
  /**
   * @format date
   */
  date: string;
  /**
   * @description true for
   */
  is_debit: boolean;
  category: 'Transfer';
  description: string;
  user_created_pocket: boolean;
  /**
   * @format date
   */
  user_transaction_date: string;
  type: 'PostedTransaction';
  is_disputed: boolean;
  is_recurring: boolean;
  client_display: {
    title: string;
    description: string;
  };
}

export interface TransactionsResponse {
  next?: string;
  type: 'NEXT';
  transactions: Transaction[];
}

export interface TransactionsState {
  [pocketId: string]: {
    lastUpdate: {
      date: string;
      trn_id: string;
    };
  };
}

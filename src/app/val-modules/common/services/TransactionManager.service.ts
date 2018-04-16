import { BehaviorSubject } from 'rxjs/BehaviorSubject';
// import { Observable } from 'rxjs/Observable';
// import { of } from 'rxjs/observable/of';
import { Subject } from 'rxjs/Subject';

/**
 * TransactionItems are the combination of data needed to
 * hold a notification in the notifyQueue. New instances of
 * these are created by the push method when populating the queue.
 */
class TransactionItem<T>
{
   subject: BehaviorSubject<T> | Subject<T>;
   data: T;

   constructor(subject: BehaviorSubject<T> | Subject<T>, data: T) 
   {
      this.subject = subject;
      this.data = data;
   }
}

/**
 * A TransactionManager is optionally injected into a dataStore and provides them
 * with the ability to hold their notifications until the transaction is stopped.
 * The manager maintains the queue of held notifications and processes them when
 * the transaction is stopped.  Transactions are useful when you wish to notify
 * the application of a group of dataStore activities.
 */
export class TransactionManager
{
   private _inTransaction: boolean = false; // Simple flag to track if we are in a transaction or not
   private notifyQueue: Array<any> = [];    // A queue of pending notifications that need to go out after the transaction

   constructor() {}

   // ---------------------------------------------
   // Public transaction methods
   // ---------------------------------------------
   /**
    * Data stores can ask the transaction manager if they are not in a transaction
    */
   public notInTransaction() {
      return !this._inTransaction;
   }

   /**
    * Data stores can ask the transaction manager if they are in a transaction
    */
   public inTransaction() {
      return this._inTransaction;
   }

   /**
    * Starts a transaction by setting the _inTransaction flag to true.
    * During this time any data store that injects a TransactionManager will
    * have its notifications queued until the transaction is stopped.
    */
   public startTransaction()
   {
      console.log('TransactionManager.service.startTransaction fired');
      this._inTransaction = true;
   }

   /**
    * Stops the transaction and processes the queue of nofifications.
    * IMPORTANT: It is entirely up to the code that started the transaction
    * to stop it.  Otherwise the notifications may never go out.
    * Always have the pair of start and stop transaction calls.
    */
   public stopTransaction()
   {
      console.log('TransactionManager.service.stopTransaction fired - notifyQueue size: ', (this.notifyQueue != null) ? this.notifyQueue.length : null);
      this.notifyQueue.forEach(transactionItem => {
         console.log('TransactionManager.service typeof transactionItem: ', typeof transactionItem);
         if ((transactionItem instanceof TransactionItem))
         {
            console.log('TransactionManager.service.stopTransaction - notifying subject:', transactionItem);
            transactionItem.subject.next(transactionItem.data);
         }
         else
            console.log('TransactionManager.service.stopTransaction - cant notify a type of: ', typeof transactionItem);
      });
      this.notifyQueue = [];
      this._inTransaction = false;
   }

   /**
    * Allows data stores to push notifications into the queue
    * 
    * @param subject The Subject or BehaviorSubject
    * @param subjectData  The data the subject would notify with
    */
   public push(subject: any, subjectData: any) 
   {
      this.notifyQueue.push(new TransactionItem(subject, subjectData));
      console.log ('TransactionManager.service.push - pushed subject: ', subject, ', data: ', subjectData);
   }

   /**
    * Exposes a way to empty the queue of notifications.
    * Perhaps if there is an error condition midway through a transaction,
    * it may be desirable to fix the state and not notify the observers
    * about the parts that would have worked. This essentially would help
    * with the notification side of a rollback.
    */
   public clearQueue()
   {
      this.notifyQueue = [];
   }
}
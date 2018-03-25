export enum DAOBaseStatus 
{
   UNCHANGED = "UNCHANGED"
  ,UPDATE = "UPDATE"
  ,INSERT = "INSERT"
  ,DELETE = "DELETE"
}

export class BaseModel
{
   // ----------------------------------------------------------------------------
   // OBJECT STATUSES USED BY THE DAO
   // ----------------------------------------------------------------------------
   public dirty: Boolean;
   public baseStatus: DAOBaseStatus;

   BaseModel() {
      this.dirty = true;
      this.baseStatus = DAOBaseStatus.INSERT;
   }
}
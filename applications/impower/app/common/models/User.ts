import { UserRole } from './UserRole';

export interface UserResponse {
  userId: number;
  accessRights: UserRole[];
}

export class User {
    public userId: number;
    public username: string;
    public email: string;
    public displayName: string;
    public creationDate: Date;
    public deactivationDate: Date;
    public userRoles: UserRole[];
    public token: string;
    public acsUsername: string;
    public acsPassword: string;
}

import { UserRole } from './UserRole';

export class User {
    public userId: number;
    public username: string;
    public email: string;
    public clientName: string;
    public creationDate: Date;
    public deactivationDate: Date;
    public userRoles: UserRole[];
}
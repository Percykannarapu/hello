import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/components/common/messageservice';
import { UserService } from '../../services/user.service';
import { User } from '../../models/User';

@Component({
  selector: 'val-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [MessageService]
})
export class LoginComponent implements OnInit {

  public displayLoginSpinner: boolean = false;
  public growlMessages: string[] = new Array<string>();

  constructor(private router: Router, private authService: AuthService, private messageService: MessageService, private userService: UserService) { }

  ngOnInit() {
  }

  /**
   * Handle the user authentication request, this is done by invoking the auth service
   * @param loginForm the login form data from the UI
   */
  public onSubmit(loginForm: NgForm) {
    if (loginForm.value.username === '' || loginForm.value.password === '') {
      this.messageService.add({ severity: 'error', summary: 'Login Error', detail: 'You must enter both a username and password'});
      return;
    }
    this.displayLoginSpinner = true;
    this.authService.authenticate(loginForm.value.username, loginForm.value.password).subscribe(authenticated => {
      if (authenticated) {
        this.displayLoginSpinner = false;
        this.createUser(loginForm.value.username);
        this.router.navigate(['/']);
      }
      else {
        this.displayLoginSpinner = false;
        this.messageService.add({ severity: 'error', summary: 'Login Error', detail: 'Please check your username and password and try again'});
      }
    });
    
  }

  private createUser(username: string) {
    const user: User = new User();
    user.clientName = null;
    user.creationDate = null;
    user.deactivationDate = null;
    user.email = null;
    user.userId = null;
    user.username = username;
    user.userRoles = null;
    this.userService.setUser(user);
  }

}

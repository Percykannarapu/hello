import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/components/common/messageservice';

@Component({
  selector: 'val-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [MessageService]
})
export class LoginComponent implements OnInit {

  public displayLoginSpinner: boolean = false;
  public growlMessages: string[] = new Array<string>();

  constructor(private router: Router, private authService: AuthService, private messageService: MessageService) { }

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
        this.router.navigate(['/']);
      }
      else {
        this.displayLoginSpinner = false;
        this.messageService.add({ severity: 'error', summary: 'Login Error', detail: 'Please check your username and password and try again'});
      }
    });
    
  }

}

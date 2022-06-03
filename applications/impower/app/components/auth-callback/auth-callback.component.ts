import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/services/auth.service';
import { UserService } from 'app/services/user.service';
import { environment } from '../../../environments/environment';

declare let pendo: any;

@Component({
  selector: 'val-auth-callback',
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss']
})
export class AuthCallbackComponent implements OnInit {

  constructor(private authService: AuthService,
              private router: Router,
              private userService: UserService) { }

  ngOnInit() {
    this.authService.completeAuthentication().subscribe(() => {
      if (this.authService.isLoggedIn()) {
        //Initialize Pendo
        const email: string = this.userService.getUser().email;
        const username: string = this.userService.getUser().username;
        if (environment.production) {
          pendo.initialize({
            visitor: {
              id: username,
              email: email
            },
            account: {
              id: 'imPower',
              name: 'prod'
            }
          });
        }

        this.router.navigate(['/']);
      }
    });
  }
}

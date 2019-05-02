import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppNavigationService {

  constructor() { }

  getreviewPageUrl(rfpId: string, mediaPlanGroupNumber: number) : string {
    return `/apex/RFP_Media_Plan_Display?rfpId=${rfpId}&displayAll=true&groupId=${mediaPlanGroupNumber}`;
  }

  navigateTo(url: string) : void {
    window.location.href = url;
  }
}

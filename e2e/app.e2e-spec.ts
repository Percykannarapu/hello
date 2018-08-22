import { AppPage } from './app.po';
import { browser, By, element, by } from 'protractor';

describe('esri-angular-first-look App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
  });

  it('Login Test case', () => {
    page.navigateTo();
    browser.driver.fullscreen();
    browser.waitForAngularEnabled(false);
    const userNameField = browser.driver.findElement(By.name('username')).sendKeys('reddyn');
      const passwordField = browser.driver.findElement(By.name('password')).sendKeys('Jun@2018');
      // /html/body/app-root/div/div/div[2]/val-login/div/div/form/div[3]/div/button/span[2]
      // /html/body/app-root/div/div/div[2]/val-login/div/div/form/div[3]/div/button
      element(By.xpath('/html/body/app-root/div/div/div[2]/val-login/div/div/form/div[3]/div/button/span[2]')).click();
      
      browser.driver.sleep(20000);
     // browser.waitForAngular();
      element(By.cssContainingText('.topbar-items', 'Welcome, reddyn'));
      browser.driver.sleep(10000);
      //browser.waitForAngular();
      browser.driver.findElement(By.xpath('/html/body/app-root/div/div/div[2]/ng-component/div/div[1]/val-color-box/div/div/div[2]/div[2]/span[1]')).click();
      browser.driver.findElement(By.xpath('//*[@id="ui-tabpanel-3"]/val-discovery-input/div/form/div[1]/div[6]/p-dropdown')).click();
      browser.driver.findElement(By.xpath('//*[@id="ui-tabpanel-3"]/val-discovery-input/div/form/div[1]/div[6]/p-dropdown/div/div[4]/div/ul/li[2]')).click();

      browser.driver.findElement(By.className('colorboxPicker-count')).click();

      browser.driver.findElement(By.xpath('/html/body/app-root/div/div/div[2]/ng-component/div/div[2]/val-color-box/div/div/div[2]/div[2]/span[2]')).click(); // Click on Sites Box
      browser.driver.findElement(By.xpath('//*[@id="ui-tabpanel-0"]/p-accordion/div/p-accordiontab[2]')).click(); // Click on Manually Add Locations
      browser.driver.findElement(By.xpath('//*[@id="ui-accordiontab-1-content"]/div/val-geocoder/div/div/div/div[15]/button')).click(); // Do VPW
      element(By.xpath('//*[@id="ui-accordiontab-1-content"]/div/val-geocoder/div/div/div/div[14]/button')).click(); // Submit
      browser.driver.findElement(By.xpath('//*[@id="ui-tabpanel-2-label"]/span')).click(); // Define Trade Area
      browser.driver.findElement(By.xpath('//*[@id="ui-tabpanel-2"]/val-trade-area-tab/p-accordion/div/p-accordiontab[2]')).click(); //click Distance
      browser.driver.findElement(By.xpath('//*[@id="ui-accordiontab-4-content"]/div/val-site-type-selector/div/site-content/val-distance-trade-area/form/div[1]/div[1]/div/div[1]/div/input')).sendKeys('5'); // enter 5 mine Radius
      element(By.xpath('//*[@id="ui-accordiontab-4-content"]/div/val-site-type-selector/div/site-content/val-distance-trade-area/form/div[2]/div[2]/button')).click();
      browser.driver.sleep(20000);
      //browser.driver.findElement(By.xpath('')).click();

      
      const fd = require('fs');
      const csv = fd.readFileSync('C:\\Users\\reddyn\\Downloads\\GeoFootPrint_1_ZIP_2018072016542.csv', 'utf8');
    //  const reader = new FileReader();
      console.log('csv file::::', csv);
      browser.pause();
      

    //expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
  
});

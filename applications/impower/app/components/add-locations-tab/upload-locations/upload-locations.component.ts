import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FileUpload } from 'primeng/fileupload';
import * as XLSX from 'xlsx';

@Component({
  selector: 'val-upload-locations',
  templateUrl: './upload-locations.component.html',
  styleUrls: ['./upload-locations.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadLocationsComponent {

  @Input() label: string = '';
  @Output() upload = new EventEmitter<string[]>();
  @ViewChild('fileUpload', { static: true }) private fileUploadElement: FileUpload;

  private static excelToCsv(encodedString: string | ArrayBuffer) : string {
    const wb: XLSX.WorkBook = XLSX.read(encodedString, { type: 'binary' });
    const worksheetName: string = wb.SheetNames[0];
    const ws: XLSX.WorkSheet = wb.Sheets[worksheetName];
    return XLSX.utils.sheet_to_csv(ws);
  }

  public uploadFile(event: any) : void {
    const reader = new FileReader();
    const lineBreakRegEx = /\r\n|\n/;
    const name: String = event.files[0].name;
    if (name.includes('.xls')) {
      reader.readAsBinaryString(event.files[0]);
      reader.onload = () => {
        const csvBlob = UploadLocationsComponent.excelToCsv(reader.result);
        const rows = csvBlob.split(lineBreakRegEx);
        this.upload.emit(rows);
      };
    } else {
      reader.readAsText(event.files[0]);
      reader.onload = () => {
        const rows = (reader.result as string).split(lineBreakRegEx);
        this.upload.emit(rows);
      };
    }

    this.fileUploadElement.clear();
    // workaround for https://github.com/primefaces/primeng/issues/4816
    this.fileUploadElement.basicFileInput.nativeElement.value = '';
  }
}


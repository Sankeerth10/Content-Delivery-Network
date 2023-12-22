import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ServerComponent } from './server/server.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent {
  zone! : string;
  bucket!: string;
  la!: number;
  lo!: number;
  createdAt!: Date;

  edgeData: any = [];
  folders: any = [];
  notes: any = [];


  baseUrl = 'https://localhost:3001/';
  constructor(public dialog: MatDialog, public http: HttpClient) {
    this.http.get(this.baseUrl + 'edgeservers').subscribe(data => {
      console.log('edge data', data)
      this.edgeData = data;
      this.folders = this.edgeData.filter((e: any) => e.deletable === false);
      this.notes = this.edgeData.filter((e: any) => e.deletable === true);
      console.log(this.folders, this.notes)
    })
  }
  openDialog(): void {
    const dialogRef = this.dialog.open(ServerComponent, {
      data: {zone: this.zone, bucket: this.bucket, la: this.la, lo: this.lo},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log('result', result)
      if(result && result?.bucket && result?.zone && result?.la && result?.lo) {
        result['url'] = '../edgeservers/';
        result['deletable'] = true;
        this.http.post(this.baseUrl + 'create-edge-server', result).subscribe(data => {
          console.log('edge server created', data);
          location.reload();
        });
      }
    });
  }

  deleteEdge(edge: any) {
    this.http.delete(this.baseUrl + 'delete-edge-server/' + edge._id).subscribe(data => {
      console.log('edge server deleted', edge);
      location.reload();
    })
  }

}

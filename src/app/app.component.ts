import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {OsdService} from '../shared/osd.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  listOfImages = ['jbirh8hc' , 'lq1zqy8k', 'xqlcocpx'];
  selectedImageId: string;
  imageIds: string[] = [];

  constructor(
    private router: Router
  ) {}

  showImage() {
    this.router.navigate(['/viewer/' + this.imageIds]);
  }

  addNewImage() {
    this.imageIds.push(this.selectedImageId);
  }
}

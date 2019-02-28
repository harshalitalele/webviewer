import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  listOfImages = ['jbirh8hc' , 'lq1zqy8k', 'xqlcocpx'];
  selectedImageId: string;

  constructor(
    private router: Router
  ) {}

  showImage() {
    alert(this.selectedImageId);

    this.router.navigate(['/viewer/' + this.selectedImageId]);
  }
}

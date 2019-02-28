import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-image-container',
  templateUrl: 'image-container.component.html'
})
export class ImageContainerComponent implements OnInit {
  @Input() ids: string[];

  ngOnInit(): void {
    // initialize openseadragon
    // initialize our wrapper on top of it
    alert(this.ids);
  }

  showImage() {
    // call show image
  }

}

import { Subject } from 'rxjs';

export class OsdService {
  osdObj;

  private osdSubject = new Subject();
  currentOsd = this.osdSubject.asObservable();

  setOsd(osd) {
    this.osdObj = osd;
    this.osdSubject.next();
  }

  getOsd() {
    return this.osdObj;
  }
}

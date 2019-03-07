export class OsdService {
  osdObj;

  setOsd(osd) {
    this.osdObj = osd;
  }

  getOsd() {
    return this.osdObj;
  }
}

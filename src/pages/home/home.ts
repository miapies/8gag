import { Component } from '@angular/core';
import { ModalController } from 'ionic-angular';
import { SubirPage } from '../subir/subir';
import { CargaArchivoProvider } from '../../providers/carga-archivo/carga-archivo';

// Plugins
import { SocialSharing } from '@ionic-native/social-sharing';

import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
// import { AngularFireDatabase } from 'angularfire2/database';
// import { Observable } from 'rxjs/Observable';
import { Platform } from 'ionic-angular';
import { Facebook } from '@ionic-native/facebook';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  // posts: Observable<any[]>;
  hayMas = true;
  usuario: any = null;

  constructor(private modalCtrl: ModalController,
    public _cap: CargaArchivoProvider,
    private socialSharing: SocialSharing,
    private afAuth: AngularFireAuth,
    private fb: Facebook,
    private platform: Platform) {
    // this.posts = this.afDB.list('post').valueChanges();
    afAuth.authState.subscribe(user => {
      if (!user) {
        this.usuario = null;
        return;
      }
      this.usuario = user;
    });
  }

  login() {
    if (this.platform.is('cordova')) {
      return this.fb.login(['email', 'public_profile']).then(res => {
        const facebookCredential = firebase.auth.FacebookAuthProvider.credential(res.authResponse.accessToken);
        return firebase.auth().signInWithCredential(facebookCredential);
      })
    }
    else {
      this.afAuth.auth
        .signInWithPopup(new firebase.auth.FacebookAuthProvider())
        .then(res => console.log(res));
    }
  }

  logout() {
    this.afAuth.auth.signOut();
  }

  mostrar_modal() {
    const modal = this.modalCtrl.create(SubirPage);
    modal.present();
  }

  doInfinite(infiniteScroll) {
    console.log('Begin async operation');

    this._cap.cargar_imagenes().then(
      (hayMas: boolean) => {
        console.log(hayMas);
        this.hayMas = hayMas;
        infiniteScroll.complete();
      }
    );

  }

  compartir(post: any) {

    // Check if sharing via facebook is supported
    this.socialSharing.canShareVia('com.facebook.katana')
      .then(() => {
        this.convertToDataURLviaCanvas(post.img, "image/jpeg")
          .then(urldeimagen => {
            const urlbase64 = String(urldeimagen);
            console.log(urlbase64);
            this.socialSharing.shareViaFacebook(null, urlbase64, null)
              .then((data) => {
                console.log('Compartido a través de Facebook: '
                  + JSON.stringify(data));
                this._cap.mostrar_toast('Compartido a través de Facebook');
              })
              .catch((error) => {
                console.error('No fué compartido a través de Facebook: '
                  + JSON.stringify(error));
                this._cap.mostrar_toast('No fué compartido a través de Facebook: '
                  + JSON.stringify(error));
              });
          })
      })
      .catch((error) => {
        console.error('No se puede compartir a través de Facebook: '
          + JSON.stringify(error));
        this._cap.mostrar_toast('No se puede compartir a través de Facebook: '
          + JSON.stringify(error));
      });
  }

  private convertToDataURLviaCanvas(url, outputFormat) {
    return new Promise((resolve, reject) => {
      var img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        let canvas = <HTMLCanvasElement>document.createElement('CANVAS'),
          ctx = canvas.getContext('2d'), dataURL;
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img, 0, 0);
        dataURL = canvas.toDataURL(outputFormat);
        resolve(dataURL);
        canvas = null;
      };
      img.src = url;
    });
  }
}

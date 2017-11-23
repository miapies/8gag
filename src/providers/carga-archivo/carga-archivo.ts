import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';

import { AngularFireDatabase } from 'angularfire2/database';
import * as firebase from 'firebase';

@Injectable()
export class CargaArchivoProvider {

  imagenes: ArchivoSubir[] = [];
  lastKey: string = null;

  constructor(private toastCtrl: ToastController,
    private _afdb: AngularFireDatabase) {
    console.log('Hello CargaArchivoProvider Provider');
    this.cargar_ultimo_key()
      .subscribe(() => this.cargar_imagenes());
  }

  cargar_imagenes() {

    return new Promise((resolve, reject) => {

      this._afdb.list('post',
        ref => ref.limitToLast(3)
          .orderByKey().endAt(this.lastKey))
        .valueChanges()
        .subscribe((posts: any[]) => {

          posts.pop();

          if (posts.length === 0) {
            console.log('Ya no hay más registros');
            resolve(false);
            return;
          }

          this.lastKey = posts[0].key;
          console.log(this.lastKey);

          for (let i = posts.length - 1; i >= 0; i--) {
            this.imagenes.push(posts[i]);
          }

          resolve(true);

        });

    });

  }

  cargar_imagen_firebase(archivo: ArchivoSubir) {

    const promesa = new Promise((resolve, reject) => {

      this.mostrar_toast('Cargando...');

      const storeRef = firebase.storage().ref();
      const nombreArchivo = new Date().valueOf().toString(); // 121311313

      const uploadTask = storeRef.child(`img/${nombreArchivo}`)
        .putString(archivo.img, 'base64', { contentType: 'image/jpeg' });

      uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
        () => { }, // saber el % de cuantos Mbs se han subido
        (error) => {
          // manejo de error
          console.error('ERROR EN LA CARGA');
          console.error(JSON.stringify(error));
          this.mostrar_toast(JSON.stringify(error));
          reject();
        },
        () => {
          // Todo bien!!
          console.log('Archivo subido');
          this.mostrar_toast('Imagen cargada correctamente');
          const url = uploadTask.snapshot.downloadURL;
          this.crear_post(archivo.titulo, url, nombreArchivo);
          resolve();
        }
      );

    });

    return promesa;
  }

  private crear_post(titulo: string, url: string, nombreArchivo: string) {
    const post: ArchivoSubir = {
      img: url,
      titulo: titulo,
      key: nombreArchivo
    };

    console.log(JSON.stringify(post));

    // this._afdb.list('post').push(post)
    this._afdb.object(`/post/${nombreArchivo}`).update(post);
    this.imagenes.push(post);
  }

  private cargar_ultimo_key() {
    return this._afdb.list('post', ref => ref.orderByKey().limitToLast(1))
      .valueChanges()
      .map((post: any) => {
        console.log(JSON.stringify(post));
        this.lastKey = post[0].key;
        this.imagenes.push(post[0]);
      });
  }

  mostrar_toast(mensaje: string) {
    this.toastCtrl.create({
      message: mensaje,
      duration: 2000
    }).present();
  }

}

interface ArchivoSubir {
  titulo: string;
  img: string;
  key?: string;
}
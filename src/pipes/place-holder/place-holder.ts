import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'placeHolder',
})
export class PlaceHolderPipe implements PipeTransform {

  transform(value: string, defecto: string = 'Sin texto') {

    // if(value) {
    //   return value;
    // } else {
    //   return defecto;
    // }

    return (value) ? value : defecto;
  }
}

import { Injectable } from '@angular/core';
import { FormGroup, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidatorService {

  isFieldOneEqualFieldTwo(field1:string,field2:string){
    return (formGroup:FormGroup):ValidationErrors | null =>{
        const field1Value = formGroup.get(field1)?.value;
        const field2Value = formGroup.get(field2)?.value;
        if(field1Value !== field2Value){
            formGroup.get(field2)?.setErrors({notEqual:true});
            return {isNotEqual:true}
        }
        formGroup.get(field2)?.setErrors(null);
        return null;
    }
  }

}

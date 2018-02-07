import {Component} from '@angular/core';


export class Model1 {
    public id: number;
    public name: string;
    public attr1: string;
    public attr2: string;
    public attr3: string;
    public attr4: string;
}

export class Model2 {
    public id: number;
    public name: string;
    public attr1: string;
    public attr2: string;
    public attr3: string;
    public attr4: string;
}

@Component({
    templateUrl: './poc.component.html'
})
export class PocComponent {
    public model1: Model1[];
    public model2: Model2[];

    constructor() {
        
        this.model1 = new Array<Model1>();
        this.model2 = new Array<Model2>();

        const tmpModel1: Model1 = new Model1();
        const tmpModel2: Model2 = new Model2();
        
        tmpModel1.id = 12345;
        tmpModel1.name = 'ImpGeoffotprintLocation';
        tmpModel1.attr1 = 'coffee';
        tmpModel1.attr2 = 'banana';
        tmpModel1.attr3 = 'cough drops';
        tmpModel1.attr4 = 'things on my desk';
        this.model1.push(tmpModel1);
        
        tmpModel2.id = 67890;
        tmpModel2.name = 'ImpGeofootprintLocationAttribute';
        tmpModel2.attr1 = 'super awesome geo';
        tmpModel2.attr2 = 'people here love dogs';
        tmpModel2.attr3 = 'utopia';
        tmpModel2.attr4 = 'livonia';
        this.model2.push(tmpModel2);
    }
}
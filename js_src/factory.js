//general factory system

import {DATASTORE} from './datastore.js'

export class Factory {
  constructor(productClass, datastoreNameSpace) {
    this.productClass = productClass;
    this.datastoreNameSpace = datastoreNameSpace;
    this.knownTemplates = {};
  }

  learn(template){
    this.knownTemplates[template.templateName ? template.templateName : template.name] = template;

  }

  create(templateName) {
    let product = new this.productClass(this.knownTemplates[templateName]);
    product.state.name = product.name;
    DATASTORE[this.datastoreNameSpace][product.getID()] = product;
    return product;
  }
}

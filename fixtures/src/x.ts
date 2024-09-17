import _ from 'lodash';
export default class X {
  constructor() {
    this.name = 'Hello';
  }

  description() {
    return _.trim(this.name);
  }
}

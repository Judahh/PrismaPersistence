import { BaseDAO } from '../../source/index';
/* eslint-disable no-unused-vars */
export default class TestDAO extends BaseDAO {
  protected table = 'tests';

  protected insert = 'id';

  protected insertValues = '$1';

  protected updateQuery = '';

  constructor(initDefault) {
    super(initDefault);
    // console.log(this);
  }
}

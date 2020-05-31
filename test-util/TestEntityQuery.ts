import { GentQuery } from '..';
import { TestEntity } from './TestEntity';

export class TestEntityQuery extends GentQuery<TestEntity> {
  applyAccessControlRules(): void {}
}

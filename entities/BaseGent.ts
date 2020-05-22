import { EntitySchema } from 'mikro-orm';

export abstract class BaseGent {
  id!: number;
  createdAt = new Date();
  updatedAt = new Date();
}

export const schema = new EntitySchema<BaseGent>({
  name: 'BaseGent',
  abstract: true,
  properties: {
    id: { type: 'number', primary: true },
    createdAt: { type: 'Date', onCreate: () => new Date(), nullable: true },
    updatedAt: {
      type: 'Date',
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
      nullable: true,
    },
  },
});

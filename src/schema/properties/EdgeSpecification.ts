import { PropertySpecification } from './PropertySpecification';

export type ManyToOneSpecification = {
  fromMany: {
    inverseName: string;
  };
  toOne: PropertySpecification;
};

export type OneToManySpecification = {
  fromOne: {
    inverseName: string;
  };
  toMany: PropertySpecification;
};

// TODO:
// export type OneToOneSpecification = {
//   fromOne: {
//     inverseName: string;
//   };
//   toMany: PropertySpecification;
//   /**
//    * If true, this end of the edge will hold the other's foreign key.
//    */
//   isOwner: boolean;
// };

// TODO:
// export type ManyToManySpecification = {};

export type EdgeSpecification = ManyToOneSpecification | OneToManySpecification;
// | OneToOneSpecification
// | ManyToManySpecification;

export function isManyToOneSpecification(
  edgeSpec: EdgeSpecification,
): edgeSpec is ManyToOneSpecification {
  return edgeSpec.hasOwnProperty('fromMany') && edgeSpec.hasOwnProperty('toOne');
}

export function isOneToManySpecification(
  edgeSpec: EdgeSpecification,
): edgeSpec is OneToManySpecification {
  return edgeSpec.hasOwnProperty('fromOne') && edgeSpec.hasOwnProperty('toMany');
}

// export function isOneToOneSpecification(edgeSpec: EdgeSpecification): edgeSpec is OneToOneSpecification {
//   return edgeSpec.hasOwnProperty('fromOne') && edgeSpec.hasOwnProperty('toOne')
// }

// export function isManyToManySpecification(edgeSpec: EdgeSpecification): edgeSpec is ManyToManySpecification {
//   return edgeSpec.hasOwnProperty('fromMany') && edgeSpec.hasOwnProperty('toMany')
// }

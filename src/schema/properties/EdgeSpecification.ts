import { PropertySpecification } from "./PropertySpecification";

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
  edgeSpec: EdgeSpecification
): edgeSpec is ManyToOneSpecification {
  return (
    Object.prototype.hasOwnProperty.call(edgeSpec, "fromMany") &&
    Object.prototype.hasOwnProperty.call(edgeSpec, "toOne")
  );
}

export function isOneToManySpecification(
  edgeSpec: EdgeSpecification
): edgeSpec is OneToManySpecification {
  return (
    Object.prototype.hasOwnProperty.call(edgeSpec, "fromOne") &&
    Object.prototype.hasOwnProperty.call(edgeSpec, "toMany")
  );
}

// export function isOneToOneSpecification(
//   edgeSpec: EdgeSpecification
// ): edgeSpec is OneToOneSpecification {
//   return (
//     Object.prototype.hasOwnProperty.call(edgeSpec, "fromOne") &&
//     Object.prototype.hasOwnProperty.call(edgeSpec, "toOne")
//   );
// }

// export function isManyToManySpecification(
//   edgeSpec: EdgeSpecification
// ): edgeSpec is ManyToManySpecification {
//   return (
//     Object.prototype.hasOwnProperty.call(edgeSpec, "fromMany") &&
//     Object.prototype.hasOwnProperty.call(edgeSpec, "toMany")
//   );
// }

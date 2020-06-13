import { IdEntity } from "mikro-orm";

export interface GentModel extends IdEntity<GentModel> {
  id: number;
}

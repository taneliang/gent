import { IdEntity } from "mikro-orm";

export interface BaseGent extends IdEntity<BaseGent> {
  id: number;
}

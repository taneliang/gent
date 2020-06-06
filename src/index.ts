export * from "./entities";
export * from "./police";
export * from "./schema";
export * from "./Beltalowda";
export * from "./GentLoader";
export * from "./GentMutator";
export * from "./GentQuery";
export * from "./ViewerContext";

export { gentEntities } from "./orm";

import { initOrm } from "./orm";

export async function init(ormOptions: Parameters<typeof initOrm>) {
  await initOrm(...ormOptions);
}

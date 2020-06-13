export * from "./Beltalowda";
export * from "./GentLoader";
export * from "./GentModel";
export * from "./GentMutator";
export * from "./GentQuery";
export * from "./ViewerContext";
export * from "./orm";
export * from "./police";
export * from "./schema";

import { initOrm } from "./orm";

export async function init(
  ormOptions: Parameters<typeof initOrm>
): Promise<void> {
  await initOrm(...ormOptions);
}

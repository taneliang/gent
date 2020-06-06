export * from "./entities";
export * from "./orm";
export * from "./police";
export * from "./schema";
export * from "./Beltalowda";
export * from "./GentLoader";
export * from "./GentMutator";
export * from "./GentQuery";
export * from "./ViewerContext";

import { initOrm } from "./orm";

export async function init(
  ormOptions: Parameters<typeof initOrm>
): Promise<void> {
  await initOrm(...ormOptions);
}

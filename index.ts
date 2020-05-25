export * from './entities';
export * from './schema';
export * from './GentBeltalowda';
export * from './GentLoader';
export * from './GentQuery';
export * from './ViewerContext';

export { gentEntities } from './orm';

import { initOrm } from './orm';

export async function init(ormOptions: Parameters<typeof initOrm>) {
  await initOrm(...ormOptions);
}

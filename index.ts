export * from './ViewerContext';
export { gentEntities } from './orm';

import { initOrm } from './orm';

export async function init(ormOptions: Parameters<typeof initOrm>) {
  await initOrm(...ormOptions);
}

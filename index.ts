export * from './ViewerContext';

import { initOrm } from './orm';

export async function init(ormOptions: Parameters<typeof initOrm>) {
  await initOrm(...ormOptions);
}

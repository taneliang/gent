import { ViewerContext } from './ViewerContext';

export abstract class GentLoader {
  readonly vc: ViewerContext;

  constructor(vc: ViewerContext) {
    this.vc = vc;
  }
}

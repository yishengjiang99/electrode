"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import renderExecute from "./render-execute";

const {
  STEP_HANDLER,
  STEP_STR_TOKEN,
  STEP_NO_HANDLER,
  STEP_LITERAL_HANDLER
} = renderExecute.executeSteps;

export class RenderProcessor {
  renderSteps: any;
  constructor(options) {
    const insertTokenIds = Boolean(options.insertTokenIds);
    // the last handler wins if it contains a token
    const tokenHandlers = options.tokenHandlers.reverse();
    const makeNullRemovedStep = (tk, cause) => {
      return {
        tk,
        insertTokenId: false,
        code: STEP_LITERAL_HANDLER,
        data: `<!-- ${tk.id} removed due to its ${cause} -->\n`
      };
    };
    const makeHandlerStep = tk => {
      // look for first handler that has a token function for tk.id
      const handler = tokenHandlers.find(h => h.tokens.hasOwnProperty(tk.id));
      // no handler has function for token
      if (!handler) {
        const msg = `electrode-react-webapp: no handler found for token id ${tk.id}`;
        console.error(msg); // eslint-disable-line
        return { tk, code: STEP_NO_HANDLER };
      }
      const tkFunc = handler.tokens[tk.id];
      if (tkFunc === null) {
        if (insertTokenIds) return makeNullRemovedStep(tk, "handler set to null");
        return null;
      }
      if (typeof tkFunc !== "function") {
        // not a function, just add it to output
        return {
          tk,
          code: STEP_LITERAL_HANDLER,
          insertTokenId: insertTokenIds && !tk.props._noInsertId,
          data: tkFunc
        };
      }
      tk.setHandler(tkFunc);
      return { tk, code: STEP_HANDLER, insertTokenId: insertTokenIds && !tk.props._noInsertId };
    };
    const makeStep = tk => {
      // token is a literal string, just add it to output
      if (tk.hasOwnProperty("str")) {
        return { tk, code: STEP_STR_TOKEN };
      }
      // token is not pointing to a module, so lookup from token handlers
      if (!tk.isModule) return makeHandlerStep(tk);
      if (tk.custom === null) {
        if (insertTokenIds) return makeNullRemovedStep(tk, "process return null");
        return null;
      }
      return {
        tk,
        code: STEP_HANDLER,
        insertTokenId: options.insertTokenIds && !tk.props._noInsertId
      };
    };
    this.renderSteps = options.htmlTokens.map(makeStep).filter(x => x);
  }
  render(context) {
    return renderExecute.executeRenderSteps(this.renderSteps, context);
  }
}
module.exports = RenderProcessor;
//# sourceMappingURL=srenderer.js.map

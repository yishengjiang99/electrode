"use strict";
exports.__esModule = true;
/* eslint-disable complexity */
var render_context_1 = require("@xarc/render-context");
var executeSteps = {
    STEP_HANDLER: 0,
    STEP_STR_TOKEN: 1,
    STEP_NO_HANDLER: 2,
    STEP_LITERAL_HANDLER: 3
};
var STEP_HANDLER = executeSteps.STEP_HANDLER, STEP_STR_TOKEN = executeSteps.STEP_STR_TOKEN, STEP_NO_HANDLER = executeSteps.STEP_NO_HANDLER, STEP_LITERAL_HANDLER = executeSteps.STEP_LITERAL_HANDLER;
function renderNext(err, xt) {
    var renderSteps = xt.renderSteps, context = xt.context;
    if (err) {
        context.handleError(err);
    }
    var insertTokenId = function (tk) {
        context.output.add("<!-- BEGIN " + tk.id + " props: " + JSON.stringify(tk.props) + " -->\n");
    };
    var insertTokenIdEnd = function (tk) {
        context.output.add("<!-- " + tk.id + " END -->\n");
    };
    if (context.isFullStop || context.isVoidStop || xt.stepIndex >= renderSteps.length) {
        var r = context.output.close();
        xt.resolve(r);
        return null;
    }
    else {
        // TODO: support soft stop
        var step = renderSteps[xt.stepIndex++];
        var tk_1 = step.tk;
        var withId_1 = step.insertTokenId;
        switch (step.code) {
            case STEP_HANDLER:
                if (withId_1)
                    insertTokenId(tk_1);
                return context.handleTokenResult(tk_1.id, tk_1[render_context_1.TOKEN_HANDLER](context, tk_1), function (e) {
                    if (withId_1)
                        insertTokenIdEnd(tk_1);
                    return renderNext(e, xt);
                });
            case STEP_STR_TOKEN:
                context.output.add(tk_1.str);
                break;
            case STEP_NO_HANDLER:
                context.output.add("<!-- unhandled token " + tk_1.id + " -->");
                break;
            case STEP_LITERAL_HANDLER:
                if (withId_1)
                    insertTokenId(tk_1);
                context.output.add(step.data);
                if (withId_1)
                    insertTokenIdEnd(tk_1);
                break;
        }
        return renderNext(null, xt);
    }
}
function executeRenderSteps(renderSteps, context) {
    return new Promise(function (resolve) {
        var xt = { stepIndex: 0, renderSteps: renderSteps, context: context, resolve: resolve };
        return renderNext(null, xt);
    });
}
var RenderExecute = { executeRenderSteps: executeRenderSteps, renderNext: renderNext, executeSteps: executeSteps };
exports["default"] = RenderExecute;

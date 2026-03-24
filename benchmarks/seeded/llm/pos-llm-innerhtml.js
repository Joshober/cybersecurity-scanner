// SB-16: expect injection.llm.unsafe-html-output (and often injection.xss)
const el = {};
const completion = "<b>hi</b>";
el.innerHTML = completion;

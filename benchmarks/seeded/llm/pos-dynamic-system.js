// SB-14: expect injection.llm.dynamic-system-prompt
const user = "untrusted";
const opts = { model: "x", system: `You are helpful. ${user}` };

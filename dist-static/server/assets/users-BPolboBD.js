import { T as jsxRuntimeExports } from "./worker-entry-Be5YVpJa.js";
import { c as createLucideIcon } from "./createLucideIcon-iTdvThdZ.js";
function SectionHeader({ code, title, subtitle, right }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 mb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold tracking-widest uppercase", children: code }),
        subtitle && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-white/60 uppercase tracking-widest", children: [
          "• ",
          subtitle
        ] })
      ] }),
      right && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-in fade-in slide-in-from-right-4 duration-500", children: right })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent uppercase", children: title }) })
  ] });
}
const __iconNode = [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744", key: "16gr8j" }],
  ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }]
];
const Users = createLucideIcon("users", __iconNode);
export {
  SectionHeader as S,
  Users as U
};

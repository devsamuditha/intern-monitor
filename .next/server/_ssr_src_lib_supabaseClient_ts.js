"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_ssr_src_lib_supabaseClient_ts";
exports.ids = ["_ssr_src_lib_supabaseClient_ts"];
exports.modules = {

/***/ "(ssr)/./src/lib/supabaseClient.ts":
/*!***********************************!*\
  !*** ./src/lib/supabaseClient.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getSupabaseClient: () => (/* binding */ getSupabaseClient)\n/* harmony export */ });\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @supabase/supabase-js */ \"(ssr)/./node_modules/@supabase/supabase-js/dist/index.mjs\");\n\nlet supabaseClient = null;\nasync function getSupabaseClient() {\n    if (supabaseClient) return supabaseClient;\n    const url = \"https://njayljbkqfshhshupmgk.supabase.co\";\n    const anonKey = \"sb_publishable_9QZPe4Rkk7XdmahmRlDZrQ_fXPQj3T9\";\n    if (!url || !anonKey) {\n        throw new Error('Supabase client is not configured yet. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');\n    }\n    if (url.includes('PROJECT') || anonKey.includes('publishable_KEY')) {\n        throw new Error('Supabase is not configured yet.');\n    }\n    supabaseClient = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__.createClient)(url, anonKey);\n    return supabaseClient;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9zcmMvbGliL3N1cGFiYXNlQ2xpZW50LnRzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQXFFO0FBRXJFLElBQUlDLGlCQUF3QztBQUVyQyxlQUFlQztJQUNwQixJQUFJRCxnQkFBZ0IsT0FBT0E7SUFFM0IsTUFBTUUsTUFBTUMsMENBQW9DO0lBQ2hELE1BQU1HLFVBQVVILGdEQUF5QztJQUV6RCxJQUFJLENBQUNELE9BQU8sQ0FBQ0ksU0FBUztRQUNwQixNQUFNLElBQUlFLE1BQ1I7SUFFSjtJQUVBLElBQUlOLElBQUlPLFFBQVEsQ0FBQyxjQUFjSCxRQUFRRyxRQUFRLENBQUMsb0JBQW9CO1FBQ2xFLE1BQU0sSUFBSUQsTUFBTTtJQUNsQjtJQUVBUixpQkFBaUJELG1FQUFZQSxDQUFDRyxLQUFLSTtJQUNuQyxPQUFPTjtBQUNUIiwic291cmNlcyI6WyJEOlxcUHJvamVjdHNcXG1vbml0b3ItYXBwLTEuMlxcc3JjXFxsaWJcXHN1cGFiYXNlQ2xpZW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZUNsaWVudCwgU3VwYWJhc2VDbGllbnQgfSBmcm9tICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnO1xuXG5sZXQgc3VwYWJhc2VDbGllbnQ6IFN1cGFiYXNlQ2xpZW50IHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTdXBhYmFzZUNsaWVudCgpOiBQcm9taXNlPFN1cGFiYXNlQ2xpZW50PiB7XG4gIGlmIChzdXBhYmFzZUNsaWVudCkgcmV0dXJuIHN1cGFiYXNlQ2xpZW50O1xuXG4gIGNvbnN0IHVybCA9IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTCBhcyBzdHJpbmc7XG4gIGNvbnN0IGFub25LZXkgPSBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9BTk9OX0tFWSBhcyBzdHJpbmc7XG5cbiAgaWYgKCF1cmwgfHwgIWFub25LZXkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgJ1N1cGFiYXNlIGNsaWVudCBpcyBub3QgY29uZmlndXJlZCB5ZXQuIFBsZWFzZSBjb25maWd1cmUgTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMIGFuZCBORVhUX1BVQkxJQ19TVVBBQkFTRV9BTk9OX0tFWS4nXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgaWYgKHVybC5pbmNsdWRlcygnUFJPSkVDVCcpIHx8IGFub25LZXkuaW5jbHVkZXMoJ3B1Ymxpc2hhYmxlX0tFWScpKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1N1cGFiYXNlIGlzIG5vdCBjb25maWd1cmVkIHlldC4nKTtcclxuICB9XHJcblxyXG4gIHN1cGFiYXNlQ2xpZW50ID0gY3JlYXRlQ2xpZW50KHVybCwgYW5vbktleSk7XG4gIHJldHVybiBzdXBhYmFzZUNsaWVudDtcbn1cblxyXG4iXSwibmFtZXMiOlsiY3JlYXRlQ2xpZW50Iiwic3VwYWJhc2VDbGllbnQiLCJnZXRTdXBhYmFzZUNsaWVudCIsInVybCIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwiLCJhbm9uS2V5IiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfQU5PTl9LRVkiLCJFcnJvciIsImluY2x1ZGVzIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./src/lib/supabaseClient.ts\n");

/***/ })

};
;
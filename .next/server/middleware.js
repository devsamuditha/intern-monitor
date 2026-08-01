"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "middleware";
exports.ids = ["middleware"];
exports.modules = {

/***/ "(middleware)/./middleware.ts":
/*!***********************!*\
  !*** ./middleware.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   config: () => (/* binding */ config),\n/* harmony export */   middleware: () => (/* binding */ middleware),\n/* harmony export */   runtime: () => (/* binding */ runtime)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(middleware)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _src_lib_jwt__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/src/lib/jwt */ \"(middleware)/./src/lib/jwt.ts\");\n\n\nconst runtime = \"nodejs\";\nconst authFreePages = new Set([\n    \"/login\"\n]);\nfunction middleware(request) {\n    const response = next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.next();\n    response.headers.set(\"Content-Security-Policy\", \"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' ws: wss:; connect-src 'self' ws: wss: https://*.supabase.co https://*.pooler.supabase.com; img-src 'self' data: https: https://*.supabase.co https://*.pooler.supabase.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' blob:;\");\n    response.headers.set(\"Access-Control-Allow-Origin\", process.env.APP_URL || \"*\");\n    response.headers.set(\"Access-Control-Allow-Methods\", \"GET, POST, PUT, PATCH, DELETE, OPTIONS\");\n    response.headers.set(\"Access-Control-Allow-Headers\", \"Content-Type, Authorization\");\n    const { pathname } = request.nextUrl;\n    // API routes: auth is enforced per-route via withAuth (returns JSON 401, not redirects)\n    if (pathname.startsWith(\"/api/\")) {\n        return response;\n    }\n    const token = request.cookies.get(_src_lib_jwt__WEBPACK_IMPORTED_MODULE_1__.SESSION_COOKIE_NAME)?.value;\n    const payload = token ? (0,_src_lib_jwt__WEBPACK_IMPORTED_MODULE_1__.verifySession)(token) : null;\n    const hasValidSession = !!payload;\n    // Landing page: route based on auth state\n    if (pathname === \"/\") {\n        if (hasValidSession && !payload.mustChangePassword) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.redirect(new URL(\"/dashboard\", request.url));\n        }\n        if (hasValidSession && payload.mustChangePassword) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.redirect(new URL(\"/change-password\", request.url));\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.redirect(new URL(\"/login\", request.url));\n    }\n    // Login page: authenticated users with a fresh password go straight to the dashboard\n    if (authFreePages.has(pathname)) {\n        if (hasValidSession && !payload.mustChangePassword) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.redirect(new URL(\"/dashboard\", request.url));\n        }\n        return response;\n    }\n    // All remaining page routes require a valid session\n    if (!hasValidSession || !payload) {\n        const url = request.nextUrl.clone();\n        url.pathname = \"/login\";\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.redirect(url);\n    }\n    // /change-password is reachable for authenticated users (even those forced to reset)\n    if (pathname === \"/change-password\") {\n        return response;\n    }\n    // Force password change on first login for every other protected page\n    if (payload.mustChangePassword) {\n        const url = request.nextUrl.clone();\n        url.pathname = \"/change-password\";\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.redirect(url);\n    }\n    return response;\n}\nconst config = {\n    matcher: [\n        \"/((?!_next/static|_next/image|favicon.ico).*)\"\n    ]\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vbWlkZGxld2FyZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUEyQztBQUV3QjtBQUU1RCxNQUFNRyxVQUFVLFNBQVM7QUFFaEMsTUFBTUMsZ0JBQWdCLElBQUlDLElBQUk7SUFBQztDQUFTO0FBRWpDLFNBQVNDLFdBQVdDLE9BQW9CO0lBQzdDLE1BQU1DLFdBQVdSLHFEQUFZQSxDQUFDUyxJQUFJO0lBRWxDRCxTQUFTRSxPQUFPLENBQUNDLEdBQUcsQ0FDbEIsMkJBQ0E7SUFFRkgsU0FBU0UsT0FBTyxDQUFDQyxHQUFHLENBQ2xCLCtCQUNBQyxRQUFRQyxHQUFHLENBQUNDLE9BQU8sSUFBSTtJQUV6Qk4sU0FBU0UsT0FBTyxDQUFDQyxHQUFHLENBQ2xCLGdDQUNBO0lBRUZILFNBQVNFLE9BQU8sQ0FBQ0MsR0FBRyxDQUNsQixnQ0FDQTtJQUdGLE1BQU0sRUFBRUksUUFBUSxFQUFFLEdBQUdSLFFBQVFTLE9BQU87SUFFcEMsd0ZBQXdGO0lBQ3hGLElBQUlELFNBQVNFLFVBQVUsQ0FBQyxVQUFVO1FBQ2hDLE9BQU9UO0lBQ1Q7SUFFQSxNQUFNVSxRQUFRWCxRQUFRWSxPQUFPLENBQUNDLEdBQUcsQ0FBQ2xCLDZEQUFtQkEsR0FBR21CO0lBQ3hELE1BQU1DLFVBQVVKLFFBQVFqQiwyREFBYUEsQ0FBQ2lCLFNBQVM7SUFDL0MsTUFBTUssa0JBQWtCLENBQUMsQ0FBQ0Q7SUFFMUIsMENBQTBDO0lBQzFDLElBQUlQLGFBQWEsS0FBSztRQUNwQixJQUFJUSxtQkFBbUIsQ0FBQ0QsUUFBU0Usa0JBQWtCLEVBQUU7WUFDbkQsT0FBT3hCLHFEQUFZQSxDQUFDeUIsUUFBUSxDQUFDLElBQUlDLElBQUksY0FBY25CLFFBQVFvQixHQUFHO1FBQ2hFO1FBQ0EsSUFBSUosbUJBQW1CRCxRQUFTRSxrQkFBa0IsRUFBRTtZQUNsRCxPQUFPeEIscURBQVlBLENBQUN5QixRQUFRLENBQUMsSUFBSUMsSUFBSSxvQkFBb0JuQixRQUFRb0IsR0FBRztRQUN0RTtRQUNBLE9BQU8zQixxREFBWUEsQ0FBQ3lCLFFBQVEsQ0FBQyxJQUFJQyxJQUFJLFVBQVVuQixRQUFRb0IsR0FBRztJQUM1RDtJQUVBLHFGQUFxRjtJQUNyRixJQUFJdkIsY0FBY3dCLEdBQUcsQ0FBQ2IsV0FBVztRQUMvQixJQUFJUSxtQkFBbUIsQ0FBQ0QsUUFBU0Usa0JBQWtCLEVBQUU7WUFDbkQsT0FBT3hCLHFEQUFZQSxDQUFDeUIsUUFBUSxDQUFDLElBQUlDLElBQUksY0FBY25CLFFBQVFvQixHQUFHO1FBQ2hFO1FBQ0EsT0FBT25CO0lBQ1Q7SUFFQSxvREFBb0Q7SUFDcEQsSUFBSSxDQUFDZSxtQkFBbUIsQ0FBQ0QsU0FBUztRQUNoQyxNQUFNSyxNQUFNcEIsUUFBUVMsT0FBTyxDQUFDYSxLQUFLO1FBQ2pDRixJQUFJWixRQUFRLEdBQUc7UUFDZixPQUFPZixxREFBWUEsQ0FBQ3lCLFFBQVEsQ0FBQ0U7SUFDL0I7SUFFQSxxRkFBcUY7SUFDckYsSUFBSVosYUFBYSxvQkFBb0I7UUFDbkMsT0FBT1A7SUFDVDtJQUVBLHNFQUFzRTtJQUN0RSxJQUFJYyxRQUFRRSxrQkFBa0IsRUFBRTtRQUM5QixNQUFNRyxNQUFNcEIsUUFBUVMsT0FBTyxDQUFDYSxLQUFLO1FBQ2pDRixJQUFJWixRQUFRLEdBQUc7UUFDZixPQUFPZixxREFBWUEsQ0FBQ3lCLFFBQVEsQ0FBQ0U7SUFDL0I7SUFFQSxPQUFPbkI7QUFDVDtBQUVPLE1BQU1zQixTQUFTO0lBQ3BCQyxTQUFTO1FBQUM7S0FBZ0Q7QUFDNUQsRUFBRSIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFxIUFxcRGVza3RvcFxcbW9iLXByb2plY3RzXFxpbnRlcm4tbW9uaXRvclxcbWlkZGxld2FyZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVzcG9uc2UgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIjtcbmltcG9ydCB0eXBlIHsgTmV4dFJlcXVlc3QgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIjtcbmltcG9ydCB7IHZlcmlmeVNlc3Npb24sIFNFU1NJT05fQ09PS0lFX05BTUUgfSBmcm9tIFwiQC9zcmMvbGliL2p3dFwiO1xuXG5leHBvcnQgY29uc3QgcnVudGltZSA9IFwibm9kZWpzXCI7XG5cbmNvbnN0IGF1dGhGcmVlUGFnZXMgPSBuZXcgU2V0KFtcIi9sb2dpblwiXSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBtaWRkbGV3YXJlKHJlcXVlc3Q6IE5leHRSZXF1ZXN0KSB7XG4gIGNvbnN0IHJlc3BvbnNlID0gTmV4dFJlc3BvbnNlLm5leHQoKTtcblxuICByZXNwb25zZS5oZWFkZXJzLnNldChcbiAgICBcIkNvbnRlbnQtU2VjdXJpdHktUG9saWN5XCIsXG4gICAgXCJkZWZhdWx0LXNyYyAnc2VsZic7IHNjcmlwdC1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyAndW5zYWZlLWV2YWwnIHdzOiB3c3M6OyBjb25uZWN0LXNyYyAnc2VsZicgd3M6IHdzczogaHR0cHM6Ly8qLnN1cGFiYXNlLmNvIGh0dHBzOi8vKi5wb29sZXIuc3VwYWJhc2UuY29tOyBpbWctc3JjICdzZWxmJyBkYXRhOiBodHRwczogaHR0cHM6Ly8qLnN1cGFiYXNlLmNvIGh0dHBzOi8vKi5wb29sZXIuc3VwYWJhc2UuY29tOyBzdHlsZS1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyBodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tOyBzdHlsZS1zcmMtZWxlbSAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnIGh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb207IGZvbnQtc3JjICdzZWxmJyBkYXRhOiBodHRwczovL2ZvbnRzLmdzdGF0aWMuY29tOyBmcmFtZS1zcmMgJ3NlbGYnIGJsb2I6O1wiXG4gICk7XG4gIHJlc3BvbnNlLmhlYWRlcnMuc2V0KFxuICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIsXG4gICAgcHJvY2Vzcy5lbnYuQVBQX1VSTCB8fCBcIipcIlxuICApO1xuICByZXNwb25zZS5oZWFkZXJzLnNldChcbiAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIixcbiAgICBcIkdFVCwgUE9TVCwgUFVULCBQQVRDSCwgREVMRVRFLCBPUFRJT05TXCJcbiAgKTtcbiAgcmVzcG9uc2UuaGVhZGVycy5zZXQoXG4gICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsXG4gICAgXCJDb250ZW50LVR5cGUsIEF1dGhvcml6YXRpb25cIlxuICApO1xuXG4gIGNvbnN0IHsgcGF0aG5hbWUgfSA9IHJlcXVlc3QubmV4dFVybDtcblxuICAvLyBBUEkgcm91dGVzOiBhdXRoIGlzIGVuZm9yY2VkIHBlci1yb3V0ZSB2aWEgd2l0aEF1dGggKHJldHVybnMgSlNPTiA0MDEsIG5vdCByZWRpcmVjdHMpXG4gIGlmIChwYXRobmFtZS5zdGFydHNXaXRoKFwiL2FwaS9cIikpIHtcbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cblxuICBjb25zdCB0b2tlbiA9IHJlcXVlc3QuY29va2llcy5nZXQoU0VTU0lPTl9DT09LSUVfTkFNRSk/LnZhbHVlO1xuICBjb25zdCBwYXlsb2FkID0gdG9rZW4gPyB2ZXJpZnlTZXNzaW9uKHRva2VuKSA6IG51bGw7XG4gIGNvbnN0IGhhc1ZhbGlkU2Vzc2lvbiA9ICEhcGF5bG9hZDtcblxuICAvLyBMYW5kaW5nIHBhZ2U6IHJvdXRlIGJhc2VkIG9uIGF1dGggc3RhdGVcbiAgaWYgKHBhdGhuYW1lID09PSBcIi9cIikge1xuICAgIGlmIChoYXNWYWxpZFNlc3Npb24gJiYgIXBheWxvYWQhLm11c3RDaGFuZ2VQYXNzd29yZCkge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5yZWRpcmVjdChuZXcgVVJMKFwiL2Rhc2hib2FyZFwiLCByZXF1ZXN0LnVybCkpO1xuICAgIH1cbiAgICBpZiAoaGFzVmFsaWRTZXNzaW9uICYmIHBheWxvYWQhLm11c3RDaGFuZ2VQYXNzd29yZCkge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5yZWRpcmVjdChuZXcgVVJMKFwiL2NoYW5nZS1wYXNzd29yZFwiLCByZXF1ZXN0LnVybCkpO1xuICAgIH1cbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLnJlZGlyZWN0KG5ldyBVUkwoXCIvbG9naW5cIiwgcmVxdWVzdC51cmwpKTtcbiAgfVxuXG4gIC8vIExvZ2luIHBhZ2U6IGF1dGhlbnRpY2F0ZWQgdXNlcnMgd2l0aCBhIGZyZXNoIHBhc3N3b3JkIGdvIHN0cmFpZ2h0IHRvIHRoZSBkYXNoYm9hcmRcbiAgaWYgKGF1dGhGcmVlUGFnZXMuaGFzKHBhdGhuYW1lKSkge1xuICAgIGlmIChoYXNWYWxpZFNlc3Npb24gJiYgIXBheWxvYWQhLm11c3RDaGFuZ2VQYXNzd29yZCkge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5yZWRpcmVjdChuZXcgVVJMKFwiL2Rhc2hib2FyZFwiLCByZXF1ZXN0LnVybCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cblxuICAvLyBBbGwgcmVtYWluaW5nIHBhZ2Ugcm91dGVzIHJlcXVpcmUgYSB2YWxpZCBzZXNzaW9uXG4gIGlmICghaGFzVmFsaWRTZXNzaW9uIHx8ICFwYXlsb2FkKSB7XG4gICAgY29uc3QgdXJsID0gcmVxdWVzdC5uZXh0VXJsLmNsb25lKCk7XG4gICAgdXJsLnBhdGhuYW1lID0gXCIvbG9naW5cIjtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLnJlZGlyZWN0KHVybCk7XG4gIH1cblxuICAvLyAvY2hhbmdlLXBhc3N3b3JkIGlzIHJlYWNoYWJsZSBmb3IgYXV0aGVudGljYXRlZCB1c2VycyAoZXZlbiB0aG9zZSBmb3JjZWQgdG8gcmVzZXQpXG4gIGlmIChwYXRobmFtZSA9PT0gXCIvY2hhbmdlLXBhc3N3b3JkXCIpIHtcbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cblxuICAvLyBGb3JjZSBwYXNzd29yZCBjaGFuZ2Ugb24gZmlyc3QgbG9naW4gZm9yIGV2ZXJ5IG90aGVyIHByb3RlY3RlZCBwYWdlXG4gIGlmIChwYXlsb2FkLm11c3RDaGFuZ2VQYXNzd29yZCkge1xuICAgIGNvbnN0IHVybCA9IHJlcXVlc3QubmV4dFVybC5jbG9uZSgpO1xuICAgIHVybC5wYXRobmFtZSA9IFwiL2NoYW5nZS1wYXNzd29yZFwiO1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UucmVkaXJlY3QodXJsKTtcbiAgfVxuXG4gIHJldHVybiByZXNwb25zZTtcbn1cblxuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IHtcbiAgbWF0Y2hlcjogW1wiLygoPyFfbmV4dC9zdGF0aWN8X25leHQvaW1hZ2V8ZmF2aWNvbi5pY28pLiopXCJdLFxufTtcbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJ2ZXJpZnlTZXNzaW9uIiwiU0VTU0lPTl9DT09LSUVfTkFNRSIsInJ1bnRpbWUiLCJhdXRoRnJlZVBhZ2VzIiwiU2V0IiwibWlkZGxld2FyZSIsInJlcXVlc3QiLCJyZXNwb25zZSIsIm5leHQiLCJoZWFkZXJzIiwic2V0IiwicHJvY2VzcyIsImVudiIsIkFQUF9VUkwiLCJwYXRobmFtZSIsIm5leHRVcmwiLCJzdGFydHNXaXRoIiwidG9rZW4iLCJjb29raWVzIiwiZ2V0IiwidmFsdWUiLCJwYXlsb2FkIiwiaGFzVmFsaWRTZXNzaW9uIiwibXVzdENoYW5nZVBhc3N3b3JkIiwicmVkaXJlY3QiLCJVUkwiLCJ1cmwiLCJoYXMiLCJjbG9uZSIsImNvbmZpZyIsIm1hdGNoZXIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(middleware)/./middleware.ts\n");

/***/ }),

/***/ "(middleware)/./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=C%3A%5CUsers%5CHP%5CDesktop%5Cmob-projects%5Cintern-monitor%5Cmiddleware.ts&page=%2Fmiddleware&rootDir=C%3A%5CUsers%5CHP%5CDesktop%5Cmob-projects%5Cintern-monitor&matchers=&preferredRegion=&middlewareConfig=e30%3D!":
/*!************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=C%3A%5CUsers%5CHP%5CDesktop%5Cmob-projects%5Cintern-monitor%5Cmiddleware.ts&page=%2Fmiddleware&rootDir=C%3A%5CUsers%5CHP%5CDesktop%5Cmob-projects%5Cintern-monitor&matchers=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ nHandler)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/web/globals */ \"(middleware)/./node_modules/next/dist/server/web/globals.js\");\n/* harmony import */ var next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/web/adapter */ \"(middleware)/./node_modules/next/dist/server/web/adapter.js\");\n/* harmony import */ var next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _middleware_ts__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./middleware.ts */ \"(middleware)/./middleware.ts\");\n/* harmony import */ var next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next/dist/client/components/is-next-router-error */ \"(middleware)/./node_modules/next/dist/client/components/is-next-router-error.js\");\n/* harmony import */ var next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_3__);\n\n\n// Import the userland code.\n\n\n\nconst mod = {\n    ..._middleware_ts__WEBPACK_IMPORTED_MODULE_2__\n};\nconst handler = mod.middleware || mod.default;\nconst page = \"/middleware\";\nif (typeof handler !== 'function') {\n    throw Object.defineProperty(new Error(`The Middleware \"${page}\" must export a \\`middleware\\` or a \\`default\\` function`), \"__NEXT_ERROR_CODE\", {\n        value: \"E120\",\n        enumerable: false,\n        configurable: true\n    });\n}\n// Middleware will only sent out the FetchEvent to next server,\n// so load instrumentation module here and track the error inside middleware module.\nfunction errorHandledHandler(fn) {\n    return async (...args)=>{\n        try {\n            return await fn(...args);\n        } catch (err) {\n            // In development, error the navigation API usage in runtime,\n            // since it's not allowed to be used in middleware as it's outside of react component tree.\n            if (true) {\n                if ((0,next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_3__.isNextRouterError)(err)) {\n                    err.message = `Next.js navigation API is not allowed to be used in Middleware.`;\n                    throw err;\n                }\n            }\n            const req = args[0];\n            const url = new URL(req.url);\n            const resource = url.pathname + url.search;\n            await (0,next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_0__.edgeInstrumentationOnRequestError)(err, {\n                path: resource,\n                method: req.method,\n                headers: Object.fromEntries(req.headers.entries())\n            }, {\n                routerKind: 'Pages Router',\n                routePath: '/middleware',\n                routeType: 'middleware',\n                revalidateReason: undefined\n            });\n            throw err;\n        }\n    };\n}\nfunction nHandler(opts) {\n    return (0,next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_1__.adapter)({\n        ...opts,\n        page,\n        handler: errorHandledHandler(handler)\n    });\n}\n\n//# sourceMappingURL=middleware.js.map\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vbm9kZV9tb2R1bGVzL25leHQvZGlzdC9idWlsZC93ZWJwYWNrL2xvYWRlcnMvbmV4dC1taWRkbGV3YXJlLWxvYWRlci5qcz9hYnNvbHV0ZVBhZ2VQYXRoPUMlM0ElNUNVc2VycyU1Q0hQJTVDRGVza3RvcCU1Q21vYi1wcm9qZWN0cyU1Q2ludGVybi1tb25pdG9yJTVDbWlkZGxld2FyZS50cyZwYWdlPSUyRm1pZGRsZXdhcmUmcm9vdERpcj1DJTNBJTVDVXNlcnMlNUNIUCU1Q0Rlc2t0b3AlNUNtb2ItcHJvamVjdHMlNUNpbnRlcm4tbW9uaXRvciZtYXRjaGVycz0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBc0M7QUFDaUI7QUFDdkQ7QUFDd0M7QUFDeUM7QUFDSTtBQUNyRjtBQUNBLE9BQU8sMkNBQUk7QUFDWDtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZEQUE2RCxLQUFLO0FBQ2xFO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsZ0JBQWdCLElBQXFDO0FBQ3JELG9CQUFvQixtR0FBaUI7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IsK0ZBQWlDO0FBQ25EO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNlO0FBQ2YsV0FBVyxxRUFBTztBQUNsQjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUEiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXCJuZXh0L2Rpc3Qvc2VydmVyL3dlYi9nbG9iYWxzXCI7XG5pbXBvcnQgeyBhZGFwdGVyIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvd2ViL2FkYXB0ZXJcIjtcbi8vIEltcG9ydCB0aGUgdXNlcmxhbmQgY29kZS5cbmltcG9ydCAqIGFzIF9tb2QgZnJvbSBcIi4vbWlkZGxld2FyZS50c1wiO1xuaW1wb3J0IHsgZWRnZUluc3RydW1lbnRhdGlvbk9uUmVxdWVzdEVycm9yIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvd2ViL2dsb2JhbHNcIjtcbmltcG9ydCB7IGlzTmV4dFJvdXRlckVycm9yIH0gZnJvbSBcIm5leHQvZGlzdC9jbGllbnQvY29tcG9uZW50cy9pcy1uZXh0LXJvdXRlci1lcnJvclwiO1xuY29uc3QgbW9kID0ge1xuICAgIC4uLl9tb2Rcbn07XG5jb25zdCBoYW5kbGVyID0gbW9kLm1pZGRsZXdhcmUgfHwgbW9kLmRlZmF1bHQ7XG5jb25zdCBwYWdlID0gXCIvbWlkZGxld2FyZVwiO1xuaWYgKHR5cGVvZiBoYW5kbGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgT2JqZWN0LmRlZmluZVByb3BlcnR5KG5ldyBFcnJvcihgVGhlIE1pZGRsZXdhcmUgXCIke3BhZ2V9XCIgbXVzdCBleHBvcnQgYSBcXGBtaWRkbGV3YXJlXFxgIG9yIGEgXFxgZGVmYXVsdFxcYCBmdW5jdGlvbmApLCBcIl9fTkVYVF9FUlJPUl9DT0RFXCIsIHtcbiAgICAgICAgdmFsdWU6IFwiRTEyMFwiLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG59XG4vLyBNaWRkbGV3YXJlIHdpbGwgb25seSBzZW50IG91dCB0aGUgRmV0Y2hFdmVudCB0byBuZXh0IHNlcnZlcixcbi8vIHNvIGxvYWQgaW5zdHJ1bWVudGF0aW9uIG1vZHVsZSBoZXJlIGFuZCB0cmFjayB0aGUgZXJyb3IgaW5zaWRlIG1pZGRsZXdhcmUgbW9kdWxlLlxuZnVuY3Rpb24gZXJyb3JIYW5kbGVkSGFuZGxlcihmbikge1xuICAgIHJldHVybiBhc3luYyAoLi4uYXJncyk9PntcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBmbiguLi5hcmdzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAvLyBJbiBkZXZlbG9wbWVudCwgZXJyb3IgdGhlIG5hdmlnYXRpb24gQVBJIHVzYWdlIGluIHJ1bnRpbWUsXG4gICAgICAgICAgICAvLyBzaW5jZSBpdCdzIG5vdCBhbGxvd2VkIHRvIGJlIHVzZWQgaW4gbWlkZGxld2FyZSBhcyBpdCdzIG91dHNpZGUgb2YgcmVhY3QgY29tcG9uZW50IHRyZWUuXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgICAgICAgIGlmIChpc05leHRSb3V0ZXJFcnJvcihlcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVyci5tZXNzYWdlID0gYE5leHQuanMgbmF2aWdhdGlvbiBBUEkgaXMgbm90IGFsbG93ZWQgdG8gYmUgdXNlZCBpbiBNaWRkbGV3YXJlLmA7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXEgPSBhcmdzWzBdO1xuICAgICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc291cmNlID0gdXJsLnBhdGhuYW1lICsgdXJsLnNlYXJjaDtcbiAgICAgICAgICAgIGF3YWl0IGVkZ2VJbnN0cnVtZW50YXRpb25PblJlcXVlc3RFcnJvcihlcnIsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiByZXNvdXJjZSxcbiAgICAgICAgICAgICAgICBtZXRob2Q6IHJlcS5tZXRob2QsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogT2JqZWN0LmZyb21FbnRyaWVzKHJlcS5oZWFkZXJzLmVudHJpZXMoKSlcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICByb3V0ZXJLaW5kOiAnUGFnZXMgUm91dGVyJyxcbiAgICAgICAgICAgICAgICByb3V0ZVBhdGg6ICcvbWlkZGxld2FyZScsXG4gICAgICAgICAgICAgICAgcm91dGVUeXBlOiAnbWlkZGxld2FyZScsXG4gICAgICAgICAgICAgICAgcmV2YWxpZGF0ZVJlYXNvbjogdW5kZWZpbmVkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgIH07XG59XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBuSGFuZGxlcihvcHRzKSB7XG4gICAgcmV0dXJuIGFkYXB0ZXIoe1xuICAgICAgICAuLi5vcHRzLFxuICAgICAgICBwYWdlLFxuICAgICAgICBoYW5kbGVyOiBlcnJvckhhbmRsZWRIYW5kbGVyKGhhbmRsZXIpXG4gICAgfSk7XG59XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1pZGRsZXdhcmUuanMubWFwXG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(middleware)/./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=C%3A%5CUsers%5CHP%5CDesktop%5Cmob-projects%5Cintern-monitor%5Cmiddleware.ts&page=%2Fmiddleware&rootDir=C%3A%5CUsers%5CHP%5CDesktop%5Cmob-projects%5Cintern-monitor&matchers=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(middleware)/./src/lib/jwt.ts":
/*!************************!*\
  !*** ./src/lib/jwt.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   SESSION_COOKIE_NAME: () => (/* binding */ SESSION_COOKIE_NAME),\n/* harmony export */   getSessionCookieClearOptions: () => (/* binding */ getSessionCookieClearOptions),\n/* harmony export */   getSessionCookieOptions: () => (/* binding */ getSessionCookieOptions),\n/* harmony export */   getSessionMaxAge: () => (/* binding */ getSessionMaxAge),\n/* harmony export */   getSessionSecret: () => (/* binding */ getSessionSecret),\n/* harmony export */   signSession: () => (/* binding */ signSession),\n/* harmony export */   verifySession: () => (/* binding */ verifySession)\n/* harmony export */ });\n/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jsonwebtoken */ \"(middleware)/./node_modules/jsonwebtoken/index.js\");\n/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__);\n\nconst SESSION_COOKIE_NAME = \"session\";\nconst SESSION_SECRET = process.env.SESSION_SECRET || \"dev-secret-change-me\";\nconst SESSION_MAX_AGE = Number(process.env.SESSION_MAX_AGE || \"28800\");\nfunction getSessionSecret() {\n    return SESSION_SECRET;\n}\nfunction getSessionMaxAge() {\n    return SESSION_MAX_AGE;\n}\nfunction signSession(payload) {\n    return jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default().sign(payload, getSessionSecret(), {\n        expiresIn: SESSION_MAX_AGE\n    });\n}\nfunction verifySession(token) {\n    try {\n        return jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default().verify(token, getSessionSecret());\n    } catch  {\n        return null;\n    }\n}\nfunction getSessionCookieOptions() {\n    return {\n        maxAge: SESSION_MAX_AGE,\n        httpOnly: true,\n        secure: \"development\" === \"production\",\n        sameSite: \"strict\",\n        path: \"/\"\n    };\n}\nfunction getSessionCookieClearOptions() {\n    return {\n        maxAge: 0,\n        httpOnly: true,\n        secure: \"development\" === \"production\",\n        sameSite: \"strict\",\n        path: \"/\"\n    };\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vc3JjL2xpYi9qd3QudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQStCO0FBR3hCLE1BQU1DLHNCQUFzQixVQUFVO0FBUTdDLE1BQU1DLGlCQUFpQkMsUUFBUUMsR0FBRyxDQUFDRixjQUFjLElBQUk7QUFDckQsTUFBTUcsa0JBQWtCQyxPQUFPSCxRQUFRQyxHQUFHLENBQUNDLGVBQWUsSUFBSTtBQUV2RCxTQUFTRTtJQUNkLE9BQU9MO0FBQ1Q7QUFFTyxTQUFTTTtJQUNkLE9BQU9IO0FBQ1Q7QUFFTyxTQUFTSSxZQUFZQyxPQUF1QjtJQUNqRCxPQUFPVix3REFBUSxDQUFDVSxTQUFTSCxvQkFBb0I7UUFBRUssV0FBV1A7SUFBZ0I7QUFDNUU7QUFFTyxTQUFTUSxjQUFjQyxLQUFhO0lBQ3pDLElBQUk7UUFDRixPQUFPZCwwREFBVSxDQUFDYyxPQUFPUDtJQUMzQixFQUFFLE9BQU07UUFDTixPQUFPO0lBQ1Q7QUFDRjtBQUVPLFNBQVNTO0lBQ2QsT0FBTztRQUNMQyxRQUFRWjtRQUNSYSxVQUFVO1FBQ1ZDLFFBQVFoQixhQUFvQixLQUFLO1FBQ2pDa0IsVUFBVTtRQUNWQyxNQUFNO0lBQ1I7QUFDRjtBQUVPLFNBQVNDO0lBQ2QsT0FBTztRQUNMTixRQUFRO1FBQ1JDLFVBQVU7UUFDVkMsUUFBUWhCLGFBQW9CLEtBQUs7UUFDakNrQixVQUFVO1FBQ1ZDLE1BQU07SUFDUjtBQUNGIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXEhQXFxEZXNrdG9wXFxtb2ItcHJvamVjdHNcXGludGVybi1tb25pdG9yXFxzcmNcXGxpYlxcand0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBqd3QgZnJvbSBcImpzb253ZWJ0b2tlblwiO1xuaW1wb3J0IHsgUm9sZSB9IGZyb20gXCJAcHJpc21hL2NsaWVudFwiO1xuXG5leHBvcnQgY29uc3QgU0VTU0lPTl9DT09LSUVfTkFNRSA9IFwic2Vzc2lvblwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25QYXlsb2FkIHtcbiAgdXNlcklkOiBzdHJpbmc7XG4gIHJvbGU6IFJvbGU7XG4gIG11c3RDaGFuZ2VQYXNzd29yZDogYm9vbGVhbjtcbn1cblxuY29uc3QgU0VTU0lPTl9TRUNSRVQgPSBwcm9jZXNzLmVudi5TRVNTSU9OX1NFQ1JFVCB8fCBcImRldi1zZWNyZXQtY2hhbmdlLW1lXCI7XG5jb25zdCBTRVNTSU9OX01BWF9BR0UgPSBOdW1iZXIocHJvY2Vzcy5lbnYuU0VTU0lPTl9NQVhfQUdFIHx8IFwiMjg4MDBcIik7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZXNzaW9uU2VjcmV0KCk6IHN0cmluZyB7XG4gIHJldHVybiBTRVNTSU9OX1NFQ1JFVDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlc3Npb25NYXhBZ2UoKTogbnVtYmVyIHtcbiAgcmV0dXJuIFNFU1NJT05fTUFYX0FHRTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNpZ25TZXNzaW9uKHBheWxvYWQ6IFNlc3Npb25QYXlsb2FkKTogc3RyaW5nIHtcbiAgcmV0dXJuIGp3dC5zaWduKHBheWxvYWQsIGdldFNlc3Npb25TZWNyZXQoKSwgeyBleHBpcmVzSW46IFNFU1NJT05fTUFYX0FHRSB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZlcmlmeVNlc3Npb24odG9rZW46IHN0cmluZyk6IFNlc3Npb25QYXlsb2FkIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGp3dC52ZXJpZnkodG9rZW4sIGdldFNlc3Npb25TZWNyZXQoKSkgYXMgU2Vzc2lvblBheWxvYWQ7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZXNzaW9uQ29va2llT3B0aW9ucygpIHtcbiAgcmV0dXJuIHtcbiAgICBtYXhBZ2U6IFNFU1NJT05fTUFYX0FHRSxcbiAgICBodHRwT25seTogdHJ1ZSxcbiAgICBzZWN1cmU6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcInByb2R1Y3Rpb25cIixcbiAgICBzYW1lU2l0ZTogXCJzdHJpY3RcIiBhcyBjb25zdCxcbiAgICBwYXRoOiBcIi9cIixcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlc3Npb25Db29raWVDbGVhck9wdGlvbnMoKSB7XG4gIHJldHVybiB7XG4gICAgbWF4QWdlOiAwLFxuICAgIGh0dHBPbmx5OiB0cnVlLFxuICAgIHNlY3VyZTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwicHJvZHVjdGlvblwiLFxuICAgIHNhbWVTaXRlOiBcInN0cmljdFwiIGFzIGNvbnN0LFxuICAgIHBhdGg6IFwiL1wiLFxuICB9O1xufVxuIl0sIm5hbWVzIjpbImp3dCIsIlNFU1NJT05fQ09PS0lFX05BTUUiLCJTRVNTSU9OX1NFQ1JFVCIsInByb2Nlc3MiLCJlbnYiLCJTRVNTSU9OX01BWF9BR0UiLCJOdW1iZXIiLCJnZXRTZXNzaW9uU2VjcmV0IiwiZ2V0U2Vzc2lvbk1heEFnZSIsInNpZ25TZXNzaW9uIiwicGF5bG9hZCIsInNpZ24iLCJleHBpcmVzSW4iLCJ2ZXJpZnlTZXNzaW9uIiwidG9rZW4iLCJ2ZXJpZnkiLCJnZXRTZXNzaW9uQ29va2llT3B0aW9ucyIsIm1heEFnZSIsImh0dHBPbmx5Iiwic2VjdXJlIiwiTk9ERV9FTlYiLCJzYW1lU2l0ZSIsInBhdGgiLCJnZXRTZXNzaW9uQ29va2llQ2xlYXJPcHRpb25zIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(middleware)/./src/lib/jwt.ts\n");

/***/ }),

/***/ "../app-render/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/server/app-render/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/action-async-storage.external.js");

/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "../lib/cache-handlers/default.external":
/*!**************************************************************************!*\
  !*** external "next/dist/server/lib/cache-handlers/default.external.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/lib/cache-handlers/default.external.js");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "node:async_hooks":
/*!***********************************!*\
  !*** external "node:async_hooks" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("node:async_hooks");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/semver","vendor-chunks/jsonwebtoken","vendor-chunks/lodash.includes","vendor-chunks/jws","vendor-chunks/lodash.once","vendor-chunks/jwa","vendor-chunks/lodash.isinteger","vendor-chunks/ecdsa-sig-formatter","vendor-chunks/lodash.isplainobject","vendor-chunks/ms","vendor-chunks/lodash.isstring","vendor-chunks/lodash.isnumber","vendor-chunks/lodash.isboolean","vendor-chunks/safe-buffer","vendor-chunks/buffer-equal-constant-time"], () => (__webpack_exec__("(middleware)/./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=C%3A%5CUsers%5CHP%5CDesktop%5Cmob-projects%5Cintern-monitor%5Cmiddleware.ts&page=%2Fmiddleware&rootDir=C%3A%5CUsers%5CHP%5CDesktop%5Cmob-projects%5Cintern-monitor&matchers=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();
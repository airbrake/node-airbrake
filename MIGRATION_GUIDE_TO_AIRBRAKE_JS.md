Migration Guide to Airbrake JS
==============================

Airbrake JS repository: https://github.com/airbrake/airbrake-js

First, you need to change package to `airbrake-js`:

```diff
diff --git a/package.json b/package.json
index 76dad93..cabb3d1 100644
--- a/package.json
+++ b/package.json
@@ -9,6 +9,6 @@
   "author": "",
   "license": "ISC",
   "dependencies": {
-    "airbrake": "^2.1.0"
+    "airbrake-js": "^0.9.8"
   }
 }
```

Next, you need to update your Airbrake related code.

Plain Node app
--------------

Let's imagine we have a simple app with integrated Node Airbrake:

```js
var airbrake = require('airbrake').createClient(
  '113743'
  '81bbff95d52f8856c770bb39e827f3f6'
);
airbrake.handleExceptions();

throw new Error('I am an uncaught exception');
```

To migrate to Airbrake JS, you need to make the following changes:

```diff
diff --git a/index.js b/index.js
index f42bfc5..baeb7ef 100644
--- a/index.js
+++ b/index.js
@@ -1,7 +1,8 @@
-var airbrake = require('airbrake').createClient(
-  '113743'
-  '81bbff95d52f8856c770bb39e827f3f6'
-);
-airbrake.handleExceptions();
+var airbrakeJs = require('airbrake-js');
+
+var airbrake = new airbrakeJs({
+  projectId: '113743',
+  projectKey: '81bbff95d52f8856c770bb39e827f3f6'
+});

 throw new Error('I am an uncaught exception');
```

Hapi
----

https://github.com/airbrake/airbrake-js/blob/master/examples/hapi/server.js

Express
-------

https://github.com/airbrake/airbrake-js/blob/master/examples/express/app.js

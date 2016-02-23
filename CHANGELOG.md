# Airbrake Changelog

### master

* start sending user agent info from Express handler ([#79][79])
* make error handler's killing of process customizable ([#45][45])
* return a Buffer object from `notifyXML` to fix Errbit incompatibility ([#51][51])
* start safely serializing values with `json-stringify-safe` ([#60][60])
* remove hostname from the docs ([#61][61])
* update test suite to use Express 4.x ([#76][76])
* start using Circle CI ([#78][78])
* allow items to be excluded from CGI data ([#65][65])
* documentation fixes ([#68][68] and [#69][69])
* add ability to ignore exceptions ([#74][74])
* update default protocol to https ([#71][71])
* remove uncaught exception from tests ([#72][72])
* refactor `notify` into `_sendRequest` ([#73][73])
* make filtering of environment variables customizable ([#84][84])

[79]:https://github.com/airbrake/node-airbrake/pulls/79
[45]:https://github.com/airbrake/node-airbrake/pull/45
[51]:https://github.com/airbrake/node-airbrake/pull/51
[60]:https://github.com/airbrake/node-airbrake/pull/60
[61]:https://github.com/airbrake/node-airbrake/pull/61
[76]:https://github.com/airbrake/node-airbrake/pull/76
[78]:https://github.com/airbrake/node-airbrake/pull/78
[65]:https://github.com/airbrake/node-airbrake/pull/65
[68]:https://github.com/airbrake/node-airbrake/pull/68
[69]:https://github.com/airbrake/node-airbrake/pull/69
[74]:https://github.com/airbrake/node-airbrake/pull/74
[71]:https://github.com/airbrake/node-airbrake/pull/71
[72]:https://github.com/airbrake/node-airbrake/pull/72
[73]:https://github.com/airbrake/node-airbrake/pull/73
[84]:https://github.com/airbrake/node-airbrake/pull/84

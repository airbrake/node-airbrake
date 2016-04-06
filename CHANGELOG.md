# Airbrake Changelog

### master

### [v1.0.1][v1.0.1] (April 5, 2016)

* replace hasish with lodash ([#89][89])
* automatically parse repo and rev from local repo ([#88][88])
* stop defaulting to empty string when serializing line numbers

### [v1.0.0][v1.0.0] (March 2, 2016)

* update to JSON API ([#86][86])

### [v0.4.1][v0.4.1] (February 23, 2016)
### [v0.4.0][v0.4.0] (February 23, 2016)

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
* start accepting proxy as an option ([#85][85])

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
[85]:https://github.com/airbrake/node-airbrake/pull/85
[86]:https://github.com/airbrake/node-airbrake/pull/86
[88]:https://github.com/airbrake/node-airbrake/pull/88
[89]:https://github.com/airbrake/node-airbrake/pull/89
[v0.4.0]: https://github.com/airbrake/node-airbrake/releases/tag/v0.4.0
[v0.4.1]: https://github.com/airbrake/node-airbrake/releases/tag/v0.4.1
[v1.0.0]: https://github.com/airbrake/node-airbrake/releases/tag/v1.0.0
[v1.0.1]: https://github.com/airbrake/node-airbrake/releases/tag/v1.0.1

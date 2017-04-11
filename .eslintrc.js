module.exports = {
  extends: "airbnb-base/legacy",
  rules: {
    "no-console": 0,
    "func-names": 0,
    "vars-on-top": 0,
    "no-underscore-dangle": ["error", {
      allow: [
        '_onError',
        '_callback',
        '_sendRequest',
        '__type'
      ]
    }],
    "space-before-function-paren": ["error", "never"],
    quotes: 0,
    "no-unused-vars": ["error", {
      "argsIgnorePattern": "^_"
    }],
    "no-restricted-syntax": 0,
    "no-param-reassign": 0
  }
};

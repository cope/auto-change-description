# auto-change-description
[![build status](https://img.shields.io/travis/cope/auto-change-description.svg?branch=master)](https://travis-ci.org/cope/auto-change-description)
[![codacy](https://img.shields.io/codacy/grade/699db0a812494db3b674123551f74a61.svg)](https://www.codacy.com/project/cope/auto-change-description/dashboard)
[![coverage](https://img.shields.io/coveralls/github/cope/auto-change-description/master.svg)](https://coveralls.io/github/cope/auto-change-description?branch=master)
[![dependencies](https://david-dm.org/cope/auto-change-description.svg)](https://www.npmjs.com/package/auto-change-description)
[![npm](https://img.shields.io/npm/dt/auto-change-description.svg)](https://www.npmjs.com/package/auto-change-description)

This simple library compares two JSONs and lists the differences found as changes.

The library checks for created, deleted or modified plain attributes. This is done using [deep-diff](https://www.npmjs.com/package/deep-diff).

Array attributes are treated as plain attributes and compared using [deep-equal](https://www.npmjs.com/package/deep-equal). If arrays contain any objects or other arrays, those are not separately considered.

Objects are finally treated recursively.

# Install

With [npm](http://npmjs.org) do:
```
npm i --save auto-change-description
```

# Use

```
const acd = require('auto-change-description');
var results = acd.describe(before, after);
```

#### Example

Comparing these two JSONs:
```
    var before = {
        name: 'my object',
        puppy: 'yo',
        description: 'it\'s an object!',
        details: {
            it: 'has',
            an: 'array',
            with: ['a', 'few', 'elements']
        }
    };
    
    var after = {
        name: 'updated object',
        yo: 'puppy',
        description: 'it\'s an object!',
        details: {
            it: 'has',
            an: 'array',
            with: ['a', 'few', 'more', 'elements', {than: 'before'}]
        }
    };
```
Produces this output:
```
[
    'Deleted {puppy} with value (yo).',
    'Created {yo} with value (puppy).',
    'Modified {name} from (my object) to (updated object).',
    'Modified {details.with} from (["a","few","elements"]) to (["a","few","more","elements",{"than":"before"}]).'
]
```
The output was left as an array to allow free joining as people see fit, either with '\n' or '&lt;br&gt;' or whatever else.

The same logic was applied to {} and () wraps, to allow easy replacement with, for example, &lt;strong&gt;&lt;/strong&gt;, &lt;em&gt;&lt;/em&gt; or any other formatting syntaxes.

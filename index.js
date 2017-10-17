#!/usr/bin/env node

'use strict';

const _ = require('lodash');
const deepDiff = require('deep-diff').diff;
const deepEqual = require('deep-equal');

module.exports = {
	describe: describe	// before, after
};

function describe(before, after, root) {
	var descriptions = process(before, after, root);

	var deletions = _.filter(descriptions, function (result) {
		return result.type === 'delete';
	});

	var creates = _.filter(descriptions, function (result) {
		return result.type === 'create';
	});

	var edits = _.filter(descriptions, function (result) {
		return result.type === 'modify';
	});

	var results = [];
	_.forEach(deletions, function (difference) {
		results.push('Deleted {' + difference.path + '} with value (' + difference.value + ').');
	});
	_.forEach(creates, function (difference) {
		results.push('Created {' + difference.path + '} with value (' + difference.value + ').');
	});
	_.forEach(edits, function (difference) {
		results.push('Modified {' + difference.path + '} from (' + difference.from + ') to (' + difference.to + ').');
	});

	return results;
}

function process(before, after, root) {
	root = root || '';
	if (deepEqual(before, after)) {
		return ['No changes.'];
	}

	if ((_.isArray(before) && !_.isArray(after)) ||
		(_.isArray(after) && !_.isArray(before))) {
		return ['Comparing arrays with non-arrays is not allowed.'];
	}

	if (_.isArray(after) && _.isArray(before)) {
		return ['Changed  from (' + convertValue(before) + ') to (' + convertValue(after) + ').'];
	}

	var beforeArrays = extractArrays(before);
	before = _.omit(before, _.keys(beforeArrays));

	var afterArrays = extractArrays(after);
	after = _.omit(after, _.keys(afterArrays));

	var arrResults = processArrays(beforeArrays, afterArrays, root);

	var beforeObjects = extractObjects(before);
	before = _.omit(before, _.keys(beforeObjects));

	var afterObjects = extractObjects(after);
	after = _.omit(after, _.keys(afterObjects));

	var objResults = processObjects(beforeObjects, afterObjects, root);

	// Process the rest
	var results = [];
	var differences = deepDiff(before, after);
	_.forEach(differences, function (difference) {
		results.push(sortDifference(difference));
	});

	return _.concat(results, arrResults, objResults);
}

function extractArrays(parent) {
	var myArrays = {};
	_.forEach(parent, function (value, key) {
		if (_.isArray(value)) myArrays[key] = value;
	});
	return myArrays;
}

function extractObjects(parent) {
	var mzObjects = {};
	_.forEach(parent, function (value, key) {
		if (_.isPlainObject(value)) mzObjects[key] = value;
	});
	return mzObjects;
}

function processArrays(beforeArrays, afterArrays, root) {
	var results = [];
	var newRoot = createNewRoot(root);

	var deleted = _.keys(_.omit(beforeArrays, _.keys(afterArrays)));
	var created = _.keys(_.omit(afterArrays, _.keys(beforeArrays)));

	_.forEach(deleted, function (item) {
		results.push({path: newRoot + item, type: 'delete', value: convertValue(beforeArrays[item])});
	});
	_.forEach(created, function (item) {
		results.push({path: newRoot + item, type: 'create', value: convertValue(afterArrays[item])});
	});

	beforeArrays = _.omit(beforeArrays, deleted);
	_.forEach(beforeArrays, function (beforeArray, key) {
		var afterArray = afterArrays[key];
		if (afterArray) {
			if (!deepEqual(beforeArray, afterArray)) {
				results.push({path: newRoot + key, type: 'modify', from: convertValue(beforeArray), to: convertValue(afterArray)});
			}
		}
	});
	return results;
}

function processObjects(beforeObjects, afterObjects, root) {
	var results = [];
	var newRoot = createNewRoot(root);

	var deleted = _.keys(_.omit(beforeObjects, _.keys(afterObjects)));
	var created = _.keys(_.omit(afterObjects, _.keys(beforeObjects)));

	_.forEach(deleted, function (item) {
		results.push({path: item, type: 'delete', value: convertValue(beforeObjects[item])});
	});
	_.forEach(created, function (item) {
		results.push({path: item, type: 'create', value: convertValue(afterObjects[item])});
	});

	beforeObjects = _.omit(beforeObjects, deleted);
	_.forEach(beforeObjects, function (beforeObject, key) {
		var afterObject = afterObjects[key];
		if (afterObject) {
			if (!deepEqual(beforeObject, afterObject)) {
				results = _.concat(results, process(beforeObject, afterObject, newRoot + key));
			}
		}
	});
	return results;
}

function createNewRoot(root) {
	var newRoot = root || '';
	if (_.size(newRoot) > 0) newRoot += '.';
	return newRoot;
}

function sortDifference(difference) {
	var path = _.join(difference.path, '.');
	return convertDifference(difference, path);
}

function convertDifference(difference, path) {
	if ('N' !== difference.kind) difference.before = difference.lhs;
	if ('D' !== difference.kind) difference.after = difference.rhs;

	if ('D' === difference.kind) {
		return {path: path, type: 'delete', value: convertValue(difference.before)};
	} else if ('N' === difference.kind) {
		return {path: path, type: 'create', value: convertValue(difference.after)};
	} else if ('E' === difference.kind) {
		return {path: path, type: 'modify', from: convertValue(difference.before), to: convertValue(difference.after)};
	}
	return difference;
}

function convertValue(value) {
	return _.isString(value) ? value : JSON.stringify(value);
}
